---
phase: "03"
title: Test Authenticated API Calls End-to-End
status: pending
---

# Phase 03: Test Authenticated API Calls End-to-End

## Context

- Depends on Phase 02 (id_token obtained)
- API: `localhost:3000`
- Global JwtAuthGuard applied; only `GET /` is @Public()
- Endpoints: trips, expenses, participants, settlement

## Overview

Start the API server, verify public endpoint works without auth, verify protected endpoints reject unauthenticated requests, then test full CRUD flow with JWT token.

## Key Insights

- jwt.strategy validates against Cognito JWKS endpoint (RS256)
- Guard checks `IS_PUBLIC_KEY` metadata; only `GET /` is public
- User extracted from token: `{ userId: sub, email, username }`
- Trips are scoped by `userId` from token -- row-level security
- Delete operations require `X-Admin-Password` header

## Requirements

- API running on localhost:3000 with Cognito env vars configured
- Valid id_token from Phase 02
- DynamoDB tables deployed (separate stack)

## Related Code

- `apps/api/src/auth/jwt-auth.guard.ts` - global guard
- `apps/api/src/auth/jwt.strategy.ts` - token validation + user extraction
- `apps/api/src/trips/` - trip CRUD
- `apps/api/src/expenses/` - expense CRUD
- `apps/api/src/participants/` - participant management
- `apps/api/src/settlement/` - settlement calculation

## Implementation Steps

### Step 1: Start the API

```bash
cd /Users/lucas/Documents/Personal/share-money-api
npm run serve
```

Wait for: `Application is running on: http://localhost:3000`

### Step 2: Test public endpoint (no auth)

```bash
curl -s http://localhost:3000 | python3 -m json.tool
```

Expected: 200 OK with status message.

### Step 3: Test protected endpoint WITHOUT token (expect 401)

```bash
curl -s -w "\nHTTP_CODE:%{http_code}\n" http://localhost:3000/trips
```

Expected: `HTTP_CODE:401` with `Unauthorized` message.

### Step 4: Test protected endpoint WITH token (expect 200)

```bash
# Set token from Phase 02
ID_TOKEN="<your-id-token>"

curl -s -H "Authorization: Bearer $ID_TOKEN" \
  http://localhost:3000/trips | python3 -m json.tool
```

Expected: 200 OK with empty array `[]` (no trips yet).

### Step 5: Create a trip

```bash
curl -s -X POST http://localhost:3000/trips \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tripName": "Test Trip Cognito Auth"}' | python3 -m json.tool
```

Expected: 201 Created with trip object containing `tripId`, `userId` (from token sub), `tripName`.

Save the `tripId`:

```bash
TRIP_ID="<returned-trip-id>"
```

### Step 6: Add participants

```bash
curl -s -X POST "http://localhost:3000/trips/$TRIP_ID/participants" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantName": "Alice"}' | python3 -m json.tool

curl -s -X POST "http://localhost:3000/trips/$TRIP_ID/participants" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantName": "Bob"}' | python3 -m json.tool
```

### Step 7: Create expense

```bash
curl -s -X POST "http://localhost:3000/trips/$TRIP_ID/expenses" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "Alice",
    "title": "Dinner",
    "amount": 100,
    "date": "2026-03-22",
    "splitBetween": ["Alice", "Bob"]
  }' | python3 -m json.tool
```

### Step 8: Get settlement

```bash
curl -s -H "Authorization: Bearer $ID_TOKEN" \
  "http://localhost:3000/trips/$TRIP_ID/settlement" | python3 -m json.tool
```

Expected: settlement with balances and transactions (Bob owes Alice 50).

### Step 9: Test with expired/invalid token

```bash
# Tampered token (append 'x' to break signature)
curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -H "Authorization: Bearer ${ID_TOKEN}x" \
  http://localhost:3000/trips
```

Expected: 401 Unauthorized.

### Step 10: Cleanup test data (optional)

```bash
# Delete trip (requires admin password)
ADMIN_PW="<your-admin-password-from-env>"

curl -s -X DELETE "http://localhost:3000/trips/$TRIP_ID" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "X-Admin-Password: $ADMIN_PW" | python3 -m json.tool
```

## Todo

- [ ] Start API server with Cognito env vars
- [ ] Verify public endpoint (GET /) returns 200 without auth
- [ ] Verify protected endpoint returns 401 without token
- [ ] Verify protected endpoint returns 200 with valid token
- [ ] Create trip and verify userId from token sub
- [ ] Add participants
- [ ] Create expense
- [ ] Get settlement calculation
- [ ] Verify invalid token returns 401
- [ ] Optional: cleanup test data

## Success Criteria

- Public endpoint accessible without auth
- Protected endpoints return 401 without valid JWT
- Valid Cognito JWT grants access to all protected endpoints
- Trip created with `userId` matching token `sub` claim
- Full CRUD cycle works: create trip -> add participants -> add expense -> get settlement
- Invalid/expired token correctly rejected

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWKS fetch fails (network) | All auth fails | Check connectivity to cognito-idp endpoint |
| Token audience mismatch | 401 on valid token | Verify COGNITO_CLIENT_ID in .env matches token aud |
| DynamoDB tables not deployed | 500 on CRUD ops | Deploy dynamodb-tables.yaml stack first |
| Token expired (1hr) | Auth fails mid-testing | Re-authenticate via Phase 02 Step 5 |

## Security Considerations

- Never log full tokens in production
- Test with minimal permissions (no admin IAM role on API)
- Verify row-level security: different user token should NOT see test trip
- Admin password for deletes adds extra protection layer

## Next Steps

After successful testing:
- Remove test user if no longer needed: `aws cognito-idp admin-delete-user --user-pool-id $POOL_ID --username test@example.com --region ap-southeast-1`
- Consider adding `ALLOW_USER_PASSWORD_AUTH` permanently or reverting to SRP-only for production
- Document the working auth flow in project docs
