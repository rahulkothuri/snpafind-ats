#!/bin/bash
# ============================================================================
# SnpaFind ATS - AWS Deployment Script
# ============================================================================
# This script deploys the CloudFormation stack and sets up the backend
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
STACK_NAME="snpafind-ats"
REGION="ap-south-1"
ENVIRONMENT="production"

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --stack-name NAME     CloudFormation stack name (default: snpafind-ats)"
    echo "  --region REGION       AWS region (default: us-east-1)"
    echo "  --db-password PASS    Database master password (required)"
    echo "  --jwt-secret SECRET   JWT secret key (required, min 32 chars)"
    echo "  --resend-key KEY      Resend API key (optional)"
    echo "  --help                Show this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --db-password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        --jwt-secret)
            JWT_SECRET="$2"
            shift 2
            ;;
        --resend-key)
            RESEND_API_KEY="$2"
            shift 2
            ;;
        --help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate required parameters
if [ -z "$DB_PASSWORD" ]; then
    print_error "Database password is required (--db-password)"
    usage
fi

if [ -z "$JWT_SECRET" ]; then
    print_error "JWT secret is required (--jwt-secret)"
    usage
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
    print_error "JWT secret must be at least 32 characters"
    exit 1
fi

if [ ${#DB_PASSWORD} -lt 8 ]; then
    print_error "Database password must be at least 8 characters"
    exit 1
fi

# Set default for optional params
RESEND_API_KEY=${RESEND_API_KEY:-""}

print_info "============================================"
print_info "SnpaFind ATS - AWS Deployment"
print_info "============================================"
print_info "Stack Name: $STACK_NAME"
print_info "Region: $REGION"
print_info "Environment: $ENVIRONMENT"
print_info "============================================"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TEMPLATE_PATH="$SCRIPT_DIR/../cloudformation/main.yaml"

# Check if template exists
if [ ! -f "$TEMPLATE_PATH" ]; then
    print_error "CloudFormation template not found at: $TEMPLATE_PATH"
    exit 1
fi

# Validate template
print_info "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_PATH \
    --region $REGION > /dev/null

print_success "Template validation passed"

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION 2>&1 || true)

if echo "$STACK_EXISTS" | grep -q "does not exist"; then
    print_info "Creating new CloudFormation stack..."
    ACTION="create-stack"
    WAIT_ACTION="stack-create-complete"
else
    print_info "Updating existing CloudFormation stack..."
    ACTION="update-stack"
    WAIT_ACTION="stack-update-complete"
fi

# Deploy CloudFormation stack
print_info "Deploying CloudFormation stack (this may take 10-15 minutes)..."

aws cloudformation $ACTION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_PATH \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        ParameterKey=DBMasterUsername,ParameterValue=atsadmin \
        ParameterKey=DBMasterPassword,ParameterValue="$DB_PASSWORD" \
        ParameterKey=JWTSecret,ParameterValue="$JWT_SECRET" \
        ParameterKey=ResendApiKey,ParameterValue="$RESEND_API_KEY" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION \
    2>&1 || {
        if [ "$ACTION" = "update-stack" ]; then
            print_warning "No updates to perform or update failed"
        else
            print_error "Stack creation failed"
            exit 1
        fi
    }

# Wait for stack completion
print_info "Waiting for stack to complete..."
aws cloudformation wait $WAIT_ACTION \
    --stack-name $STACK_NAME \
    --region $REGION 2>&1 || {
        if [ "$ACTION" = "update-stack" ]; then
            print_warning "Stack update may have had no changes"
        else
            print_error "Stack creation timed out or failed"
            exit 1
        fi
    }

print_success "CloudFormation stack deployed successfully!"

# Get stack outputs
print_info "Retrieving stack outputs..."

get_output() {
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
        --output text
}

RDS_ENDPOINT=$(get_output "RDSEndpoint")
S3_BUCKET=$(get_output "S3BucketName")
ECR_URI=$(get_output "ECRRepositoryUri")
SECRETS_ARN=$(get_output "SecretsArn")
INSTANCE_ROLE_ARN=$(get_output "AppRunnerInstanceRoleArn")
ACCESS_ROLE_ARN=$(get_output "AppRunnerAccessRoleArn")
VPC_CONNECTOR_ARN=$(get_output "VPCConnectorArn")

print_info "============================================"
print_info "Stack Outputs"
print_info "============================================"
echo "RDS Endpoint:        $RDS_ENDPOINT"
echo "S3 Bucket:           $S3_BUCKET"
echo "ECR Repository:      $ECR_URI"
echo "Secrets ARN:         $SECRETS_ARN"
echo "Instance Role ARN:   $INSTANCE_ROLE_ARN"
echo "Access Role ARN:     $ACCESS_ROLE_ARN"
echo "VPC Connector ARN:   $VPC_CONNECTOR_ARN"
print_info "============================================"

# Save outputs to file for later use
OUTPUTS_FILE="$SCRIPT_DIR/stack-outputs.json"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].Outputs" \
    --output json > $OUTPUTS_FILE

print_success "Stack outputs saved to: $OUTPUTS_FILE"

print_info ""
print_info "============================================"
print_info "NEXT STEPS"
print_info "============================================"
print_info "1. Build and push Docker image:"
print_info "   cd backend"
print_info "   docker build -t $ECR_URI:latest ."
print_info "   aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(echo $ECR_URI | cut -d'/' -f1)"
print_info "   docker push $ECR_URI:latest"
print_info ""
print_info "2. Run database migrations:"
print_info "   DATABASE_URL=\"postgresql://atsadmin:$DB_PASSWORD@$RDS_ENDPOINT:5432/ats_production\""
print_info "   npx prisma migrate deploy"
print_info ""
print_info "3. Create App Runner service:"
print_info "   ./create-apprunner.sh --stack-name $STACK_NAME --region $REGION"
print_info ""
print_info "4. Deploy frontend to Amplify:"
print_info "   ./setup-amplify.sh"
print_info "============================================"

print_success "Deployment script completed!"
