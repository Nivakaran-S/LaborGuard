#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# loadtest-all.sh
#
# Runs the Artillery performance test against every backend service in turn:
#
#   1. Starts the service via `npm start` (reads its local .env)
#   2. Polls /health until it returns 200 (or aborts after 60 s)
#   3. Runs `npm run loadtest`, capturing the full report to
#      perf-reports/<service>.log
#   4. Stops the service before moving to the next one
#
# Sequential by design — running all six in parallel would all hit the same
# Atlas cluster and skew p95/p99 numbers. If you want to parallelise, do it
# from six separate terminals.
#
# Usage:
#   ./loadtest-all.sh                  # all services
#   ./loadtest-all.sh auth complaint   # only those two (positional substring match)
#
# Prereqs:
#   - npm install --include=dev already done in each service
#   - .env present in each service with a working MONGODB_URI
#   - bash + curl + Node available on PATH
#
# Output:
#   perf-reports/<service>.log         full Artillery report per service
#   perf-reports/<service>.summary.txt one-line p95/error-rate summary
# ═══════════════════════════════════════════════════════════════════════════

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS="${ROOT}/perf-reports"
mkdir -p "${REPORTS}"

# service-name : port (must match each service's .env PORT)
SERVICES=(
  "auth-service:5001"
  "community-service:5002"
  "complaint-service:5003"
  "notification-service:5004"
  "messaging-service:5005"
  "job-service:5006"
)

# Optional positional filter — `./loadtest-all.sh auth job` runs only those.
filter_includes() {
  local svc="$1"; shift
  # After shifting the service name, no needles left → include everything.
  if [[ $# -eq 0 ]]; then return 0; fi
  local needle
  for needle in "$@"; do
    if [[ "$svc" == *"$needle"* ]]; then return 0; fi
  done
  return 1
}

wait_for_health() {
  local url="$1"
  local timeout_secs="${2:-60}"
  local start now
  start="$(date +%s)"
  while true; do
    if curl -fsS -m 2 "${url}" >/dev/null 2>&1; then return 0; fi
    now="$(date +%s)"
    if (( now - start >= timeout_secs )); then return 1; fi
    sleep 1
  done
}

stop_pid() {
  local pid="$1"
  if [[ -z "${pid}" ]] || ! kill -0 "${pid}" 2>/dev/null; then return; fi
  # SIGINT first so the service can flush logs / close mongoose, then SIGKILL.
  kill -INT "${pid}" 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    if ! kill -0 "${pid}" 2>/dev/null; then return; fi
    sleep 1
  done
  kill -9 "${pid}" 2>/dev/null || true
}

OVERALL_START="$(date +%s)"
declare -a RESULTS=()

for spec in "${SERVICES[@]}"; do
  svc="${spec%%:*}"
  port="${spec##*:}"

  if ! filter_includes "${svc}" "$@"; then
    echo ">>> skipping ${svc} (filtered)"
    continue
  fi

  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "  ${svc}  (port ${port})"
  echo "════════════════════════════════════════════════════════════════════"

  svc_dir="${ROOT}/backend/services/${svc}"
  log="${REPORTS}/${svc}.log"
  : > "${log}"

  if [[ ! -d "${svc_dir}" ]]; then
    echo "!! ${svc_dir} not found — skipping"
    RESULTS+=("${svc}: SKIP (dir not found)")
    continue
  fi
  if [[ ! -f "${svc_dir}/.env" ]]; then
    echo "!! ${svc_dir}/.env missing — copy .env.example and try again"
    RESULTS+=("${svc}: SKIP (.env missing)")
    continue
  fi

  echo "[1/4] starting service…"
  ( cd "${svc_dir}" && npm start ) >>"${log}" 2>&1 &
  svc_pid=$!

  echo "[2/4] waiting for /health on port ${port}…"
  if ! wait_for_health "http://localhost:${port}/health" 60; then
    echo "!! /health didn't come up in 60 s — see ${log}"
    stop_pid "${svc_pid}"
    RESULTS+=("${svc}: FAIL (boot timeout)")
    continue
  fi
  echo "    health OK"

  echo "[3/4] running Artillery (≈2 min)…"
  if ( cd "${svc_dir}" && npx artillery run tests/performance/load-test.yml ) \
        >>"${log}" 2>&1; then
    status="OK"
  else
    status="ARTILLERY_FAIL"
  fi

  echo "[4/4] stopping service…"
  stop_pid "${svc_pid}"

  # Pull p95 / error rate / total req out of the Artillery report.
  summary_file="${REPORTS}/${svc}.summary.txt"
  {
    echo "=== ${svc} ==="
    grep -E "http\.request_rate|http\.response_time|http\.codes\.|errors\.|scenarios\.completed" "${log}" | tail -25
  } >"${summary_file}" 2>/dev/null || true

  echo "    report → ${log}"
  echo "    summary → ${summary_file}"
  RESULTS+=("${svc}: ${status}")
done

OVERALL_END="$(date +%s)"
TOTAL_SECS=$(( OVERALL_END - OVERALL_START ))

echo
echo "════════════════════════════════════════════════════════════════════"
echo "  Summary  (${TOTAL_SECS}s total)"
echo "════════════════════════════════════════════════════════════════════"
for line in "${RESULTS[@]}"; do
  echo "  ${line}"
done
echo
echo "All reports under: ${REPORTS}/"
