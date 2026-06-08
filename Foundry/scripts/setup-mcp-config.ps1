$appData = $env:APPDATA
$serverPath = "D:\Work\Task_Kanban\Foundry\apps\mcp-server\dist\server.js"

$config = @{
    mcpServers = @{
        foundry = @{
            command = "node"
            args = @($serverPath)
            env = @{
                SQLITE_DATA_DIR = Join-Path $appData "Foundry\foundry.db"
            }
        }
    }
}

$opencodeDir = Join-Path $appData "opencode"
New-Item -ItemType Directory -Path $opencodeDir -Force | Out-Null
$config | ConvertTo-Json -Depth 3 | Out-File -FilePath (Join-Path $opencodeDir "opencode.jsonc") -Encoding utf8 -Force
Write-Host "Created: $(Join-Path $opencodeDir 'opencode.jsonc')"

$claudeCodeDir = Join-Path $appData "Claude Code"
New-Item -ItemType Directory -Path $claudeCodeDir -Force | Out-Null
$config | ConvertTo-Json -Depth 3 | Out-File -FilePath (Join-Path $claudeCodeDir "settings.json") -Encoding utf8 -Force
Write-Host "Created: $(Join-Path $claudeCodeDir 'settings.json')"
