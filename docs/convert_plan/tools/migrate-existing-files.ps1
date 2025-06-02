# PowerShell script to migrate existing files to new structure
# Usage: ./migrate-existing-files.ps1

Write-Host "Starting existing files migration..." -ForegroundColor Green

# Get the project root (3 levels up from tools directory)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Write-Host "Project root: $projectRoot"

# Change to project root
Set-Location $projectRoot

# Create components directory if it doesn't exist
$componentsDir = Join-Path $projectRoot "components"
if (-not (Test-Path $componentsDir)) {
    New-Item -ItemType Directory -Path $componentsDir -Force | Out-Null
}

# Move src/OCJSViewport.tsx to components/
if (Test-Path "src/OCJSViewport.tsx") {
    Write-Host "  Moving: src/OCJSViewport.tsx -> components/OCJSViewport.tsx" -ForegroundColor Cyan
    Move-Item -Path "src/OCJSViewport.tsx" -Destination "components/OCJSViewport.tsx" -Force
}

# Move src/shapeToUrl.ts to lib/
if (Test-Path "src/shapeToUrl.ts") {
    Write-Host "  Moving: src/shapeToUrl.ts -> lib/shapeToUrl.ts" -ForegroundColor Cyan
    Move-Item -Path "src/shapeToUrl.ts" -Destination "lib/shapeToUrl.ts" -Force
}

# Create app directory structure for existing pages
$appDir = Join-Path $projectRoot "app"

# Move pages/index.tsx content to app/ocjs/page.tsx
if (Test-Path "pages/index.tsx") {
    $ocjsDir = Join-Path $appDir "ocjs"
    New-Item -ItemType Directory -Path $ocjsDir -Force | Out-Null
    Write-Host "  Moving: pages/index.tsx -> app/ocjs/page.tsx" -ForegroundColor Cyan
    Move-Item -Path "pages/index.tsx" -Destination "$ocjsDir/page.tsx" -Force
}

# Keep pages/api as is for now (Next.js 12 API routes)
Write-Host "  Keeping: pages/api (API routes will remain in pages directory)" -ForegroundColor Yellow

# Remove empty src directory if exists
if (Test-Path "src") {
    $srcFiles = Get-ChildItem -Path "src" -Recurse -File
    if ($srcFiles.Count -eq 0) {
        Write-Host "  Removing empty src directory" -ForegroundColor DarkGray
        Remove-Item -Path "src" -Recurse -Force
    }
}

Write-Host "`nExisting files migration completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Update import paths in moved files" -ForegroundColor Yellow
Write-Host "  2. Create layout.tsx files for app routes" -ForegroundColor Yellow
Write-Host "  3. Update next.config.mjs for App Router if needed" -ForegroundColor Yellow 