#!/usr/bin/env sh
set -eu

PORT="${1:-5610}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="$(basename "$ROOT_DIR")"
STAMP="$(date +%Y%m%d_%H%M%S)"
ZIP_NAME="${PROJECT_NAME}_${STAMP}.zip"
LINK_PAGE="download_link_${STAMP}.html"
LOG_FILE="/tmp/${PROJECT_NAME}_download_server_${PORT}.log"

cd "$ROOT_DIR"

echo "[quick-download] Packaging project..."
zip -rq "$ZIP_NAME" . -x ".git/*" "*.DS_Store" "${PROJECT_NAME}_*.zip" "download_link_*.html"
echo "[quick-download] Package ready: $ROOT_DIR/$ZIP_NAME"

cat > "$LINK_PAGE" <<EOF
<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>项目下载链接</title>
<style>body{font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px}a{color:#60a5fa}code{background:#1e293b;padding:2px 6px;border-radius:4px}</style></head>
<body><h2>项目打包完成</h2><p>点击下载：<a href="${ZIP_NAME}" download>下载 ${ZIP_NAME}</a></p><p>或复制链接：<code>http://127.0.0.1:${PORT}/${ZIP_NAME}</code></p></body></html>
EOF

if command -v nohup >/dev/null 2>&1; then
  nohup python3 -m http.server "$PORT" --directory "$ROOT_DIR" >"$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  sleep 1
  URL="http://127.0.0.1:${PORT}/${ZIP_NAME}"
  LINK_URL="http://127.0.0.1:${PORT}/${LINK_PAGE}"
  echo "[quick-download] Download URL: $URL"
  echo "[quick-download] Link Page: $LINK_URL"
  echo "[quick-download] Server PID: $SERVER_PID (stop with: kill $SERVER_PID)"
  if [ -n "${BROWSER:-}" ]; then
    "$BROWSER" "$LINK_URL" >/dev/null 2>&1 || true
  fi
else
  echo "[quick-download] nohup unavailable. Please manually copy: $ROOT_DIR/$ZIP_NAME"
fi
