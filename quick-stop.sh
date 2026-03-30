#!/usr/bin/env sh
set -eu

PORT="${1:-5500}"

echo "[quick-stop] Stopping backend on port $PORT ..."

if command -v lsof >/dev/null 2>&1; then
  PID="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN || true)"
  if [ -z "$PID" ]; then
    echo "[quick-stop] No listening process found on port $PORT."
    exit 0
  fi
  kill "$PID" >/dev/null 2>&1 || true
  echo "[quick-stop] Stopped PID $PID on port $PORT."
  exit 0
fi

if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
  echo "[quick-stop] Requested stop on port $PORT via fuser."
  exit 0
fi

echo "[quick-stop] Neither lsof nor fuser is available. Please stop process manually."
