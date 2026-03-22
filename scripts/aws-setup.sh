#!/bin/bash

# Share Money API - AWS Setup Script
# This script helps you set up AWS services for the Share Money API

set -e

echo "🚀 Share Money API - AWS Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI first:"
    echo "  macOS: brew install awscli"
    echo "  Linux: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI found${NC}"
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS credentials configured (Account: ${ACCOUNT_ID})${NC}"
echo ""

# Get AWS region
read -p "Enter AWS region [ap-southeast-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-ap-southeast-1}

# Get environment
read -p "Enter environment (dev/staging/prod) [dev]: " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-dev}

echo ""
echo "Configuration:"
echo "  Region: ${AWS_REGION}"
echo "  Environment: ${ENVIRONMENT}"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy DynamoDB tables
echo ""
echo "📊 Deploying DynamoDB tables..."
cd "$(dirname "$0")/../infrastructure"

aws cloudformation deploy \
  --template-file dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-${ENVIRONMENT} \
  --parameter-overrides Environment=${ENVIRONMENT} \
  --region ${AWS_REGION} \
  --capabilities CAPABILITY_IAM

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DynamoDB tables created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create DynamoDB tables${NC}"
    exit 1
fi

# Get stack outputs
echo ""
echo "📋 DynamoDB Table Names:"
aws cloudformation describe-stacks \
  --stack-name share-money-dynamodb-${ENVIRONMENT} \
  --region ${AWS_REGION} \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table

# List created tables
echo ""
echo "📋 Verifying tables in DynamoDB:"
aws dynamodb list-tables --region ${AWS_REGION} | grep share-money

echo ""
echo -e "${GREEN}✅ DynamoDB setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up AWS Cognito User Pool (see DEPLOYMENT_GUIDE.md)"
echo "2. Update your .env file with:"
echo "   - COGNITO_USER_POOL_ID"
echo "   - COGNITO_CLIENT_ID"
echo "   - DYNAMODB table names"
echo "3. Run: npm start"
echo ""
echo "📚 Full guide: DEPLOYMENT_GUIDE.md"
