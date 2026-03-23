---
phase: "03"
title: Deploy and Verify
status: pending
---

# Phase 03: Build, Package, Deploy, and Verify

## Context

- Parent: [plan.md](plan.md)
- Depends on: Phase 01 (lambda handler), Phase 02 (CloudFormation)

## Overview

Create deploy script, build Lambda bundle, upload to S3, deploy CloudFormation stack, test production endpoint.

## Key Insights

- Lambda code must be in S3 for deployment (inline limit is 4KB)
- Single webpack bundle (~100KB) keeps deploy fast
- Use `aws cloudformation package` for SAM templates (handles S3 upload automatically)
- Alternatively, manual S3 upload + `aws cloudformation deploy`
- Need S3 bucket for deployment artifacts

## Implementation Steps

### Step 1: Create S3 bucket for deploy artifacts

```bash
aws s3 mb s3://share-money-deploy-ap-southeast-1 --region ap-southeast-1
```

If bucket name is taken, use account-specific name:
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws s3 mb "s3://share-money-deploy-${ACCOUNT_ID}" --region ap-southeast-1
```

### Step 2: Create deploy script (scripts/deploy-api.sh)

```bash
#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-dev}
REGION=ap-southeast-1
STACK_NAME="share-money-api-${ENVIRONMENT}"
S3_BUCKET="share-money-deploy-ap-southeast-1"

echo "Building Lambda bundle..."
npx nx build-lambda api

echo "Packaging..."
cd dist/apps/api
zip -r /tmp/api-lambda.zip lambda.js
cd -

echo "Uploading to S3..."
aws s3 cp /tmp/api-lambda.zip "s3://${S3_BUCKET}/api/${ENVIRONMENT}/lambda.zip"

echo "Deploying CloudFormation stack: ${STACK_NAME}..."
aws cloudformation deploy \
  --template-file infrastructure/api-lambda.yaml \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION" \
  --parameter-overrides \
    Environment="$ENVIRONMENT" \
    S3Bucket="$S3_BUCKET" \
    S3Key="api/${ENVIRONMENT}/lambda.zip"

API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo ""
echo "API deployed successfully!"
echo "URL: $API_URL"
echo ""
echo "Set in frontend: VITE_API_URL=$API_URL"
```

### Step 3: Deploy

```bash
chmod +x scripts/deploy-api.sh
./scripts/deploy-api.sh dev
```

### Step 4: Verify

```bash
# Health check (public, uses @Public() decorator on AppController)
curl https://{api-url}/

# Auth-required endpoint (should return 401)
curl -v https://{api-url}/trips

# Auth test with real token
ID_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id ap-southeast-1_RXkfjWBrk \
  --client-id {client-id} \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME={email},PASSWORD={password} \
  --query 'AuthenticationResult.IdToken' --output text)

curl -H "Authorization: Bearer $ID_TOKEN" https://{api-url}/trips
```

## Todo

- [ ] Create S3 deployment bucket
- [ ] Create scripts/deploy-api.sh
- [ ] Build Lambda bundle
- [ ] Deploy CloudFormation stack
- [ ] Test public endpoint (GET /)
- [ ] Test authenticated endpoint returns 401 without token
- [ ] Test authenticated endpoint returns 200 with valid Cognito JWT
- [ ] Output VITE_API_URL for frontend config

## Success Criteria

- Stack deploys without errors
- `GET /` returns 200 with welcome/health response
- `GET /trips` returns 401 without token
- `GET /trips` returns 200 with valid Cognito JWT
- CORS headers present in responses (Access-Control-Allow-Origin)
- Cold start < 5s, warm response < 500ms

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cold start >5s | Slow first request | Accept for personal project; add provisioned concurrency later if needed |
| S3 bucket name taken | Can't create bucket | Use account-ID-suffixed bucket name |
| Lambda timeout | 502 from API Gateway | 30s timeout configured; monitor CloudWatch logs |
| Missing env vars | Runtime errors | Verify all env vars set before first request; check CloudWatch logs |

## Next Steps (optional future work)

- Share `VITE_API_URL` with frontend config
- Set up CI/CD for automatic deploys on push to main
- Add custom domain with Route53 + ACM certificate
- Add provisioned concurrency if cold starts become an issue
