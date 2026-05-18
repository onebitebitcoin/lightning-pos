#!/usr/bin/env bash
# Run backend tests with coverage
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV="$BACKEND_DIR/venv"

echo "[Backend] Running pytest with coverage..."

if [ ! -d "$VENV" ]; then
  echo "ERROR: Backend venv not found at $VENV. Run ./dev.sh first."
  exit 1
fi

source "$VENV/bin/activate"
cd "$BACKEND_DIR"
python -m pytest tests/ "$@"
