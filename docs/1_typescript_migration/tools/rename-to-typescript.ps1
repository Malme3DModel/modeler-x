# PowerShell script to rename JavaScript files to TypeScript
# Usage: ./rename-to-typescript.ps1

Write-Host "Starting TypeScript file renaming..." -ForegroundColor Green

# Get the project root (3 levels up from tools directory)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Write-Host "Project root: $projectRoot"

# Change to project root
Set-Location $projectRoot

# Define directories to process
$directories = @("pages", "src", "styles")

$totalRenamed = 0

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "`nProcessing directory: $dir" -ForegroundColor Cyan
        
        # Rename .js files to .ts
        $jsFiles = Get-ChildItem -Path $dir -Filter "*.js" -Recurse
        foreach ($file in $jsFiles) {
            $newName = $file.FullName -replace '\.js$', '.ts'
            Move-Item -Path $file.FullName -Destination $newName
            Write-Host "  Renamed: $($file.Name) -> $(Split-Path -Leaf $newName)"
            $totalRenamed++
        }
        
        # Rename .jsx files to .tsx
        $jsxFiles = Get-ChildItem -Path $dir -Filter "*.jsx" -Recurse
        foreach ($file in $jsxFiles) {
            $newName = $file.FullName -replace '\.jsx$', '.tsx'
            Move-Item -Path $file.FullName -Destination $newName
            Write-Host "  Renamed: $($file.Name) -> $(Split-Path -Leaf $newName)"
            $totalRenamed++
        }
    } else {
        Write-Host "Directory not found: $dir" -ForegroundColor Yellow
    }
}

# Handle next.config.js specifically
if (Test-Path "next.config.js") {
    Move-Item -Path "next.config.js" -Destination "next.config.ts"
    Write-Host "`nRenamed: next.config.js -> next.config.ts" -ForegroundColor Green
    $totalRenamed++
}

Write-Host "`nFile renaming completed!" -ForegroundColor Green
Write-Host "Total files renamed: $totalRenamed" -ForegroundColor Green 