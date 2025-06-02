# PowerShell script to cleanup unused template files
# Usage: ./cleanup-unused-files.ps1

Write-Host "Cleaning up unused template files..." -ForegroundColor Green

# Get the project root (3 levels up from tools directory)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Write-Host "Project root: $projectRoot"

# Change to project root
Set-Location $projectRoot

# Remove unused directories and files
$itemsToRemove = @(
    "components/auth",
    "components/pages/admin",
    "components/commons",
    "components/forms",
    "components/layouts",
    "lib/zod.ts",
    "utils/api.ts"
)

$removedCount = 0

foreach ($item in $itemsToRemove) {
    $itemPath = Join-Path $projectRoot $item
    if (Test-Path $itemPath) {
        Write-Host "  Removing: $item" -ForegroundColor Yellow
        Remove-Item -Path $itemPath -Recurse -Force
        $removedCount++
    }
}

Write-Host "`nCleanup completed!" -ForegroundColor Green
Write-Host "Total items removed: $removedCount" -ForegroundColor Green 