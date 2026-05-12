#!/usr/bin/env bash
# Run Paperclip (port 3100) and the Worker Console (Vite, port 5173) together.
# Ctrl-C stops both.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d paperclip ]; then
  echo "paperclip/ missing. Run scripts/bootstrap.sh first." >&2
  exit 1
fi

cleanup() {
  trap - INT TERM
  [ -n "${PC_PID:-}" ] && kill "$PC_PID" 2>/dev/null || true
  [ -n "${UI_PID:-}" ] && kill "$UI_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

( cd paperclip && pnpm dev ) &
PC_PID=$!

( cd apps/web && npm run dev ) &
UI_PID=$!

wait
