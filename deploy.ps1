# SAM-Front2 Production Deployment Script (Windows PowerShell)
# Deploys React (Vite) build output to production server via SCP

Write-Host ""
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "           SAM-Front2 Production Deployment                    " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

# Check if deploy.config.json exists
$ConfigFile = "deploy.config.json"
if (-not (Test-Path $ConfigFile)) {
    Write-Host "X ERROR: $ConfigFile not found!" -ForegroundColor Red
    Write-Host "  Please create deploy.config.json with your server credentials."
    exit 1
}
Write-Host "[OK] Configuration file found: $ConfigFile" -ForegroundColor Green

# Read configuration from JSON file
$Config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
$ServerHost = $Config.production.host
$Port = $Config.production.port
$Username = $Config.production.username
$Password = $Config.production.password
$RemotePath = $Config.production.remotePath

# Validate configuration
if (-not $ServerHost -or -not $Port -or -not $Username -or -not $Password -or -not $RemotePath) {
    Write-Host "X ERROR: Invalid configuration in $ConfigFile" -ForegroundColor Red
    exit 1
}

# Check if scp is available
$scpPath = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpPath) {
    Write-Host "X ERROR: scp is not available!" -ForegroundColor Red
    Write-Host "  Please ensure OpenSSH is installed (Windows 10+ has it built-in)"
    exit 1
}
Write-Host "[OK] SCP is available" -ForegroundColor Green

# BUILD OUTPUT DIRECTORY - Vite outputs to "dist"
$BuildDir = "dist"

# Check if build directory exists
if (-not (Test-Path $BuildDir)) {
    Write-Host "[!] Build directory not found. Running production build..." -ForegroundColor Yellow
    npm run build
}

# Verify build directory exists after build
if (-not (Test-Path $BuildDir)) {
    Write-Host "X ERROR: Build directory $BuildDir not found after build!" -ForegroundColor Red
    exit 1
}

# Count files and calculate size
$Files = Get-ChildItem -Path $BuildDir -Recurse -File
$FileCount = $Files.Count
$Directories = Get-ChildItem -Path $BuildDir -Recurse -Directory
$DirCount = $Directories.Count + 1
$TotalSizeBytes = ($Files | Measure-Object -Property Length -Sum).Sum
$TotalSizeMB = [math]::Round($TotalSizeBytes / 1MB, 2)
$TotalSize = "$TotalSizeMB MB"

Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "                    Deployment Details                          " -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Source:      $BuildDir"
Write-Host "  Destination: $Username@${ServerHost}:$RemotePath"
Write-Host "  SSH Port:    $Port"
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Files:       $FileCount files"
Write-Host "  Directories: $DirCount directories"
Write-Host "  Total Size:  $TotalSize"
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

# Confirm deployment
$Confirm = Read-Host "Do you want to proceed with deployment? [y/n]"
if ($Confirm -ne "y" -and $Confirm -ne "Y") {
    Write-Host "[!] Deployment cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[>] Testing SSH connection..." -ForegroundColor Blue
Write-Host "[!] You will be prompted for password..." -ForegroundColor Yellow

$StartTime = Get-Date

# Test SSH connection
ssh -p $Port -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$Username@$ServerHost" "echo connected" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] SSH connection successful" -ForegroundColor Green
} else {
    Write-Host "X ERROR: Cannot connect to server!" -ForegroundColor Red
    Write-Host "  Host: $ServerHost"
    Write-Host "  Port: $Port"
    Write-Host "  User: $Username"
    exit 1
}

Write-Host "[>] Uploading $FileCount files to server..." -ForegroundColor Blue
Write-Host "[!] You will be prompted for password again..." -ForegroundColor Yellow
Write-Host ""

# Deploy using scp
scp -P $Port -o StrictHostKeyChecking=no -r "$BuildDir\*" "${Username}@${ServerHost}:$RemotePath/" 2>$null

if ($LASTEXITCODE -eq 0) {
    $EndTime = Get-Date
    $Duration = [math]::Round(($EndTime - $StartTime).TotalSeconds)

    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "              DEPLOYMENT SUCCESSFUL                             " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "[OK] $FileCount files deployed successfully" -ForegroundColor Green
    Write-Host "[OK] $TotalSize transferred" -ForegroundColor Green
    Write-Host "[OK] Duration: $Duration seconds" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Production URL: https://sam.karamentreprises.com/" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "              DEPLOYMENT FAILED                                 " -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    exit 1
}
