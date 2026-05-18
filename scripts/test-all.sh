#!/usr/bin/env bash
# Run all tests (backend + frontend). Used in CI and manual verification.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED=0

echo "============================================"
echo " Running all tests"
echo "============================================"

echo ""
echo "--- Backend (pytest) ---"
if ! "$ROOT_DIR/scripts/test-backend.sh"; then
  echo "ERROR: Backend tests FAILED"
  FAILED=1
else
  echo "OK: Backend tests PASSED"
fi

echo ""
echo "--- Frontend (vitest) ---"
if ! "$ROOT_DIR/scripts/test-frontend.sh"; then
  echo "ERROR: Frontend tests FAILED"
  FAILED=1
else
  echo "OK: Frontend tests PASSED"
fi

echo ""
echo "============================================"
if [ "$FAILED" -eq 0 ]; then
  echo "ALL TESTS PASSED"
else
  echo "SOME TESTS FAILED - fix before pushing"
  exit 1
fi
