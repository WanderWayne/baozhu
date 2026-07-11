#!/usr/bin/env bash
# Enable WeChat DevTools automation for this repo (macOS).
# Reads paths from .cursor/mcp.json.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MCP_FILE="$REPO_ROOT/.cursor/mcp.json"

if [[ ! -f "$MCP_FILE" ]]; then
  echo "Missing $MCP_FILE" >&2
  exit 1
fi

read_mcp_arg() {
  local prefix="$1"
  node -e "
    const m = require('$MCP_FILE');
    const args = m.mcpServers['wechat-devtools'].args;
    const hit = args.find(a => a.startsWith('$prefix'));
    if (!hit) process.exit(1);
    console.log(hit.slice('$prefix'.length));
  "
}

CLI="$(read_mcp_arg '--cliPath=')"
PROJECT="$(read_mcp_arg '--projectPath=')"
AUTO_PORT="$(read_mcp_arg '--port=')"
AUTO_PORT="${AUTO_PORT:-9423}"

if [[ ! -x "$CLI" ]]; then
  echo "WeChat CLI not found: $CLI" >&2
  echo "Install WeChat DevTools from https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html" >&2
  exit 1
fi

if [[ ! -d "$PROJECT" ]]; then
  echo "Project path not found: $PROJECT" >&2
  exit 1
fi

# Read IDE HTTP port from DevTools user data (fallback 44825).
IDE_PORT="44825"
while IFS= read -r ide_file; do
  if [[ -f "$ide_file" ]]; then
    IDE_PORT="$(tr -d '[:space:]' < "$ide_file")"
    break
  fi
done < <(find "$HOME/Library/Application Support/微信开发者工具" -name ".ide" 2>/dev/null)

echo "[0/3] IDE HTTP port: $IDE_PORT"

LOGIN=$(curl -sf "http://127.0.0.1:${IDE_PORT}/v2/islogin" 2>/dev/null || echo '{"login":false}')
if ! echo "$LOGIN" | grep -q '"login":true'; then
  echo ""
  echo "BLOCKED: WeChat DevTools is NOT logged in (需要重新登录)."
  echo "  1. Open WeChat DevTools and sign in (scan QR), OR run:"
  echo "     \"$CLI\" --port \"$IDE_PORT\" login"
  echo "  2. Re-run this script after login succeeds."
  exit 1
fi
echo "  login: OK"

echo "[1/3] Enable automation on ws://127.0.0.1:${AUTO_PORT} ..."
echo "  CLI:     $CLI"
echo "  Project: $PROJECT"

AUTO_OUT=$(echo y | "$CLI" --port "$IDE_PORT" auto --project "$PROJECT" --auto-port "$AUTO_PORT" 2>&1 || true)
echo "$AUTO_OUT"

if echo "$AUTO_OUT" | grep -qE '需要重新登录|code:\s*10|\[error\].*code:\s*10'; then
  echo ""
  echo "BLOCKED: login expired during auto setup. Re-login in DevTools, then retry."
  exit 1
fi

echo "[2/3] Verify ws://127.0.0.1:${AUTO_PORT} ..."
if lsof -iTCP:"$AUTO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "  automation port listening: OK"
else
  echo ""
  echo "FAILED: automation port is not listening."
  echo "Keep ONE DevTools window with this project open, compile once, then retry."
  exit 1
fi

echo ""
echo "OK ws://127.0.0.1:${AUTO_PORT}"
echo "Reload Cursor window so MCP reconnects (Cmd+Shift+P -> Developer: Reload Window)."
