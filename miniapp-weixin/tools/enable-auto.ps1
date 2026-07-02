# Enable WeChat DevTools automation for this repo.
# Reads paths from .cursor/mcp.json to avoid encoding issues with Chinese paths in this file.

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$McpFile = Join-Path $RepoRoot '.cursor\mcp.json'

if (-not (Test-Path -LiteralPath $McpFile)) {
  Write-Error "Missing $McpFile"
}

$mcp = Get-Content -LiteralPath $McpFile -Encoding UTF8 -Raw | ConvertFrom-Json
$cliArgs = @($mcp.mcpServers.'wechat-devtools'.args)

function Get-ArgValue([string]$prefix) {
  $hit = $cliArgs | Where-Object { $_ -like "$prefix*" } | Select-Object -First 1
  if (-not $hit) { return $null }
  return ($hit.Substring($prefix.Length) -replace '\\\\', '\')
}

function Test-IdeLogin([string]$Port) {
  try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/v2/islogin" -TimeoutSec 5
    return [bool]$resp.login
  } catch {
    return $false
  }
}

function Test-AutoPortListening([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

$Cli = Get-ArgValue '--cliPath='
$Project = Get-ArgValue '--projectPath='
$AutoPort = [int](Get-ArgValue '--port=')
if (-not $AutoPort) { $AutoPort = 9423 }

if (-not $Cli -or -not (Test-Path -LiteralPath $Cli)) {
  Write-Error "WeChat CLI not found. Check --cliPath in $McpFile"
}
if (-not $Project -or -not (Test-Path -LiteralPath $Project)) {
  Write-Error "Project path not found. Check --projectPath in $McpFile"
}

# Read IDE HTTP port from running DevTools user data (fallback 44825).
$IdePort = '44825'
$wechatUserData = Get-ChildItem -LiteralPath $env:LOCALAPPDATA -Directory -ErrorAction SilentlyContinue |
  Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'User Data\Default\.ide') } |
  Select-Object -First 1
if ($wechatUserData) {
  $IdePort = (Get-Content -LiteralPath (Join-Path $wechatUserData.FullName 'User Data\Default\.ide') -Raw).Trim()
}

Write-Host "[0/3] IDE HTTP port: $IdePort"
if (-not (Test-IdeLogin $IdePort)) {
  Write-Host ''
  Write-Host 'BLOCKED: WeChat DevTools is NOT logged in (需要重新登录).'
  Write-Host '  1. Open WeChat DevTools and sign in (scan QR in the IDE window), OR run:'
  Write-Host "     & `"$Cli`" --port $IdePort login"
  Write-Host '  2. Re-run this script after login succeeds.'
  exit 1
}
Write-Host '  login: OK'

# CLI also reads this hashed profile path on some installs.
if ($wechatUserData) {
  $ProfileDir = Join-Path $wechatUserData.FullName 'User Data\8bd760e6f7c30cca133c1a584f36db58\Default'
  Write-Host "[1/3] Fix CLI .ide profile (port $IdePort)..."
  New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null
  Set-Content -LiteralPath (Join-Path $ProfileDir '.ide') -Value $IdePort -NoNewline -Encoding ASCII
} else {
  Write-Host '[1/3] Skip .ide profile fix (DevTools user data not found).'
}

Write-Host "[2/3] Enable automation on ws://127.0.0.1:$AutoPort ..."
Write-Host "  CLI:     $Cli"
Write-Host "  Project: $Project"
Write-Host "  (If port in use, edit --port= in .cursor/mcp.json and retry.)"

$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
  $autoOut = cmd /c "echo y| `"$Cli`" --port $IdePort auto --project `"$Project`" --auto-port $AutoPort" 2>&1 | Out-String
} finally {
  $ErrorActionPreference = $prevEap
}
Write-Host $autoOut

if ($autoOut -match '需要重新登录|code:\s*10|\[error\].*code:\s*10') {
  Write-Host ''
  Write-Host 'BLOCKED: login expired during auto setup. Re-login in DevTools, then retry.'
  exit 1
}

Write-Host "[3/3] Verify ws://127.0.0.1:$AutoPort ..."
if ($autoOut -match 'Port \d+ is in use' -and (Test-AutoPortListening $AutoPort)) {
  Write-Host '  (automation port already active)'
}
if (-not (Test-AutoPortListening $AutoPort)) {
  Write-Host ''
  Write-Host 'FAILED: automation port is not listening.'
  Write-Host 'Keep ONE DevTools window with this project open, compile once, then retry.'
  exit 1
}

Write-Host ''
Write-Host "OK ws://127.0.0.1:$AutoPort"
Write-Host 'Reload Cursor window so MCP reconnects (Ctrl+Shift+P -> Developer: Reload Window).'
