$ErrorActionPreference = "Stop"

Write-Host "=== O-Shine Agent Tool Setup (Windows) ===" -ForegroundColor Cyan

function Has-Command($name) {
    return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Ensure-JsonObject($obj) {
    if ($null -eq $obj) { return [PSCustomObject]@{} }
    return $obj
}

if (-not (Has-Command "node")) {
    Write-Host "ERROR: Node.js 18+ is required." -ForegroundColor Red
    exit 1
}
if (-not (Has-Command "npx")) {
    Write-Host "ERROR: npx was not found. Repair/reinstall Node.js/npm." -ForegroundColor Red
    exit 1
}
if (-not (Has-Command "uvx")) {
    Write-Host ""
    Write-Host "uvx was not found." -ForegroundColor Yellow
    Write-Host 'Install uv with: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"'
    Write-Host "Open a new PowerShell after installation, then run this script again."
    exit 1
}

Write-Host "Node/npx/uvx: OK" -ForegroundColor Green

$secure = Read-Host "Paste your Meshy API key (hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $meshyKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($meshyKey) -or -not $meshyKey.StartsWith("msy_")) {
    Write-Host "ERROR: Meshy API key should start with msy_." -ForegroundColor Red
    exit 1
}

# Store secret outside Git so Claude's .mcp.json can expand ${MESHY_API_KEY}.
[Environment]::SetEnvironmentVariable("MESHY_API_KEY", $meshyKey, "User")
$env:MESHY_API_KEY = $meshyKey
Write-Host "MESHY_API_KEY stored as a Windows user environment variable." -ForegroundColor Green

# Install/update Blender MCP addon.
Write-Host ""
Write-Host "Installing/updating Blender MCP addon..." -ForegroundColor Cyan
& uvx blender-mcp install-addon

# Configure Antigravity Meshy globally, because workspace mcp_config.json must remain secret-free.
$agDir = Join-Path $env:USERPROFILE ".gemini\config"
$agPath = Join-Path $agDir "mcp_config.json"
New-Item -ItemType Directory -Path $agDir -Force | Out-Null

$ag = $null
if (Test-Path $agPath) {
    try { $ag = Get-Content $agPath -Raw | ConvertFrom-Json }
    catch { throw "Existing Antigravity MCP config is invalid JSON: $agPath" }
}
$ag = Ensure-JsonObject $ag

if ($null -eq $ag.mcpServers) {
    $ag | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([PSCustomObject]@{})
}

$meshyServer = [PSCustomObject]@{
    command = "cmd"
    args = @("/c", "npx", "-y", "@meshy-ai/meshy-mcp-server")
    env = [PSCustomObject]@{
        MESHY_API_KEY = $meshyKey
    }
}

if ($null -ne $ag.mcpServers.PSObject.Properties["meshy"]) {
    $ag.mcpServers.meshy = $meshyServer
} else {
    $ag.mcpServers | Add-Member -NotePropertyName meshy -NotePropertyValue $meshyServer
}

$ag | ConvertTo-Json -Depth 20 | Set-Content -Path $agPath -Encoding UTF8
Write-Host "Antigravity Meshy MCP configured in user config: $agPath" -ForegroundColor Green

# Configure Codex user-level MCP if Codex is installed.
if (Has-Command "codex") {
    Write-Host ""
    Write-Host "Configuring Codex MCP servers..." -ForegroundColor Cyan

    $codexList = (& codex mcp list 2>&1 | Out-String)

    if ($codexList -match "(?m)^\s*meshy\b") {
        Write-Host "Codex Meshy MCP already exists; leaving it unchanged." -ForegroundColor Yellow
        Write-Host "If it is broken, remove/re-add it manually using docs/agents/SETUP_AGENT_TOOLS.md."
    } else {
        & codex mcp add meshy --env "MESHY_API_KEY=$meshyKey" -- cmd /c npx -y @meshy-ai/meshy-mcp-server
    }

    if ($codexList -match "(?m)^\s*blender\b") {
        Write-Host "Codex Blender MCP already exists; leaving it unchanged." -ForegroundColor Yellow
    } else {
        & codex mcp add blender --env "BLENDER_HOST=localhost" --env "BLENDER_PORT=9876" --env "BLENDER_MCP_SAFE_MODE=1" -- cmd /c uvx blender-mcp
    }
} else {
    Write-Host "Codex CLI not found; skipped Codex MCP registration." -ForegroundColor Yellow
}

Remove-Variable meshyKey

Write-Host ""
Write-Host "=== ONE-TIME MANUAL STEPS ===" -ForegroundColor Cyan
Write-Host "1. Restart Claude Code, Codex and Antigravity."
Write-Host "2. Open Blender -> Preferences -> Add-ons -> enable Interface: MCP for Blender."
Write-Host "3. In Blender 3D View press N -> Blender MCP -> Start MCP Server."
Write-Host "4. In Claude Code run /mcp and approve the project MCP servers once."
Write-Host "5. In Antigravity verify the workspace rule 'oshine-art' is Always On and /mcp shows Meshy + Blender."
Write-Host "6. In Codex verify 'codex mcp list' shows Meshy + Blender."
Write-Host ""
Write-Host "After that, the repository carries the workflow automatically." -ForegroundColor Green
