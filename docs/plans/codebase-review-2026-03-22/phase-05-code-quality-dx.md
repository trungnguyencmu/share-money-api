# Phase 05: Code Quality & Developer Experience

**Date:** 2026-03-22
**Priority:** P2
**Status:** Pending

## Context

- [plan.md](./plan.md)
- Issues: m1-m14

## Overview

Non-blocking improvements to code quality, consistency, and developer experience.

## Implementation Steps

### Quick wins (batch together)
- **m1:** Align `APP_MODE` → `NODE_ENV` in `main.ts`
- **m2:** Replace `Math.random()` with `randomUUID()` in `id-generator.ts`
- **m5:** Remove unused `formatTransaction`/`formatBalance` from settlement-calculator
- **m6:** Round intermediate settlement values for VND integer currency
- **m8:** Define meaningful ESLint module boundary tags
- **m9:** Replace `console.log` with NestJS `Logger`
- **m10:** Remove dead global prefix code
- **m11:** Remove `passWithNoTests` once tests exist
- **m12:** Remove phantom `.github/workflows/ci.yml` from `sharedGlobals`
- **m13:** Add production build config with `optimization: true`
- **m14:** Rename `/participants/names` to avoid route conflict

### Refactoring
- **m3:** Extract ownership verification to single reusable method in `trips.service.ts`
- **m4:** Remove redundant `@UseGuards(JwtAuthGuard)` from controllers (global guard handles it)

### Config hardening
- **m7:** Enable `"strict": true` in `tsconfig.base.json` (will surface type errors -- fix iteratively)

## Todo

- [ ] Batch quick wins (m1, m2, m5, m9, m10, m11, m12, m13)
- [ ] m3: Refactor ownership verification
- [ ] m4: Remove redundant guards
- [ ] m6: Fix settlement rounding for VND
- [ ] m8: Define ESLint module boundary rules
- [ ] m7: Enable strict TypeScript (do last -- most churn)
- [ ] m14: Rename participant names endpoint

## Success Criteria

- Zero `console.log` in source
- No dead/unused code
- Strict TypeScript compiles clean
- ESLint enforces module boundaries
