#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# run-all-tests.sh
#
# Runs `npm test` (jest unit + integration) for every backend service.
# Prints a final pass/fail table.
#
# Usage:
#   ./run-all-tests.sh                 # all services
#   ./run-all-tests.sh auth complaint  # substring filter
#
# Prereqs:
#   - npm install --include=dev already done in each service
#     (one-off; happens automatically the first time you run
#     `npm install` or `npm ci --include=dev` in the service)
#
# What it does NOT run:
#   - Artillery performance tests (use ./loadtest-all.sh for those)
# ═══════════════════════════════════════════════════════════════════════════

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICES=(
  auth-service
  complaint-service
  community-service
  messaging-service
  notification-service
  job-service
)

filter_includes() {
  local svc="$1"; shift
  # After shifting the service name, no needles left → include everything.
  if [[ $# -eq 0 ]]; then return 0; fi
  for needle in "$@"; do
    if [[ "$svc" == *"$needle"* ]]; then return 0; fi
  done
  return 1
}

OVERALL_START="$(date +%s)"
declare -a RESULTS=()

for svc in "${SERVICES[@]}"; do
  if ! filter_includes "${svc}" "$@"; then
    echo ">>> skipping ${svc} (filtered)"
    continue
  fi

  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "  ${svc}"
  echo "════════════════════════════════════════════════════════════════════"

  svc_dir="${ROOT}/backend/services/${svc}"
  if [[ ! -d "${svc_dir}" ]]; then
    echo "!! ${svc_dir} not found — skipping"
    RESULTS+=("${svc}: SKIP (dir not found)")
    continue
  fi

  if ( cd "${svc_dir}" && npm test --silent ); then
    RESULTS+=("${svc}: PASS")
  else
    RESULTS+=("${svc}: FAIL")
  fi
done

OVERALL_END="$(date +%s)"
TOTAL_SECS=$(( OVERALL_END - OVERALL_START ))

echo
echo "════════════════════════════════════════════════════════════════════"
echo "  Summary  (${TOTAL_SECS}s total)"
echo "════════════════════════════════════════════════════════════════════"
fail_count=0
for line in "${RESULTS[@]}"; do
  echo "  ${line}"
  [[ "${line}" == *FAIL* ]] && fail_count=$((fail_count + 1))
done

if (( fail_count > 0 )); then
  echo
  echo "❌  ${fail_count} service(s) failed"
  exit 1
fi
echo
echo "✅  All services green"
