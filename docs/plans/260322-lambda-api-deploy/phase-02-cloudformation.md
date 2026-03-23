---
phase: "02"
title: CloudFormation Template
status: pending
---

# Phase 02: CloudFormation Template (Lambda + API Gateway + IAM)

## Context

- Parent: [plan.md](plan.md)
- Depends on: Phase 01 (lambda handler)
- Existing templates: `infrastructure/cognito.yaml`, `infrastructure/dynamodb-tables.yaml`

## Overview

Create CloudFormation template `infrastructure/api-lambda.yaml` that provisions Lambda function, API Gateway HTTP API, IAM execution role, and CloudWatch logs.

## Key Insights

- Use HTTP API (API Gateway v2) -- cheaper, faster, simpler than REST API
- Lambda needs IAM policy for DynamoDB table access (3 tables + their GSIs)
- Environment variables pass Cognito and DynamoDB config to Lambda
- API Gateway auto-generates HTTPS URL: `https://{api-id}.execute-api.{region}.amazonaws.com`
- Use `AWS::Serverless` transform (SAM) for cleaner Lambda + APIGW definition
- Lambda runtime: `nodejs22.x` (matches project's Node.js >=22.17.0 requirement)

## Requirements

- Lambda function (Node.js 22.x runtime, 256MB, 30s timeout)
- HTTP API Gateway with proxy route `/{proxy+}` and root `/`
- IAM role: DynamoDB read/write on share-money tables, CloudWatch logs
- Environment vars from .env.example: NODE_ENV, DYNAMODB table names, COGNITO config, CORS_ORIGIN, ADMIN_PASSWORD
- CloudWatch log group with 14-day retention

## Architecture

```
Internet -> API Gateway HTTP API (HTTPS)
              |
           Lambda Function (Node.js 22.x, 256MB)
              | IAM Role
           DynamoDB Tables (trips, expenses, participants)
```

## Environment Variables for Lambda

From `.env.example`, the Lambda function needs:
- `NODE_ENV=production`
- `AWS_REGION=ap-southeast-1` (auto-set by Lambda)
- `DYNAMODB_TRIPS_TABLE`, `DYNAMODB_EXPENSES_TABLE`, `DYNAMODB_PARTICIPANTS_TABLE`
- `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_REGION`, `COGNITO_ISSUER`
- `CORS_ORIGIN`
- `ADMIN_PASSWORD`

Not needed in Lambda:
- `PORT` (no HTTP server)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (IAM role provides credentials)
- `JWT_SECRET` (Cognito handles auth in production)

## Implementation Steps

### Step 1: Create infrastructure/api-lambda.yaml

Key resources:
- `AWS::Serverless::Function` with HttpApi event
- `AWS::IAM::Role` with DynamoDB + CloudWatch policy
- `AWS::Logs::LogGroup`

Parameters:
- `Environment` (dev/staging/prod)
- `CognitoUserPoolId`, `CognitoClientId`, `CognitoRegion`
- `CorsOrigin`
- `AdminPassword` (NoEcho)
- `S3Bucket` + `S3Key` for Lambda code

Outputs:
- `ApiUrl` -- the HTTPS endpoint

### Step 2: IAM Policy

DynamoDB actions needed:
- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`
- `dynamodb:Query`, `Scan`, `BatchWriteItem`, `BatchGetItem`

Scoped to:
- `arn:aws:dynamodb:${Region}:${AccountId}:table/share-money-*-${Environment}`
- `arn:aws:dynamodb:${Region}:${AccountId}:table/share-money-*-${Environment}/index/*`

CloudWatch actions:
- `logs:CreateLogGroup`, `CreateLogStream`, `PutLogEvents`

### Step 3: CORS configuration

HTTP API built-in CORS config:
- `AllowOrigins`: from CorsOrigin parameter
- `AllowMethods`: GET, POST, PUT, DELETE, PATCH, OPTIONS
- `AllowHeaders`: Content-Type, Authorization, Accept, X-Admin-Password
- `AllowCredentials`: true

## Todo

- [ ] Create infrastructure/api-lambda.yaml
- [ ] Define Lambda function with env vars
- [ ] Define HTTP API Gateway with proxy route
- [ ] Define IAM role with DynamoDB + CloudWatch permissions
- [ ] Add CloudWatch log group with retention
- [ ] Validate template: `aws cloudformation validate-template`

## Success Criteria

- Template validates: `aws cloudformation validate-template --template-body file://infrastructure/api-lambda.yaml`
- All required env vars from .env.example are parameterized
- IAM follows least-privilege (only DynamoDB share-money tables, only CloudWatch logs)
- CORS configured at API Gateway level

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SAM transform not available | Deploy fails | Use `aws cloudformation package` which handles SAM transform, or fall back to plain CloudFormation |
| API Gateway CORS issues | Frontend can't call API | Configure CORS both in API Gateway and in NestJS app (belt and suspenders) |
| nodejs22.x not available in region | Deploy fails | Fall back to nodejs20.x if needed |

## Next Steps

Phase 03: Build, package, deploy, verify
