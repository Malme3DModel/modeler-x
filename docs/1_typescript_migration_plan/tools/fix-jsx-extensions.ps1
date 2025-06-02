# PowerShell script to rename .ts files containing JSX to .tsx
# Usage: ./fix-jsx-extensions.ps1

Write-Host "Fixing JSX file extensions..." -ForegroundColor Green

# Get the project root (3 levels up from tools directory)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Write-Host "Project root: $projectRoot"

# Change to project root
Set-Location $projectRoot

# Define files that need to be renamed to .tsx
$filesToRename = @(
    "pages/_app.ts",
    "pages/index.ts",
    "src/OCJSViewport.ts"
)

$renamed = 0

foreach ($file in $filesToRename) {
    if (Test-Path $file) {
        $newName = $file -replace '\.ts$', '.tsx'
        Move-Item -Path $file -Destination $newName
        Write-Host "  Renamed: $file -> $newName" -ForegroundColor Cyan
        $renamed++
    } else {
        Write-Host "  File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nJSX file extension fixing completed!" -ForegroundColor Green
Write-Host "Total files renamed: $renamed" -ForegroundColor Green 