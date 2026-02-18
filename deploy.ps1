# SAM-Front2 Production Deployment Script (Windows PowerShell)
# Deploys React (Vite) build output to production server via SCP

$ErrorActionPreference = "Stop"

$StepCount = 0
$TotalSteps = 6

function Write-Step {
    param([string]$Message)
    $script:StepCount++
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  STEP ${StepCount}/${TotalSteps}: $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "[X] $Message" -ForegroundColor Red }
function Write-Warning { param([string]$Message) Write-Host "[!] $Message" -ForegroundColor Yellow }
function Write-Info { param([string]$Message) Write-Host "[>] $Message" -ForegroundColor Blue }

Write-Host ""
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "           SAM-Front2 Production Deployment                    " -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

# ============================================================================
# STEP 1: VALIDATE CONFIGURATION
# ============================================================================
Write-Step "Validating Configuration"

$ConfigFile = "deploy.config.json"
if (-not (Test-Path $ConfigFile)) {
    Write-Error "ERROR: $ConfigFile not found!"
    Write-Host "  Please create deploy.config.json with your server credentials."
    exit 1
}
Write-Success "Configuration file found: $ConfigFile"

# Read configuration from JSON file
$Config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
$ServerHost = $Config.production.host
$Port = $Config.production.port
$Username = $Config.production.username
$Password = $Config.production.password
$RemotePath = $Config.production.remotePath

# Validate each configuration value
if (-not $ServerHost) {
    Write-Error "Missing 'host' in configuration"
    exit 1
}
Write-Success "Host: $ServerHost"

if (-not $Port) {
    Write-Error "Missing 'port' in configuration"
    exit 1
}
Write-Success "Port: $Port"

if (-not $Username) {
    Write-Error "Missing 'username' in configuration"
    exit 1
}
Write-Success "Username: $Username"

if (-not $RemotePath) {
    Write-Error "Missing 'remotePath' in configuration"
    exit 1
}
Write-Success "Remote Path: $RemotePath"

# Check if scp is available
$scpPath = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpPath) {
    Write-Error "SCP is not available!"
    Write-Host "  Please ensure OpenSSH is installed (Windows 10+ has it built-in)"
    exit 1
}
Write-Success "SCP is available"

# ============================================================================
# STEP 2: VERIFY BUILD OUTPUT EXISTS
# ============================================================================
Write-Step "Verifying Build Output"

$BuildDir = "dist"

if (-not (Test-Path $BuildDir)) {
    Write-Error "Build directory not found! Run 'npm run build' first."
    exit 1
}
Write-Success "Build directory found: $BuildDir"

# ============================================================================
# STEP 3: VALIDATE BUILD OUTPUT
# ============================================================================
Write-Step "Validating Build Output"

# Check build directory exists
if (-not (Test-Path $BuildDir)) {
    Write-Error "Build directory $BuildDir not found after build!"
    exit 1
}
Write-Success "Build directory exists: $BuildDir"

# Check for index.html
$IndexPath = Join-Path $BuildDir "index.html"
if (-not (Test-Path $IndexPath)) {
    Write-Error "index.html not found in build output!"
    exit 1
}
Write-Success "index.html found"

# Check for assets directory
$AssetsPath = Join-Path $BuildDir "assets"
if (-not (Test-Path $AssetsPath)) {
    Write-Warning "assets directory not found (may be normal for some builds)"
} else {
    $AssetCount = (Get-ChildItem -Path $AssetsPath -Recurse -File).Count
    Write-Success "Assets directory found with $AssetCount files"
}

# Check for JavaScript files
$JsFiles = Get-ChildItem -Path $BuildDir -Recurse -Filter "*.js" -File
$JsCount = $JsFiles.Count
if ($JsCount -eq 0) {
    Write-Error "No JavaScript files found in build output!"
    exit 1
}
Write-Success "Found $JsCount JavaScript file(s)"

# Check for CSS files
$CssFiles = Get-ChildItem -Path $BuildDir -Recurse -Filter "*.css" -File
$CssCount = $CssFiles.Count
if ($CssCount -eq 0) {
    Write-Warning "No CSS files found (may be inlined)"
} else {
    Write-Success "Found $CssCount CSS file(s)"
}

# Validate index.html contains expected content
$IndexContent = Get-Content $IndexPath -Raw
if ($IndexContent -notmatch "<script") {
    Write-Error "index.html appears invalid (no script tags found)"
    exit 1
}
Write-Success "index.html structure validated"

# Count files and calculate size
$Files = Get-ChildItem -Path $BuildDir -Recurse -File
$FileCount = $Files.Count
$Directories = Get-ChildItem -Path $BuildDir -Recurse -Directory
$DirCount = $Directories.Count + 1
$TotalSizeBytes = ($Files | Measure-Object -Property Length -Sum).Sum
$TotalSizeMB = [math]::Round($TotalSizeBytes / 1MB, 2)
$TotalSize = "$TotalSizeMB MB"

Write-Success "Build validation complete"

# ============================================================================
# STEP 4: CONFIRM DEPLOYMENT
# ============================================================================
Write-Step "Deployment Confirmation"

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

$Confirm = Read-Host "Do you want to proceed with deployment? [y/n]"
if ($Confirm -ne "y" -and $Confirm -ne "Y") {
    Write-Warning "Deployment cancelled by user."
    exit 0
}

# ============================================================================
# STEP 5: DEPLOY TO SERVER
# ============================================================================
Write-Step "Deploying to Server"

Write-Info "Testing SSH connection..."
Write-Warning "You will be prompted for password..."

$StartTime = Get-Date

# SSH connection options to prevent hung sftp-server processes
$SshOpts = "-o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=3"

# Test SSH connection
$sshArgs = @("-p", $Port) + ($SshOpts -split ' ') + @("$Username@$ServerHost", "echo connected")
& ssh @sshArgs 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "SSH connection successful"
} else {
    Write-Error "Cannot connect to server!"
    Write-Host "  Host: $ServerHost"
    Write-Host "  Port: $Port"
    Write-Host "  User: $Username"
    exit 1
}

# Clean old assets from remote server before uploading new build
Write-Info "Cleaning old assets from remote server..."
try {
    # Remote path is in SCP format with leading slash (e.g., /C:/inetpub/...) — strip leading / for SSH command
    $RemotePathWin = $RemotePath -replace '^/', ''
    $cleanupArgs = @("-p", $Port) + ($SshOpts -split ' ') + @("$Username@$ServerHost", "powershell -Command `"Remove-Item -Recurse -Force '$RemotePathWin/assets' -ErrorAction SilentlyContinue`"")
    & ssh @cleanupArgs 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Remote assets/ folder cleaned"
    } else {
        Write-Warning "Could not clean remote assets/ folder (may not exist yet - this is OK on first deploy)"
    }
} catch {
    Write-Warning "Could not clean remote assets/ folder: $($_.Exception.Message)"
}

Write-Info "Uploading $FileCount files to server..."
Write-Warning "You will be prompted for password again..."
Write-Host ""

# Deploy using scp with timeout options to prevent hung connections
$scpArgs = @("-P", $Port) + ($SshOpts -split ' ') + @("-r", "$BuildDir\*", "${Username}@${ServerHost}:$RemotePath/")
& scp @scpArgs

if ($LASTEXITCODE -eq 0) {
    $EndTime = Get-Date
    $Duration = [math]::Round(($EndTime - $StartTime).TotalSeconds)
    Write-Success "Files uploaded successfully"
    Write-Success "Transfer duration: $Duration seconds"
} else {
    Write-Error "File upload failed!"
    # Attempt cleanup even on failure
    Write-Info "Attempting SSH connection cleanup..."
    & ssh -p $Port -o ConnectTimeout=10 "$Username@$ServerHost" "exit" 2>$null
    exit 1
}

# Explicit SSH session cleanup to prevent hung sftp-server processes
Write-Info "Cleaning up SSH connection..."
& ssh -p $Port -o ConnectTimeout=10 "$Username@$ServerHost" "exit" 2>$null
Start-Sleep -Seconds 2
Write-Success "SSH connection cleanup completed"

# ============================================================================
# STEP 6: POST-DEPLOY VERIFICATION
# ============================================================================
Write-Step "Post-Deploy Verification"

$ProdUrl = "https://sam.karamentreprises.com"

Write-Info "Waiting for server to update (5 seconds)..."
Start-Sleep -Seconds 5

Write-Info "Verifying deployment at $ProdUrl..."

try {
    # Test HTTP response
    $Response = Invoke-WebRequest -Uri $ProdUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    $StatusCode = $Response.StatusCode

    if ($StatusCode -eq 200) {
        Write-Success "Site is responding (HTTP $StatusCode)"
    } elseif ($StatusCode -eq 301 -or $StatusCode -eq 302) {
        Write-Success "Site is responding with redirect (HTTP $StatusCode)"
    } else {
        Write-Warning "Site returned HTTP $StatusCode (may need investigation)"
    }

    # Check if index.html content is served
    if ($Response.Content -match "<script") {
        Write-Success "Site content verified (script tags present)"
    } else {
        Write-Warning "Could not verify site content"
    }
} catch {
    Write-Warning "Could not verify site (connection timeout or SSL issue)"
    Write-Warning "Error: $($_.Exception.Message)"
}

# Final summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "              DEPLOYMENT SUCCESSFUL                             " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Success "$FileCount files deployed successfully"
Write-Success "$TotalSize transferred"
Write-Success "Duration: $Duration seconds"
Write-Host ""
Write-Host "  Production URL: $ProdUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Deployment completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""
