---
title: "Deploy API to AWS Lambda + API Gateway"
description: "Deploy NestJS API as serverless Lambda behind API Gateway for production HTTPS endpoint"
status: pending
priority: P1
effort: 1h
branch: main
tags: [aws, lambda, api-gateway, deployment, serverless]
created: 2026-03-22
---

# Deploy API to AWS Lambda + API Gateway

## Objective

Deploy the Share Money NestJS API to AWS Lambda behind API Gateway to get a public HTTPS endpoint for the frontend.

## Current State

- NestJS 11 API builds to single webpack bundle (`dist/apps/api/main.js`)
- DynamoDB tables deployed: `share-money-{trips,expenses,participants}-dev`
- Cognito deployed: `ap-southeast-1_RXkfjWBrk`
- Region: `ap-southeast-1`
- Node.js >=22.17.0 (package.json engines)
- No deployment infra exists yet

## Approach

Use `@codegenie/serverless-express` to wrap NestJS app in Lambda handler. CloudFormation template for API Gateway + Lambda. Single bundled JS file keeps Lambda package small (~100KB).

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 01 | Create Lambda handler and install deps | pending | [phase-01](phase-01-lambda-handler.md) |
| 02 | Create CloudFormation template (Lambda + API Gateway + IAM) | pending | [phase-02](phase-02-cloudformation.md) |
| 03 | Build, package, deploy, and verify | pending | [phase-03](phase-03-deploy-verify.md) |

## Key Files

- `apps/api/src/lambda.ts` - Lambda entry point (to create)
- `infrastructure/api-lambda.yaml` - CloudFormation template (to create)
- `scripts/deploy-api.sh` - Build + deploy script (to create)
- `apps/api/src/main.ts` - Existing app bootstrap
- `apps/api/src/app/app.module.ts` - NestJS root module

## Architecture

```
Client -> API Gateway (HTTPS) -> Lambda -> NestJS App -> DynamoDB
                                              |
                                        Cognito (JWT validation via JWKS)
```

## Risk Summary

- NestJS cold start on Lambda (~2-3s first request); acceptable for personal project
- Lambda 256MB memory should suffice; increase if needed
- API Gateway has 30s timeout; all current endpoints are fast DynamoDB ops
