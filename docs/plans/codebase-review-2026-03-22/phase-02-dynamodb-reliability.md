# Phase 02: DynamoDB Reliability

**Date:** 2026-03-22
**Priority:** P0 -- Silent data loss at scale
**Status:** Pending

## Context

- [plan.md](./plan.md)
- Issues: M1, M2

## Overview

DynamoDB queries silently drop results beyond 1MB and batch deletes run unbounded parallel requests. Both cause data loss/corruption under load.

## Key Insights

- DynamoDB `Query`/`Scan` return max 1MB per call; `LastEvaluatedKey` indicates more pages
- Current code returns only first page, silently dropping remaining items
- `batchDelete` fires unlimited parallel `DeleteItem` calls via `Promise.all`
- DynamoDB native `BatchWriteItem` handles 25 items per batch with retry support

## Requirements

- All DynamoDB queries must handle pagination (loop until no `LastEvaluatedKey`)
- Batch operations must use chunking with concurrency limits
- Failed batch items must be retried

## Related Code Files

- `apps/api/src/database/dynamodb.service.ts:112-154`
- `apps/api/src/database/repositories/trips.repository.ts`
- `apps/api/src/database/repositories/expenses.repository.ts`
- `apps/api/src/database/repositories/participants.repository.ts`

## Implementation Steps

### M1: Handle DynamoDB pagination
1. In `dynamodb.service.ts`, modify `query()` to loop while `LastEvaluatedKey` exists
2. Accumulate all items across pages
3. Same for `scan()` if used
4. Consider adding optional `limit` param for caller-controlled pagination

### M2: Fix batch delete
1. Replace `Promise.all` of individual `DeleteItem` with `BatchWriteItem`
2. Chunk into groups of 25 (DynamoDB limit)
3. Handle `UnprocessedItems` with exponential backoff retry
4. Add concurrency control (process N chunks at a time)

## Todo

- [ ] M1: Add pagination loop to `query()` and `scan()`
- [ ] M2: Rewrite `batchDelete` with `BatchWriteItem` + chunking + retry
- [ ] Test with large datasets (100+ items)

## Success Criteria

- Query returns all items regardless of result size
- Batch delete handles 1000+ items without errors
- No `UnprocessedItems` left behind

## Risk Assessment

- Low regression risk -- changes are internal to `DynamoDBService`
- Pagination loop needs a safety limit to prevent infinite loops on malformed responses
