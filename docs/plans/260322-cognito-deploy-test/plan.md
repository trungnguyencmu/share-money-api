---
title: "Deploy Cognito & Test Authentication"
description: "Deploy AWS Cognito User Pool, create test user, verify end-to-end JWT auth with API"
status: pending
priority: P1
effort: 30m
branch: main
tags: [aws, cognito, auth, testing]
created: 2026-03-22
---

# Deploy Cognito & Test Authentication

## Objective

Deploy AWS Cognito User Pool via CloudFormation, create test user, obtain JWT, and verify end-to-end authenticated API calls on localhost:3000.

## Current State

- CloudFormation template ready: `infrastructure/cognito.yaml`
- Auth module implemented: JWT strategy supports both Cognito (RS256) and local dev (HS256)
- Global `JwtAuthGuard` applied; `@Public()` decorator exempts health check
- `.env.example` has Cognito placeholder vars; `.env` needs real values post-deploy
- Region: `ap-southeast-1`
- Hosted UI domain: `share-money-dev` (may conflict if already taken)

## Phases

| Phase | Description | File |
|-------|-------------|------|
| 01 | Deploy Cognito stack, extract outputs, configure .env | `phase-01-deploy-cognito.md` |
| 02 | Create test user, authenticate, obtain JWT token | `phase-02-create-user-get-token.md` |
| 03 | Test authenticated API calls end-to-end | `phase-03-test-api-auth.md` |

## Key Files

- `infrastructure/cognito.yaml` - CloudFormation template
- `infrastructure/README.md` - Deploy commands reference
- `apps/api/src/auth/jwt.strategy.ts` - JWT validation (Cognito RS256 or local HS256)
- `apps/api/src/auth/jwt-auth.guard.ts` - Global guard with @Public() bypass
- `apps/api/src/auth/auth.module.ts` - Auth module registration
- `.env.example` - Env var template

## Risk Summary

- Domain `share-money-dev` may already be taken globally; pick unique prefix if deploy fails
- Token uses `id_token` (not `access_token`) -- jwt.strategy validates audience via COGNITO_CLIENT_ID
- JWKS endpoint must be reachable from dev machine (no VPN blocking AWS endpoints)
