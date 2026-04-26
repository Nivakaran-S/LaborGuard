# ═══════════════════════════════════════════════════════════════════════════
# loadtest-all.ps1
#
# PowerShell port of loadtest-all.sh for Windows users without Git Bash.
# Identical behaviour:
#
#   1. Starts each service via `npm start` (reads its local .env)
#   2. Polls /health until 200 (or aborts after 60 s)
#   3. Runs `npm run loadtest`, captures the report to perf-reports/<service>.log
#   4. Stops the service before moving to the next
#
# Sequential by design — running concurrently would skew p95/p99 numbers
# because every service hits the same Atlas cluster.
#
# Usage:
#   .\loadtest-all.ps1                      # all services
#   .\loadtest-all.ps1 -Filter auth, job    # substring filter
# ═══════════════════════════════════════════════════════════════════════════

param(
    [string[]]$Filter = @()
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Reports = Join-Path $Root 'perf-reports'
New-Item -ItemType Directory -Path $Reports -Force | Out-Null

$Services = @(
    @{ Name = 'auth-service';         Port = 5001 }
    @{ Name = 'community-service';    Port = 5002 }
    @{ Name = 'complaint-service';    Port = 5003 }
    @{ Name = 'notification-service'; Port = 5004 }
    @{ Name = 'messaging-service';    Port = 5005 }
    @{ Name = 'job-service';          Port = 5006 }
)

function Test-FilterMatches {
    param([string]$Service, [string[]]$Needles)
    if (-not $Needles -or $Needles.Count -eq 0) { return $true }
    foreach ($n in $Needles) {
        if ($Service -like "*$n*") { return $true }
    }
    return $false
}

function Wait-ForHealth {
    param([string]$Url, [int]$TimeoutSecs = 60)
    $start = Get-Date
    while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSecs) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Stop-ServiceTree {
    param([int]$ParentPid)
    if (-not $ParentPid) { return }
    # Find the npm.cmd shell + its child node process and kill them all.
    try {
        $procs = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ParentPid"
        foreach ($p in $procs) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }
        Stop-Process -Id $ParentPid -Force -ErrorAction SilentlyContinue
    } catch { }
}

$Results = @()
$OverallStart = Get-Date

foreach ($s in $Services) {
    $svc = $s.Name
    $port = $s.Port

    if (-not (Test-FilterMatches $svc $Filter)) {
        Write-Host ">>> skipping $svc (filtered)"
        continue
    }

    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════════"
    Write-Host "  $svc  (port $port)"
    Write-Host "════════════════════════════════════════════════════════════════════"

    $svcDir = Join-Path $Root "backend/services/$svc"
    $log = Join-Path $Reports "$svc.log"
    Set-Content -Path $log -Value '' -Encoding utf8

    if (-not (Test-Path $svcDir)) {
        Write-Host "!! $svcDir not found — skipping"
        $Results += "${svc}: SKIP (dir not found)"
        continue
    }
    if (-not (Test-Path (Join-Path $svcDir '.env'))) {
        Write-Host "!! $svcDir\.env missing — copy .env.example and try again"
        $Results += "${svc}: SKIP (.env missing)"
        continue
    }

    Write-Host "[1/4] starting service…"
    $startProc = Start-Process -FilePath 'npm.cmd' `
        -ArgumentList 'start' `
        -WorkingDirectory $svcDir `
        -RedirectStandardOutput $log `
        -RedirectStandardError "$log.err" `
        -PassThru `
        -WindowStyle Hidden

    Write-Host "[2/4] waiting for /health on port $port…"
    if (-not (Wait-ForHealth "http://localhost:$port/health" 60)) {
        Write-Host "!! /health didn't come up in 60 s — see $log"
        Stop-ServiceTree $startProc.Id
        $Results += "${svc}: FAIL (boot timeout)"
        continue
    }
    Write-Host "    health OK"

    Write-Host "[3/4] running Artillery (≈2 min)…"
    $artilleryProc = Start-Process -FilePath 'npx.cmd' `
        -ArgumentList 'artillery', 'run', 'tests/performance/load-test.yml' `
        -WorkingDirectory $svcDir `
        -RedirectStandardOutput "$log.artillery" `
        -RedirectStandardError "$log.artillery.err" `
        -PassThru `
        -Wait `
        -WindowStyle Hidden

    Add-Content -Path $log -Value (Get-Content "$log.artillery" -Raw)
    Remove-Item "$log.artillery", "$log.artillery.err" -ErrorAction SilentlyContinue

    $status = if ($artilleryProc.ExitCode -eq 0) { 'OK' } else { 'ARTILLERY_FAIL' }

    Write-Host "[4/4] stopping service…"
    Stop-ServiceTree $startProc.Id

    # Pull a tiny summary out of the Artillery report
    $summaryFile = Join-Path $Reports "$svc.summary.txt"
    "=== $svc ===" | Out-File $summaryFile -Encoding utf8
    Select-String -Path $log -Pattern '(http\.request_rate|http\.response_time|http\.codes\.|errors\.|scenarios\.completed)' `
        | Select-Object -Last 25 `
        | ForEach-Object { $_.Line } `
        | Out-File $summaryFile -Append -Encoding utf8

    Write-Host "    report → $log"
    Write-Host "    summary → $summaryFile"
    $Results += "${svc}: $status"
}

$TotalSecs = [int]((Get-Date) - $OverallStart).TotalSeconds

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════"
Write-Host "  Summary  ($TotalSecs s total)"
Write-Host "════════════════════════════════════════════════════════════════════"
foreach ($line in $Results) { Write-Host "  $line" }
Write-Host ""
Write-Host "All reports under: $Reports\"
