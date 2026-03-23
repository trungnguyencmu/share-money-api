#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-dev}
REGION=ap-southeast-1
STACK_NAME="share-money-api-${ENVIRONMENT}"
S3_BUCKET="share-money-deploy-${ENVIRONMENT}-$(aws sts get-caller-identity --query Account --output text)"

echo "=== Deploying Share Money API (${ENVIRONMENT}) ==="

# Step 1: Build Lambda bundle
echo "Building Lambda bundle..."
npx nx build-lambda api
echo "Bundle size: $(ls -lh dist/apps/api-lambda/lambda.js | awk '{print $5}')"

# Step 2: Create zip (include all chunks)
echo "Packaging..."
cd dist/apps/api-lambda
zip -j /tmp/api-lambda.zip *.js
cd - > /dev/null
echo "Zip size: $(ls -lh /tmp/api-lambda.zip | awk '{print $5}')"

# Step 3: Ensure S3 bucket exists
if ! aws s3 ls "s3://${S3_BUCKET}" --region "$REGION" 2>/dev/null; then
  echo "Creating S3 bucket: ${S3_BUCKET}"
  aws s3 mb "s3://${S3_BUCKET}" --region "$REGION"
fi

# Step 4: Upload to S3
S3_KEY="api/${ENVIRONMENT}/lambda-$(date +%Y%m%d-%H%M%S).zip"
echo "Uploading to s3://${S3_BUCKET}/${S3_KEY}..."
aws s3 cp /tmp/api-lambda.zip "s3://${S3_BUCKET}/${S3_KEY}" --region "$REGION"

# Step 5: Deploy CloudFormation
echo "Deploying CloudFormation stack: ${STACK_NAME}..."
aws cloudformation deploy \
  --template-file infrastructure/api-lambda.yaml \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --region "$REGION" \
  --parameter-overrides \
    Environment="$ENVIRONMENT" \
    S3Bucket="$S3_BUCKET" \
    S3Key="$S3_KEY" \
    CognitoUserPoolId="ap-southeast-1_RXkfjWBrk" \
    CognitoClientId="3u731bj9fqbm610epv6b1el5er" \
    CognitoRegion="ap-southeast-1" \
    CorsOrigin="*" \
    AdminPassword="ShareMoney2026!Prod" \
    GuestJwtSecret="ShareMoneyGuest2026!SecretKey"

# Step 6: Get API URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo ""
echo "=== Deployment Complete ==="
echo "API URL: ${API_URL}"
echo ""
echo "Frontend config:"
echo "  VITE_API_URL=${API_URL}"
echo ""
echo "Test: curl ${API_URL}/"
