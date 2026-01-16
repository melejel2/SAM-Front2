#!/bin/bash

# SAM-Front2 Production Deployment Script (Mac/Linux)
# Deploys React (Vite) build output to production server via SCP

echo ""
echo "================================================================"
echo "           SAM-Front2 Production Deployment                    "
echo "================================================================"
echo ""

# Check if deploy.config.json exists
CONFIG_FILE="deploy.config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "X ERROR: $CONFIG_FILE not found!"
    echo "  Please create deploy.config.json with your server credentials."
    exit 1
fi
echo "[OK] Configuration file found: $CONFIG_FILE"

# Read configuration from JSON file
SERVER_HOST=$(grep -o '"host"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)"$/\1/')
PORT=$(grep -o '"port"[[:space:]]*:[[:space:]]*[0-9]*' "$CONFIG_FILE" | sed 's/.*: *//')
USERNAME=$(grep -o '"username"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)"$/\1/')
REMOTE_PATH=$(grep -o '"remotePath"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"\([^"]*\)"$/\1/')

# Validate configuration
if [ -z "$SERVER_HOST" ] || [ -z "$PORT" ] || [ -z "$USERNAME" ] || [ -z "$REMOTE_PATH" ]; then
    echo "X ERROR: Invalid configuration in $CONFIG_FILE"
    exit 1
fi

# Check if scp is available
if ! command -v scp &> /dev/null; then
    echo "X ERROR: scp is not available!"
    echo "  Please ensure OpenSSH is installed"
    exit 1
fi
echo "[OK] SCP is available"

# BUILD OUTPUT DIRECTORY - Vite outputs to "dist"
BUILD_DIR="dist"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "[!] Build directory not found. Running production build..."
    npm run build
fi

# Verify build directory exists after build
if [ ! -d "$BUILD_DIR" ]; then
    echo "X ERROR: Build directory $BUILD_DIR not found after build!"
    exit 1
fi

# Count files and calculate size
FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l | tr -d ' ')
DIR_COUNT=$(find "$BUILD_DIR" -type d | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)

echo ""
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

# Confirm deployment
read -p "Do you want to proceed with deployment? [y/n] " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "[!] Deployment cancelled by user."
    exit 0
fi

echo ""
echo "[>] Testing SSH connection..."
echo "[!] You will be prompted for password..."

START_TIME=$(date +%s)

# Test SSH connection
if ssh -p "$PORT" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$USERNAME@$SERVER_HOST" "echo connected" 2>/dev/null; then
    echo "[OK] SSH connection successful"
else
    echo "X ERROR: Cannot connect to server!"
    echo "  Host: $SERVER_HOST"
    echo "  Port: $PORT"
    echo "  User: $USERNAME"
    exit 1
fi

echo "[>] Uploading $FILE_COUNT files to server..."
echo "[!] You will be prompted for password again..."
echo ""

# Deploy using scp
if scp -P "$PORT" -o StrictHostKeyChecking=no -r "$BUILD_DIR"/* "$USERNAME@$SERVER_HOST:$REMOTE_PATH/" 2>/dev/null; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo "================================================================"
    echo "              DEPLOYMENT SUCCESSFUL                             "
    echo "================================================================"
    echo ""
    echo "[OK] $FILE_COUNT files deployed successfully"
    echo "[OK] $TOTAL_SIZE transferred"
    echo "[OK] Duration: $DURATION seconds"
    echo ""
    echo "  Production URL: https://sam.karamentreprises.com/"
    echo ""
else
    echo ""
    echo "================================================================"
    echo "              DEPLOYMENT FAILED                                 "
    echo "================================================================"
    exit 1
fi
