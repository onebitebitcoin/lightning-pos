#!/usr/bin/env bash
# Helper script to boot backend (Django) and frontend (Vite) dev servers together.
# Usage: ./run.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR"
BACKEND_VENV="$BACKEND_DIR/venv"

log() {
  printf "\033[1;34m[run.sh]\033[0m %s\n" "$*"
}

ensure_backend_env() {
  if [ ! -d "$BACKEND_VENV" ]; then
    log "Creating Python venv under backend/venv"
    python3 -m venv "$BACKEND_VENV"
  fi

  # shellcheck source=/dev/null
  source "$BACKEND_VENV/bin/activate"

  log "Installing backend requirements (if needed)"
  pip install --disable-pip-version-check -r "$BACKEND_DIR/requirements.txt" >/dev/null
}

ensure_frontend_env() {
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "Installing frontend dependencies"
    (cd "$FRONTEND_DIR" && npm install)
  fi
}

run_backend() {
  (
    set -e
    cd "$BACKEND_DIR"
    ensure_backend_env

    if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
      log "Applying Django migrations"
      python manage.py migrate
    else
      log "Skipping migrations (SKIP_MIGRATIONS=1)"
    fi

    log "Starting Django dev server on http://localhost:8001"
    python manage.py runserver 0.0.0.0:8001
  )
}

run_frontend() {
  (
    set -e
    cd "$FRONTEND_DIR"
    ensure_frontend_env
    log "Starting Vite dev server on http://localhost:5173"
    npm run dev
  )
}

cleanup() {
  log "Shutting down dev servers"
  trap - SIGINT SIGTERM EXIT
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM EXIT

run_backend &
BACKEND_PID=$!

run_frontend &
FRONTEND_PID=$!

log "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
log "Press Ctrl+C to stop both servers."

wait -n "$BACKEND_PID" "$FRONTEND_PID"
