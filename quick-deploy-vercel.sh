#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="prod"

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "Usage: sh quick-deploy-vercel.sh [--preview]"
  echo "  --preview   Deploy preview instead of production"
  echo ""
  echo "Optional env:"
  echo "  VERCEL_TOKEN   Use token-based auth (CI/headless)"
  exit 0
fi

if [ "${1:-}" = "--preview" ]; then
  MODE="preview"
fi

cd "$ROOT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "[quick-deploy-vercel] npx not found. Please install Node.js first."
  exit 1
fi

echo "[quick-deploy-vercel] Root: $ROOT_DIR"
if [ "$MODE" = "preview" ]; then
  echo "[quick-deploy-vercel] Deploying preview..."
  if [ -n "${VERCEL_TOKEN:-}" ]; then
    npx vercel --yes --token "$VERCEL_TOKEN"
  else
    npx vercel --yes
  fi
else
  echo "[quick-deploy-vercel] Deploying production..."
  if [ -n "${VERCEL_TOKEN:-}" ]; then
    npx vercel --prod --yes --token "$VERCEL_TOKEN"
  else
    npx vercel --prod --yes
  fi
fi

