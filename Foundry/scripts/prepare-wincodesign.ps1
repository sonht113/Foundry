$ErrorActionPreference = "Continue"
$cache = Join-Path $env:LOCALAPPDATA "electron-builder\Cache\winCodeSign"
$dest = Join-Path $cache "winCodeSign-2.6.0"
$sevenZip = "D:\Work\Task_Kanban\Foundry\node_modules\.pnpm\7zip-bin@5.2.0\node_modules\7zip-bin\win\x64\7za.exe"

New-Item -ItemType Directory -Path $dest -Force | Out-Null

$archives = Get-ChildItem $cache -Filter "*.7z"
if ($archives.Count -eq 0) {
    Write-Host "No 7z archives found in cache"
    exit 1
}

foreach ($archive in $archives) {
    $tmp = Join-Path $cache "__tmp_extract"
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $tmp -Force | Out-Null
    
    Write-Host "Extracting: $($archive.Name)"
    & $sevenZip x $archive.FullName "-o$tmp" -aoa -y 2>&1 | Out-Null
    
    Get-ChildItem $tmp -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($tmp.Length + 1)
        $target = Join-Path $dest $rel
        $parent = Split-Path $target -Parent
        if (!(Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        Copy-Item $_.FullName $target -Force -ErrorAction SilentlyContinue
    }
    
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Cache prepared at: $dest"
Write-Host "Files:"
Get-ChildItem $dest -Recurse -File -Name
