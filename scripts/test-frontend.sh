#!/usr/bin/env bash
# Run frontend unit tests with coverage
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[Frontend] Running vitest with coverage..."

cd "$ROOT_DIR"
npx vitest run --coverage "$@"
