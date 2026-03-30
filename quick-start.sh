#!/usr/bin/env sh
set -eu

PORT="5500"
MODE="backend"
if [ "${1:-}" = "--file" ]; then
  MODE="file"
elif [ -n "${1:-}" ]; then
  PORT="$1"
fi
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
URL="http://127.0.0.1:${PORT}/index.html"
INDEX_FILE="$ROOT_DIR/index.html"

cd "$ROOT_DIR"

open_browser(){
  target="$1"
  if [ -n "${BROWSER:-}" ]; then
    "$BROWSER" "$target" >/dev/null 2>&1 && return 0 || true
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$target" >/dev/null 2>&1 && return 0 || true
  fi
  if command -v open >/dev/null 2>&1; then
    open "$target" >/dev/null 2>&1 && return 0 || true
  fi
  return 1
}

PY_CMD=""
if [ -x "$ROOT_DIR/.venv/bin/python" ]; then
  PY_CMD="$ROOT_DIR/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
  PY_CMD="python"
fi

if [ -z "$PY_CMD" ]; then
  echo "[quick-start] Python not found. Opening index.html directly..."
  if ! open_browser "$INDEX_FILE"; then
    echo "[quick-start] Please open manually: $INDEX_FILE"
  fi
  exit 0
fi

if [ "$MODE" = "file" ]; then
  echo "[quick-start] Opening index.html directly (--file mode)..."
  if ! open_browser "$INDEX_FILE"; then
    echo "[quick-start] Please open manually: $INDEX_FILE"
  fi
  exit 0
fi

echo "[quick-start] Starting local backend DB server at $URL"
if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[quick-start] Backend already listening on port $PORT"
else
  nohup "$PY_CMD" backend/server.py --port "$PORT" >/tmp/clarification_tracker_backend_${PORT}.log 2>&1 &
fi

sleep 1
if ! open_browser "$URL"; then
  echo "[quick-start] Browser auto-open skipped. Open manually: $URL"
fi
echo "[quick-start] Backend running in background. You can close this terminal."
