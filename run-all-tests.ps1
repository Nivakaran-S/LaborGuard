# ═══════════════════════════════════════════════════════════════════════════
# run-all-tests.ps1
#
# PowerShell port of run-all-tests.sh for Windows users without Git Bash.
# Runs `npm test` (jest unit + integration) for every backend service and
# prints a pass/fail summary.
#
# Usage:
#   .\run-all-tests.ps1                       # all services
#   .\run-all-tests.ps1 -Filter auth, job     # substring filter
# ═══════════════════════════════════════════════════════════════════════════

param(
    [string[]]$Filter = @()
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

$Services = @(
    'auth-service'
    'complaint-service'
    'community-service'
    'messaging-service'
    'notification-service'
    'job-service'
)

function Test-FilterMatches {
    param([string]$Service, [string[]]$Needles)
    if (-not $Needles -or $Needles.Count -eq 0) { return $true }
    foreach ($n in $Needles) {
        if ($Service -like "*$n*") { return $true }
    }
    return $false
}

$OverallStart = Get-Date
$Results = @()

foreach ($svc in $Services) {
    if (-not (Test-FilterMatches $svc $Filter)) {
        Write-Host ">>> skipping $svc (filtered)"
        continue
    }

    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════════"
    Write-Host "  $svc"
    Write-Host "════════════════════════════════════════════════════════════════════"

    $svcDir = Join-Path $Root "backend/services/$svc"
    if (-not (Test-Path $svcDir)) {
        Write-Host "!! $svcDir not found — skipping"
        $Results += "${svc}: SKIP (dir not found)"
        continue
    }

    Push-Location $svcDir
    try {
        npm test --silent
        if ($LASTEXITCODE -eq 0) {
            $Results += "${svc}: PASS"
        } else {
            $Results += "${svc}: FAIL"
        }
    } finally {
        Pop-Location
    }
}

$TotalSecs = [int]((Get-Date) - $OverallStart).TotalSeconds

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════════"
Write-Host "  Summary  ($TotalSecs s total)"
Write-Host "════════════════════════════════════════════════════════════════════"
$failCount = 0
foreach ($line in $Results) {
    Write-Host "  $line"
    if ($line -like '*FAIL*') { $failCount++ }
}

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "X  $failCount service(s) failed"
    exit 1
}
Write-Host ""
Write-Host "OK  All services green"
