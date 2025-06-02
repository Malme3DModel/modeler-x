# PowerShell script to copy template files to project root
# Usage: ./copy-template-files.ps1

Write-Host "Starting template files copy..." -ForegroundColor Green

# Get the project root (3 levels up from tools directory)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$templatePath = Join-Path $projectRoot "docs/template"

Write-Host "Project root: $projectRoot"
Write-Host "Template path: $templatePath"

# Change to project root
Set-Location $projectRoot

# Create backup of existing files
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "`nCreating backup directory: $backupDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Define the mapping of template files to project root
$mappings = @(
    @{Source = "app"; Destination = "app"},
    @{Source = "components"; Destination = "components"},
    @{Source = "lib"; Destination = "lib"},
    @{Source = "utils"; Destination = "utils"},
    @{Source = "types"; Destination = "types"},
    @{Source = "public"; Destination = "public"; Merge = $true},
    @{Source = "tailwind.config.ts"; Destination = "tailwind.config.ts"},
    @{Source = "postcss.config.mjs"; Destination = "postcss.config.mjs"},
    @{Source = ".eslintrc.json"; Destination = ".eslintrc.json"; Backup = $true},
    @{Source = ".gitignore"; Destination = ".gitignore"; Backup = $true},
    @{Source = "README.md"; Destination = "README.md"; Backup = $true}
)

$copiedCount = 0

foreach ($mapping in $mappings) {
    $sourcePath = Join-Path $templatePath $mapping.Source
    $destPath = Join-Path $projectRoot $mapping.Destination
    
    if (Test-Path $sourcePath) {
        # Backup existing files/folders if needed
        if (Test-Path $destPath) {
            if ($mapping.Backup) {
                $backupPath = Join-Path $backupDir $mapping.Destination
                Write-Host "  Backing up: $($mapping.Destination) -> $backupPath" -ForegroundColor DarkGray
                Copy-Item -Path $destPath -Destination $backupPath -Recurse -Force
            }
        }
        
        # Copy files/folders
        if ($mapping.Merge -and (Test-Path $destPath) -and (Get-Item $sourcePath).PSIsContainer) {
            # Merge directories
            Write-Host "  Merging: $($mapping.Source) -> $($mapping.Destination)" -ForegroundColor Cyan
            Copy-Item -Path "$sourcePath\*" -Destination $destPath -Recurse -Force
        } else {
            # Replace entirely
            Write-Host "  Copying: $($mapping.Source) -> $($mapping.Destination)" -ForegroundColor Cyan
            if (Test-Path $destPath) {
                Remove-Item -Path $destPath -Recurse -Force
            }
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        }
        $copiedCount++
    } else {
        Write-Host "  Source not found: $($mapping.Source)" -ForegroundColor Yellow
    }
}

# Note: We keep tsconfig.json as is (already copied earlier)
# Note: We keep next.config.mjs as is (already modified)
# Note: We don't copy package.json and package-lock.json (project specific)
# Note: middleware.ts and auth.ts are template specific, will be copied if needed

Write-Host "`nTemplate files copy completed!" -ForegroundColor Green
Write-Host "Total items processed: $copiedCount" -ForegroundColor Green
Write-Host "Backup created in: $backupDir" -ForegroundColor Yellow 