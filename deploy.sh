#!/bin/bash

# SAM-Front2 Production Deployment Script (Mac/Linux)
# Deploys React (Vite) build output to production server via SCP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}           SAM-Front2 Production Deployment                    ${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

STEP_COUNT=0
total_steps() { echo "6"; }

step() {
    STEP_COUNT=$((STEP_COUNT + 1))
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  STEP $STEP_COUNT/$(total_steps): $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

success() { echo -e "${GREEN}[OK]${NC} $1"; }
error() { echo -e "${RED}[X]${NC} $1"; }
warning() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[>]${NC} $1"; }

# ============================================================================
# STEP 1: VALIDATE CONFIGURATION
# ============================================================================
step "Validating Configuration"

CONFIG_FILE="deploy.config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    error "ERROR: $CONFIG_FILE not found!"
    echo "  Please create deploy.config.json with your server credentials."
    exit 1
fi
success "Configuration file found: $CONFIG_FILE"

# Read configuration from JSON file
SERVER_HOST=$(grep -o '"host"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)"$/\1/')
PORT=$(grep -o '"port"[[:space:]]*:[[:space:]]*[0-9]*' "$CONFIG_FILE" | sed 's/.*: *//')
USERNAME=$(grep -o '"username"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)"$/\1/')
REMOTE_PATH=$(grep -o '"remotePath"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)"$/\1/')

# Validate configuration values
if [ -z "$SERVER_HOST" ]; then
    error "Missing 'host' in configuration"
    exit 1
fi
success "Host: $SERVER_HOST"

if [ -z "$PORT" ]; then
    error "Missing 'port' in configuration"
    exit 1
fi
success "Port: $PORT"

if [ -z "$USERNAME" ]; then
    error "Missing 'username' in configuration"
    exit 1
fi
success "Username: $USERNAME"

if [ -z "$REMOTE_PATH" ]; then
    error "Missing 'remotePath' in configuration"
    exit 1
fi
success "Remote Path: $REMOTE_PATH"

# Check if scp is available
if ! command -v scp &> /dev/null; then
    error "SCP is not available!"
    echo "  Please ensure OpenSSH is installed"
    exit 1
fi
success "SCP is available"

# ============================================================================
# STEP 2: BUILD APPLICATION
# ============================================================================
step "Building Application"

BUILD_DIR="dist"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    warning "Build directory not found. Running production build..."
    npm run build
    if [ $? -ne 0 ]; then
        error "Build failed!"
        exit 1
    fi
else
    info "Existing build found. Rebuilding for fresh deployment..."
    npm run build
    if [ $? -ne 0 ]; then
        error "Build failed!"
        exit 1
    fi
fi
success "Build completed successfully"

# ============================================================================
# STEP 3: VALIDATE BUILD OUTPUT
# ============================================================================
step "Validating Build Output"

# Check build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    error "Build directory $BUILD_DIR not found after build!"
    exit 1
fi
success "Build directory exists: $BUILD_DIR"

# Check for index.html
if [ ! -f "$BUILD_DIR/index.html" ]; then
    error "index.html not found in build output!"
    exit 1
fi
success "index.html found"

# Check for assets directory
if [ ! -d "$BUILD_DIR/assets" ]; then
    warning "assets directory not found (may be normal for some builds)"
else
    ASSET_COUNT=$(find "$BUILD_DIR/assets" -type f | wc -l | tr -d ' ')
    success "Assets directory found with $ASSET_COUNT files"
fi

# Check for JavaScript files
JS_COUNT=$(find "$BUILD_DIR" -name "*.js" -type f | wc -l | tr -d ' ')
if [ "$JS_COUNT" -eq 0 ]; then
    error "No JavaScript files found in build output!"
    exit 1
fi
success "Found $JS_COUNT JavaScript file(s)"

# Check for CSS files
CSS_COUNT=$(find "$BUILD_DIR" -name "*.css" -type f | wc -l | tr -d ' ')
if [ "$CSS_COUNT" -eq 0 ]; then
    warning "No CSS files found (may be inlined)"
else
    success "Found $CSS_COUNT CSS file(s)"
fi

# Validate index.html contains expected content
if ! grep -q "<script" "$BUILD_DIR/index.html"; then
    error "index.html appears invalid (no script tags found)"
    exit 1
fi
success "index.html structure validated"

# Count files and calculate size
FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l | tr -d ' ')
DIR_COUNT=$(find "$BUILD_DIR" -type d | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)

success "Build validation complete"

# ============================================================================
# STEP 4: CONFIRM DEPLOYMENT
# ============================================================================
step "Deployment Confirmation"

echo "----------------------------------------------------------------"
echo "                    Deployment Details                          "
echo "----------------------------------------------------------------"
echo "  Source:      $BUILD_DIR"
echo "  Destination: $USERNAME@$SERVER_HOST:$REMOTE_PATH"
echo "  SSH Port:    $PORT"
echo "----------------------------------------------------------------"
echo "  Files:       $FILE_COUNT files"
echo "  Directories: $DIR_COUNT directories"
echo "  Total Size:  $TOTAL_SIZE"
echo "----------------------------------------------------------------"
echo ""

read -p "Do you want to proceed with deployment? [y/n] " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    warning "Deployment cancelled by user."
    exit 0
fi

# ============================================================================
# STEP 5: DEPLOY TO SERVER
# ============================================================================
step "Deploying to Server"

info "Testing SSH connection..."
warning "You will be prompted for password..."

START_TIME=$(date +%s)

# SSH connection options to prevent hung sftp-server processes
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o BatchMode=no"

# Test SSH connection
if ssh -p "$PORT" $SSH_OPTS "$USERNAME@$SERVER_HOST" "echo connected" 2>/dev/null; then
    success "SSH connection successful"
else
    error "Cannot connect to server!"
    echo "  Host: $SERVER_HOST"
    echo "  Port: $PORT"
    echo "  User: $USERNAME"
    exit 1
fi

info "Uploading $FILE_COUNT files to server..."
warning "You will be prompted for password again..."
echo ""

# Deploy using scp with timeout options to prevent hung connections
if scp -P "$PORT" $SSH_OPTS -r "$BUILD_DIR"/* "$USERNAME@$SERVER_HOST:$REMOTE_PATH/"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    success "Files uploaded successfully"
    success "Transfer duration: $DURATION seconds"
else
    error "File upload failed!"
    # Attempt cleanup even on failure
    info "Attempting SSH connection cleanup..."
    ssh -p "$PORT" -o ConnectTimeout=10 "$USERNAME@$SERVER_HOST" "exit" 2>/dev/null || true
    exit 1
fi

# Explicit SSH session cleanup to prevent hung sftp-server processes
info "Cleaning up SSH connection..."
ssh -p "$PORT" -o ConnectTimeout=10 "$USERNAME@$SERVER_HOST" "exit" 2>/dev/null || true
sleep 2
success "SSH connection cleanup completed"

# ============================================================================
# STEP 6: POST-DEPLOY VERIFICATION
# ============================================================================
step "Post-Deploy Verification"

PROD_URL="https://sam.karamentreprises.com"

info "Waiting for server to update (5 seconds)..."
sleep 5

info "Verifying deployment at $PROD_URL..."

# Check if curl is available
if command -v curl &> /dev/null; then
    # Test HTTP response
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$PROD_URL" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        success "Site is responding (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        success "Site is responding with redirect (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        warning "Could not verify site (connection timeout or SSL issue)"
    else
        warning "Site returned HTTP $HTTP_CODE (may need investigation)"
    fi

    # Check if index.html content is served
    CONTENT_CHECK=$(curl -s --connect-timeout 10 "$PROD_URL" 2>/dev/null | grep -c "<script" || echo "0")
    if [ "$CONTENT_CHECK" -gt 0 ]; then
        success "Site content verified (script tags present)"
    else
        warning "Could not verify site content"
    fi
else
    warning "curl not available, skipping HTTP verification"
fi

# Final summary
echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}              DEPLOYMENT SUCCESSFUL                             ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
success "$FILE_COUNT files deployed successfully"
success "$TOTAL_SIZE transferred"
success "Duration: $DURATION seconds"
echo ""
echo -e "  ${CYAN}Production URL:${NC} $PROD_URL"
echo ""
echo "  Deployment completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
