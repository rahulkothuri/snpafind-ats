#!/bin/bash
# ============================================================================
# SnpaFind ATS - Amplify Frontend Setup Script
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Default values
APP_NAME="snpafind-ats-frontend"
REGION="ap-south-1"
BRANCH="main"

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --app-name NAME       Amplify app name (default: snpafind-ats-frontend)"
    echo "  --region REGION       AWS region (default: us-east-1)"
    echo "  --branch BRANCH       Git branch to deploy (default: main)"
    echo "  --backend-url URL     Backend API URL (required)"
    echo "  --repo-url URL        GitHub repository URL (required)"
    echo "  --oauth-token TOKEN   GitHub OAuth token (optional, for private repos)"
    echo "  --help                Show this help message"
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --app-name) APP_NAME="$2"; shift 2 ;;
        --region) REGION="$2"; shift 2 ;;
        --branch) BRANCH="$2"; shift 2 ;;
        --backend-url) BACKEND_URL="$2"; shift 2 ;;
        --repo-url) REPO_URL="$2"; shift 2 ;;
        --oauth-token) OAUTH_TOKEN="$2"; shift 2 ;;
        --help) usage ;;
        *) shift ;;
    esac
done

if [ -z "$BACKEND_URL" ]; then
    print_error "Backend URL is required (--backend-url)"
    usage
fi

if [ -z "$REPO_URL" ]; then
    print_error "Repository URL is required (--repo-url)"
    usage
fi

print_info "============================================"
print_info "SnpaFind ATS - Amplify Frontend Setup"
print_info "============================================"
print_info "App Name: $APP_NAME"
print_info "Region: $REGION"
print_info "Branch: $BRANCH"
print_info "Backend URL: $BACKEND_URL"
print_info "============================================"

# Check if Amplify app already exists
EXISTING_APP=$(aws amplify list-apps --region $REGION \
    --query "apps[?name=='$APP_NAME'].appId" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_APP" ] && [ "$EXISTING_APP" != "None" ]; then
    print_info "Amplify app already exists: $EXISTING_APP"
    APP_ID=$EXISTING_APP
else
    print_info "Creating new Amplify app..."
    
    # Create Amplify app
    CMD="aws amplify create-app \
        --name \"$APP_NAME\" \
        --region $REGION \
        --repository \"$REPO_URL\" \
        --platform WEB \
        --environment-variables VITE_API_URL=\"$BACKEND_URL\""

    if [ -n "$OAUTH_TOKEN" ]; then
        CMD="$CMD --oauth-token \"$OAUTH_TOKEN\""
    fi

    # Build spec
    CMD="$CMD --build-spec \"$(cat << 'EOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
EOF
    )\""

    APP_ID=$(eval $CMD --query "app.appId" --output text)

    print_success "Amplify app created: $APP_ID"
fi

# Check if branch exists
EXISTING_BRANCH=$(aws amplify list-branches \
    --app-id $APP_ID \
    --region $REGION \
    --query "branches[?branchName=='$BRANCH'].branchName" \
    --output text 2>/dev/null || echo "")

if [ -z "$EXISTING_BRANCH" ] || [ "$EXISTING_BRANCH" = "None" ]; then
    print_info "Creating branch: $BRANCH"
    
    aws amplify create-branch \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --region $REGION \
        --enable-auto-build \
        --environment-variables VITE_API_URL="$BACKEND_URL"

    print_success "Branch created"
else
    print_info "Branch already exists, updating environment variables..."
    
    aws amplify update-branch \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --region $REGION \
        --environment-variables VITE_API_URL="$BACKEND_URL"
fi

# Get the Amplify URL
AMPLIFY_URL=$(aws amplify get-branch \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --region $REGION \
    --query "branch.displayName" \
    --output text 2>/dev/null || echo "")

DEFAULT_DOMAIN="$BRANCH.$APP_ID.amplifyapp.com"

print_success "============================================"
print_success "Amplify Setup Complete!"
print_success "============================================"
print_info "App ID: $APP_ID"
print_info "Branch: $BRANCH"
print_info "URL: https://$DEFAULT_DOMAIN"
print_info ""
print_info "To trigger a build:"
print_info "  aws amplify start-job --app-id $APP_ID --branch-name $BRANCH --job-type RELEASE --region $REGION"
print_info ""
print_info "Or push to your repository's $BRANCH branch for automatic deployment."
print_success "============================================"

# Save configuration
echo "APP_ID=$APP_ID" > /tmp/amplify-config.env
echo "FRONTEND_URL=https://$DEFAULT_DOMAIN" >> /tmp/amplify-config.env
