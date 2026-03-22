# Phase 03: Data Integrity & Business Logic

**Date:** 2026-03-22
**Priority:** P1 -- Corrupts settlement calculations
**Status:** Pending

## Context

- [plan.md](./plan.md)
- Issues: M3, M4, M5, M6, M8

## Overview

Multiple gaps allow inconsistent data: unvalidated payer names, case-sensitive participant matching, orphan-able participants, and zero-amount expenses. All corrupt settlement math.

## Key Insights

- Payer field is free-text; typos create phantom participants in settlement
- Participant names: exists-check uses raw input, create trims -- mismatch
- Deleting a participant doesn't check if they're a payer on existing expenses
- Soft-deleted trips can be updated; `UpdateTripDto` exposes `isActive` as backdoor
- `@Min(0)` allows zero-amount expenses

## Requirements

- Payer must match an existing participant (case-insensitive)
- Participant names normalized consistently (trim + lowercase for matching)
- Participant deletion blocked if referenced as payer
- Inactive trips reject all mutations
- Expense amount must be positive

## Related Code Files

- `apps/api/src/expenses/expenses.service.ts` (M3, M8)
- `apps/api/src/participants/participants.service.ts` (M4, M5)
- `apps/api/src/trips/trips.service.ts` (M6)
- `libs/shared/src/lib/dtos/trip.dto.ts` (M6)
- `libs/shared/src/lib/dtos/expense.dto.ts` (M8)

## Implementation Steps

### M3: Validate payer against participants
1. In `expenses.service.ts` `create()`, fetch trip participants
2. Check payer matches an existing participant name (case-insensitive)
3. Throw `BadRequestException` if no match
4. Same check in `update()` if payer is being changed

### M4: Normalize participant names
1. In `CreateParticipantDto`, add a `@Transform` to trim + normalize
2. In `participants.service.ts`, normalize before exists-check AND create
3. Decide on case strategy: store original case, match case-insensitive

### M5: Block participant deletion if referenced
1. In `participants.service.ts` `remove()`, query expenses for this trip
2. Check if any expense has this participant as payer
3. Throw `ConflictException` if referenced

### M6: Protect inactive trips from mutation
1. In `trips.service.ts` `update()` and `remove()`, add `isActive` check
2. Remove `isActive` from `UpdateTripDto` -- control only via dedicated endpoint

### M8: Require positive expense amount
1. In `expense.dto.ts`, change `@Min(0)` to `@IsPositive()` (already imported)

## Todo

- [ ] M8: Change `@Min(0)` to `@IsPositive()`
- [ ] M4: Add name normalization in DTO + service
- [ ] M3: Validate payer against trip participants
- [ ] M5: Block participant deletion when referenced as payer
- [ ] M6: Add `isActive` guard to trip mutations, remove from UpdateTripDto

## Success Criteria

- Cannot create expense with payer not in participant list
- `" Alice"` and `"alice"` resolve to same participant
- Cannot delete participant who is a payer
- Cannot update/delete inactive trips
- Cannot create zero-amount expense

## Risk Assessment

- **M3** may break existing clients that create expenses before adding participants -- order matters
- **M4** name normalization: existing data may have inconsistent casing -- migration needed?
- **M6** removing `isActive` from DTO is a breaking API change
