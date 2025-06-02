# PowerShell script to restore Pages Router structure
# Usage: ./restore-pages-router.ps1

Write-Host "Restoring Pages Router structure..." -ForegroundColor Green

# Get the project root (3 levels up from tools directory)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Write-Host "Project root: $projectRoot"

# Change to project root
Set-Location $projectRoot

# Restore pages directory structure
if (-not (Test-Path "pages")) {
    New-Item -ItemType Directory -Path "pages" -Force | Out-Null
}

# Move app/ocjs/page.tsx back to pages/index.tsx
if (Test-Path "app/ocjs/page.tsx") {
    Write-Host "  Moving: app/ocjs/page.tsx -> pages/index.tsx" -ForegroundColor Cyan
    Move-Item -Path "app/ocjs/page.tsx" -Destination "pages/index.tsx" -Force
}

# Remove app directory (keep only necessary files)
if (Test-Path "app") {
    Write-Host "  Removing app directory" -ForegroundColor Yellow
    Remove-Item -Path "app" -Recurse -Force
}

Write-Host "`nPages Router structure restored!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Update imports in pages/index.tsx" -ForegroundColor Yellow
Write-Host "  2. Ensure _app.tsx is properly configured" -ForegroundColor Yellow 