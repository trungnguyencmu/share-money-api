# Phase 04: API Design & Auth Hardening

**Date:** 2026-03-22
**Priority:** P1
**Status:** Pending

## Context

- [plan.md](./plan.md)
- Issues: M7, M9, M10, M11, M12

## Overview

API design issues that affect security posture, compatibility with proxies/CDNs, and DynamoDB cost efficiency.

## Implementation Steps

### M7: Uniform 404 for unauthorized access
1. In `trips.service.ts`, return `NotFoundException` for both "not found" and "not owned"
2. Check ownership + existence + active status together, single 404 response

### M9: Replace DELETE body with header or POST
1. Move `password` from request body to `X-Admin-Password` header
2. Update DTOs and controller decorators
3. Alternative: change to `POST /trips/:tripId/expenses/:id/delete`

### M10: Add Cognito IaC
1. Create `infrastructure/cognito.yaml` with User Pool + Client
2. Export pool ID and client ID as CloudFormation outputs
3. Reference in `.env.example`

### M11: Use participantId instead of participantName as sort key
1. Add `participantId` (UUID) as sort key
2. Store `participantName` as regular attribute
3. Requires data migration for existing records
4. **Note:** This is a breaking schema change -- plan migration carefully

### M12: Optimize active trips query
1. Option A: Add GSI on `userId + isActive` (sparse index)
2. Option B: Change key design to separate active/inactive
3. Evaluate based on expected ratio of active to total trips

## Todo

- [ ] M7: Uniform 404 responses
- [ ] M9: Move delete password out of request body
- [ ] M10: Cognito CloudFormation template
- [ ] M11: Evaluate participantId migration (may defer)
- [ ] M12: Optimize active trips GSI

## Risk Assessment

- **M11** is a breaking schema change -- requires migration strategy, may defer to future
- **M9** is a breaking API change -- coordinate with frontend
- **M7** is backward-compatible (just changes error codes)
