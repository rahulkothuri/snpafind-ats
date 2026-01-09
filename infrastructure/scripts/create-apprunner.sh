#!/bin/bash
# ============================================================================
# SnpaFind ATS - App Runner Service Creation Script
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Default values
STACK_NAME="snpafind-ats"
REGION="ap-south-1"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --stack-name) STACK_NAME="$2"; shift 2 ;;
        --region) REGION="$2"; shift 2 ;;
        *) shift ;;
    esac
done

print_info "Creating App Runner service for stack: $STACK_NAME"

# Get CloudFormation outputs
get_output() {
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
        --output text
}

ECR_URI=$(get_output "ECRRepositoryUri")
SECRETS_ARN=$(get_output "SecretsArn")
INSTANCE_ROLE_ARN=$(get_output "AppRunnerInstanceRoleArn")
ACCESS_ROLE_ARN=$(get_output "AppRunnerAccessRoleArn")
VPC_CONNECTOR_ARN=$(get_output "VPCConnectorArn")
S3_BUCKET=$(get_output "S3BucketName")

# Create App Runner service configuration
cat > /tmp/apprunner-config.json << EOF
{
  "ServiceName": "${STACK_NAME}-backend",
  "SourceConfiguration": {
    "AuthenticationConfiguration": {
      "AccessRoleArn": "${ACCESS_ROLE_ARN}"
    },
    "AutoDeploymentsEnabled": false,
    "ImageRepository": {
      "ImageIdentifier": "${ECR_URI}:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "${SECRETS_ARN}:DATABASE_URL::",
          "JWT_SECRET": "${SECRETS_ARN}:JWT_SECRET::",
          "RESEND_API_KEY": "${SECRETS_ARN}:RESEND_API_KEY::"
        },
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "AWS_S3_BUCKET": "${S3_BUCKET}",
          "AWS_REGION": "${REGION}"
        }
      }
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1 vCPU",
    "Memory": "2 GB",
    "InstanceRoleArn": "${INSTANCE_ROLE_ARN}"
  },
  "NetworkConfiguration": {
    "EgressConfiguration": {
      "EgressType": "VPC",
      "VpcConnectorArn": "${VPC_CONNECTOR_ARN}"
    }
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 20,
    "Timeout": 10,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 10
  }
}
EOF

print_info "Creating App Runner service..."

# Check if service exists
EXISTING_SERVICE=$(aws apprunner list-services --region $REGION \
    --query "ServiceSummaryList[?ServiceName=='${STACK_NAME}-backend'].ServiceArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_SERVICE" ] && [ "$EXISTING_SERVICE" != "None" ]; then
    print_info "Service already exists. Triggering new deployment..."
    aws apprunner start-deployment \
        --service-arn "$EXISTING_SERVICE" \
        --region $REGION
    
    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn "$EXISTING_SERVICE" \
        --region $REGION \
        --query "Service.ServiceUrl" \
        --output text)
else
    # Create new service
    SERVICE_ARN=$(aws apprunner create-service \
        --cli-input-json file:///tmp/apprunner-config.json \
        --region $REGION \
        --query "Service.ServiceArn" \
        --output text)

    print_info "Service ARN: $SERVICE_ARN"
    print_info "Waiting for service to be running (this may take 5-10 minutes)..."

    # Wait for service to be running
    while true; do
        STATUS=$(aws apprunner describe-service \
            --service-arn $SERVICE_ARN \
            --region $REGION \
            --query "Service.Status" \
            --output text)
        
        if [ "$STATUS" = "RUNNING" ]; then
            break
        elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "DELETED" ]; then
            print_error "Service creation failed with status: $STATUS"
            exit 1
        fi
        
        print_info "Current status: $STATUS. Waiting..."
        sleep 30
    done

    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn $SERVICE_ARN \
        --region $REGION \
        --query "Service.ServiceUrl" \
        --output text)
fi

print_success "App Runner service is running!"
print_success "Service URL: https://$SERVICE_URL"

# Save service URL
echo "BACKEND_URL=https://$SERVICE_URL" > /tmp/backend-url.env

print_info ""
print_info "============================================"
print_info "NEXT STEPS"
print_info "============================================"
print_info "1. Test the backend:"
print_info "   curl https://$SERVICE_URL/api/health"
print_info ""
print_info "2. Update frontend with backend URL:"
print_info "   VITE_API_URL=https://$SERVICE_URL"
print_info ""
print_info "3. Deploy frontend to Amplify"
print_info "============================================"
