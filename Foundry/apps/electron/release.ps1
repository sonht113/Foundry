# Foundry Release Script — Windows
# Usage: .\release.ps1
# Prerequisites: gh CLI authenticated, working directory = Foundry/apps/electron/

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$pkg = Get-Content package.json | ConvertFrom-Json
$version = $pkg.version

Write-Host "=== Foundry Release v$version ===" -ForegroundColor Cyan

# Step 1: Build
Write-Host "[1/5] Building..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# Step 2: Pack Windows installer
Write-Host "[2/5] Packing Windows installer..." -ForegroundColor Yellow
$env:GH_TOKEN = ""
npm run pack:win
if ($LASTEXITCODE -ne 0) { throw "Pack failed" }

$dist = "dist\installers"

# Step 3: Rename files to match GitHub asset naming (dots, not spaces)
Write-Host "[3/5] Renaming files..." -ForegroundColor Yellow
$exeFrom = Join-Path $dist "Foundry Setup $version.exe"
$exeTo   = Join-Path $dist "Foundry.Setup.$version.exe"
$blkFrom = Join-Path $dist "Foundry Setup $version.exe.blockmap"
$blkTo   = Join-Path $dist "Foundry.Setup.$version.exe.blockmap"

if (Test-Path $exeFrom) {
    Move-Item -LiteralPath $exeFrom -Destination $exeTo -Force
    Write-Host "  Renamed: Foundry Setup $version.exe -> Foundry.Setup.$version.exe"
}
if (Test-Path $blkFrom) {
    Move-Item -LiteralPath $blkFrom -Destination $blkTo -Force
    Write-Host "  Renamed: blockmap"
}

# Step 4: Fix latest.yml to use dots
Write-Host "[4/5] Fixing latest.yml..." -ForegroundColor Yellow
$latestYml = Join-Path $dist "latest.yml"
if (Test-Path $latestYml) {
    $content = Get-Content -LiteralPath $latestYml -Raw
    $content = $content -replace "Foundry-Setup-$version\.exe", "Foundry.Setup.$version.exe"
    $content = $content -replace "Foundry-Setup-$version\.exe\.blockmap", "Foundry.Setup.$version.exe.blockmap"
    Set-Content -LiteralPath $latestYml -Value $content -NoNewline
    Write-Host "  Fixed latest.yml: hyphens -> dots"
}

# Step 5: Create GitHub Release
Write-Host "[5/5] Creating GitHub release..." -ForegroundColor Yellow
$exeFile   = Join-Path $dist "Foundry.Setup.$version.exe"
$blkFile   = Join-Path $dist "Foundry.Setup.$version.exe.blockmap"

gh release create "v$version" $exeFile $blkFile $latestYml `
    --title "Foundry v$version" `
    --notes "Foundry v$version — Windows installer"

Write-Host "=== Done: https://github.com/sonht113/Foundry/releases/tag/v$version ===" -ForegroundColor Green
