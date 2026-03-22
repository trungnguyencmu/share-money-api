#!/bin/bash

# Test AWS Connection for Share Money API

set -e

echo "🔍 Testing AWS Connection"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI installed${NC}"

# Check credentials
echo ""
echo "Testing AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    USER=$(aws sts get-caller-identity --query Arn --output text)
    echo -e "${GREEN}✅ AWS credentials valid${NC}"
    echo "   Account: ${ACCOUNT}"
    echo "   User: ${USER}"
else
    echo -e "${RED}❌ AWS credentials invalid${NC}"
    echo "   Run: aws configure"
    exit 1
fi

# Get region from .env or use default
REGION=${AWS_REGION:-ap-southeast-1}

# Test DynamoDB
echo ""
echo "Testing DynamoDB access..."
if aws dynamodb list-tables --region ${REGION} &> /dev/null; then
    echo -e "${GREEN}✅ DynamoDB access granted${NC}"

    # Check for our tables
    TABLES=$(aws dynamodb list-tables --region ${REGION} --output text | grep share-money || true)
    if [ -n "$TABLES" ]; then
        echo "   Found tables:"
        echo "$TABLES" | sed 's/^/     - /'
    else
        echo -e "${YELLOW}⚠️  No share-money tables found${NC}"
        echo "   Run: ./scripts/aws-setup.sh"
    fi
else
    echo -e "${RED}❌ DynamoDB access denied${NC}"
    exit 1
fi

# Test Cognito (if configured)
echo ""
echo "Testing Cognito access..."
USER_POOLS=$(aws cognito-idp list-user-pools --max-results 10 --region ${REGION} 2>/dev/null || echo "")
if [ -n "$USER_POOLS" ]; then
    echo -e "${GREEN}✅ Cognito access granted${NC}"

    # Check for our user pool
    POOL=$(echo "$USER_POOLS" | grep share-money || true)
    if [ -n "$POOL" ]; then
        echo "   Found user pools with 'share-money'"
    else
        echo -e "${YELLOW}⚠️  No share-money user pools found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot access Cognito (might be permission issue)${NC}"
fi

# Test S3 (optional)
echo ""
echo "Testing S3 access..."
if aws s3 ls &> /dev/null; then
    echo -e "${GREEN}✅ S3 access granted${NC}"

    BUCKET=$(aws s3 ls | grep share-money || true)
    if [ -n "$BUCKET" ]; then
        echo "   Found buckets:"
        echo "$BUCKET" | sed 's/^/     - /'
    else
        echo -e "${YELLOW}⚠️  No share-money buckets found (optional)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot access S3${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ AWS connection test complete!${NC}"
echo ""
echo "Next steps:"
echo "1. If tables not found: run ./scripts/aws-setup.sh"
echo "2. Create Cognito User Pool (see DEPLOYMENT_GUIDE.md)"
echo "3. Update .env with AWS credentials"
echo "4. Run: npm start"
