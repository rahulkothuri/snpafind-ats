# AWS Deployment Guide - SnpaFind ATS

Complete guide for deploying the ATS application to AWS using managed services.

## Architecture

| Component | AWS Service | Purpose |
|-----------|-------------|---------|
| Frontend | AWS Amplify | React/Vite hosting with CI/CD |
| Backend | AWS App Runner | Containerized Express.js API |
| Database | Amazon RDS | PostgreSQL 15 |
| File Storage | Amazon S3 | Resume and attachment uploads |
| Secrets | AWS Secrets Manager | Secure credential storage |

## Prerequisites

- AWS CLI v2 configured with appropriate permissions
- Docker installed locally
- Node.js 20+
- Git repository (GitHub/GitLab/CodeCommit)

## Quick Start

### Step 1: Deploy Infrastructure

```bash
# Make scripts executable
chmod +x infrastructure/scripts/*.sh

# Deploy CloudFormation stack
cd infrastructure/scripts

./deploy.sh \
  --stack-name snpafind-ats \
  --region ap-south-1 \
  --db-password "YourSecurePassword123!" \
  --jwt-secret "your-very-long-jwt-secret-key-at-least-32-chars" \
  --resend-key "re_xxxxxxxx"  # Optional
```

This creates: VPC, RDS PostgreSQL, S3 bucket, Secrets Manager, ECR repository, IAM roles.

### Step 2: Build and Push Docker Image

```bash
# Get ECR repository URI from CloudFormation outputs
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name snpafind-ats \
  --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryUri'].OutputValue" \
  --output text)

# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin $(echo $ECR_URI | cut -d'/' -f1)

# Build and push
cd backend
docker build -t $ECR_URI:latest .
docker push $ECR_URI:latest
```

### Step 3: Run Database Migrations

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name snpafind-ats \
  --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" \
  --output text)

# Set DATABASE_URL and run migrations
export DATABASE_URL="postgresql://atsadmin:YourSecurePassword123!@$RDS_ENDPOINT:5432/ats_production"

cd backend
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

### Step 4: Create App Runner Service

```bash
cd infrastructure/scripts
./create-apprunner.sh --stack-name snpafind-ats --region ap-south-1
```

This creates the App Runner service with VPC connectivity to RDS.

### Step 5: Deploy Frontend to Amplify

```bash
# Get backend URL from App Runner
BACKEND_URL="https://your-apprunner-url.ap-south-1.awsapprunner.com"

./setup-amplify.sh \
  --backend-url $BACKEND_URL \
  --repo-url "https://github.com/your-username/snpafind-ats"
```

Or manually in AWS Console:
1. Go to **AWS Amplify** → **Create App**
2. Connect your GitHub repository
3. Select the `frontend` folder as app root
4. Add environment variable: `VITE_API_URL` = Backend App Runner URL
5. Deploy

## Environment Variables

### Backend (App Runner)
Set automatically from Secrets Manager:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service key
- `AWS_S3_BUCKET` - S3 bucket for uploads
- `AWS_REGION` - AWS region

### Frontend (Amplify)
- `VITE_API_URL` - Backend API URL

## Estimated Costs

| Service | Monthly Cost |
|---------|-------------|
| RDS (db.t4g.micro) | ~$13 |
| App Runner (0.25 vCPU) | ~$5-20 |
| Amplify | ~$5-15 |
| S3 + Secrets | ~$2 |
| **Total** | **~$25-50** |

## Cleanup

```bash
# Delete App Runner service
aws apprunner delete-service --service-arn <service-arn>

# Delete Amplify app
aws amplify delete-app --app-id <app-id>

# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name snpafind-ats
```

## Troubleshooting

### App Runner can't connect to RDS
- Verify VPC connector is in same VPC as RDS
- Check security group allows PostgreSQL port 5432 from App Runner SG

### Amplify build fails
- Check build logs in Amplify Console
- Verify `VITE_API_URL` environment variable is set
- Ensure `amplify.yml` is in the repository

### Database migrations fail
- Ensure you're running migrations from a location that can reach RDS
- For initial setup, you may need to temporarily allow public access or use a bastion host
