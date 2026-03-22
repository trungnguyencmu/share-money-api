# Codebase Review Improvement Plan

**Created:** 2026-03-22
**Status:** Pending
**Total Phases:** 5

## Overview

Structured remediation plan from codebase review. Ordered by blast radius and dependency chain -- each phase builds on the previous.

## Phases

| Phase | Name | Priority | Status | Issues | Link |
|-------|------|----------|--------|--------|------|
| 01 | Critical Config & Security Fixes | P0 | Done | C1-C6 | [phase-01](./phase-01-critical-config-security.md) |
| 02 | DynamoDB Reliability | P0 | Done | M1, M2 | [phase-02](./phase-02-dynamodb-reliability.md) |
| 03 | Data Integrity & Business Logic | P1 | Pending | M3-M8 | [phase-03](./phase-03-data-integrity.md) |
| 04 | API Design & Auth Hardening | P1 | Pending | M7, M9-M12 | [phase-04](./phase-04-api-design-auth.md) |
| 05 | Code Quality & DX | P2 | Pending | m1-m14 | [phase-05](./phase-05-code-quality-dx.md) |

## Dependency Graph

```
Phase 01 (config/security) ──> Phase 02 (DynamoDB)
                           ──> Phase 03 (data integrity)
                           ──> Phase 04 (API design)
Phase 02-04 (all) ─────────> Phase 05 (quality/DX)
```

## Success Criteria

- Zero hardcoded secrets or fallback passwords
- All DynamoDB queries handle pagination
- Payer names validated against participants
- Swagger gated by environment
- Strict TypeScript enabled
- All env var names consistent between code and .env.example
