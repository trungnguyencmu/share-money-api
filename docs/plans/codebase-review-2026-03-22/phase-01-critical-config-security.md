# Phase 01: Critical Config & Security Fixes

**Date:** 2026-03-22
**Priority:** P0 -- Blocks deployment
**Status:** Pending

## Context

- [plan.md](./plan.md)
- Issues: C1, C2, C3, C4, C5, C6

## Overview

App has multiple config mismatches that prevent correct operation and security gaps that allow auth bypass. Must fix before any environment beyond local dev.

## Key Insights

- JWT strategy falls back to hardcoded `'dev-secret-key'` -- full auth bypass
- CORS env var name mismatch means CORS config never loads from env
- DynamoDB table names in `.env.example` don't match CloudFormation output
- Swagger has no production gate
- Delete password mechanism is fundamentally weak

## Requirements

- No hardcoded secret fallbacks in any environment
- App must fail-fast on missing critical env vars
- CORS must load from environment correctly
- Swagger disabled in production
- DynamoDB tables must have DeletionPolicy

## Related Code Files

- `apps/api/src/auth/jwt.strategy.ts` (C1)
- `apps/api/src/expenses/expenses.service.ts` (C2)
- `apps/api/src/main.ts` (C3, C5)
- `infrastructure/dynamodb-tables.yaml` (C4)
- `.env.example` (C5, C6)

## Implementation Steps

### C1: Remove hardcoded JWT fallback
1. In `jwt.strategy.ts`, remove `|| 'dev-secret-key'` fallback
2. Add startup validation: throw if `COGNITO_USER_POOL_ID` or `COGNITO_REGION` missing
3. Keep JWKS path as primary (no HS256 fallback in production)

### C2: Fix delete password mechanism
1. Remove `|| 'ok'` fallback from `expenses.service.ts`
2. Add startup validation: throw if `ADMIN_PASSWORD` not set or is a known placeholder
3. Use `crypto.timingSafeEqual()` for comparison
4. Update `.env.example` with `ADMIN_PASSWORD=CHANGE_ME_strong_password`

### C3: Gate Swagger by environment
1. In `main.ts`, wrap Swagger setup in `if (!isProduction)` block
2. `isProduction` already exists at line 24

### C4: Add DeletionPolicy to DynamoDB tables
1. Add `DeletionPolicy: Retain` to all three table resources in `dynamodb-tables.yaml`

### C5: Fix CORS env var name
1. In `main.ts`, change `CORS_ORIGINS` to `CORS_ORIGIN` (matching `.env.example`)
2. OR update `.env.example` to `CORS_ORIGINS` -- pick one, be consistent

### C6: Fix table names in .env.example
1. Update `.env.example` table names to include `-dev` suffix matching CloudFormation

## Todo

- [ ] C1: Remove JWT fallback, add startup validation
- [ ] C2: Harden delete password mechanism
- [ ] C3: Gate Swagger behind environment check
- [ ] C4: Add DeletionPolicy to CloudFormation tables
- [ ] C5: Fix CORS env var name mismatch
- [ ] C6: Fix table name mismatch in .env.example

## Success Criteria

- App throws on startup if critical env vars missing
- No hardcoded secrets in codebase
- Swagger only accessible in development
- CloudFormation stack deletion won't destroy data
- CORS loads correctly from environment

## Risk Assessment

- **C1 is highest risk** -- auth bypass in any env missing Cognito vars
- **C4** -- data loss if someone runs `delete-stack` on production
- Changes are isolated, low regression risk

## Security Considerations

- After C1 fix, ensure local dev still works (document required env vars)
- After C2, existing clients sending `password: 'ok'` will break -- coordinate with frontend
