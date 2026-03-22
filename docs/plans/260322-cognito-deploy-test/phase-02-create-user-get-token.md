---
phase: "02"
title: Create Test User & Obtain JWT Token
status: pending
---

# Phase 02: Create Test User & Obtain JWT Token

## Context

- Depends on Phase 01 (Cognito stack deployed, .env configured)
- Auth code: `apps/api/src/auth/jwt.strategy.ts`
- Client has `ALLOW_USER_SRP_AUTH` -- can use `initiate-auth` with SRP or admin commands

## Overview

Create a confirmed test user in Cognito, authenticate via AWS CLI, extract id_token for API testing.

## Key Insights

- `GenerateSecret: false` on client -- can use `admin-initiate-auth` without secret hash
- jwt.strategy.ts validates `audience` against `COGNITO_CLIENT_ID` -- must use `id_token` (has `aud` claim), NOT `access_token` (has no `aud`)
- Token payload expected: `sub`, `email`, `cognito:username`
- Token expiry: 1 hour

## Requirements

- Phase 01 complete (POOL_ID and CLIENT_ID available)
- AWS CLI with `cognito-idp:AdminCreateUser`, `cognito-idp:AdminSetUserPassword`, `cognito-idp:AdminInitiateAuth` permissions

## Architecture

```
AWS CLI -> Cognito AdminCreateUser -> AdminSetUserPassword (confirm)
AWS CLI -> Cognito AdminInitiateAuth (USER_PASSWORD_AUTH must be enabled, or use hosted UI)
```

**Important:** The template only enables `ALLOW_USER_SRP_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`. Direct `USER_PASSWORD_AUTH` is NOT enabled. Options:
1. Use hosted UI to sign in (implicit flow returns id_token in URL)
2. Add `ALLOW_USER_PASSWORD_AUTH` to template and redeploy
3. Use AWS SDK/CLI with SRP flow (complex)

Recommended: Option 2 (simplest for testing).

## Related Code

- `infrastructure/cognito.yaml` - ExplicitAuthFlows config
- `apps/api/src/auth/jwt.strategy.ts` - validates RS256 tokens from Cognito JWKS

## Implementation Steps

### Step 1: Enable USER_PASSWORD_AUTH (if not already)

Add `ALLOW_USER_PASSWORD_AUTH` to ExplicitAuthFlows in `cognito.yaml`:

```yaml
ExplicitAuthFlows:
  - ALLOW_USER_SRP_AUTH
  - ALLOW_USER_PASSWORD_AUTH
  - ALLOW_REFRESH_TOKEN_AUTH
```

Redeploy:

```bash
cd infrastructure
aws cloudformation deploy \
  --template-file cognito.yaml \
  --stack-name share-money-cognito-dev \
  --parameter-overrides Environment=dev CallbackUrl=http://localhost:5173 \
  --region ap-southeast-1
```

### Step 2: Create test user

```bash
# Set variables (from Phase 01)
POOL_ID="<your-user-pool-id>"
CLIENT_ID="<your-client-id>"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPass123"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id "$POOL_ID" \
  --username "$TEST_EMAIL" \
  --user-attributes Name=email,Value="$TEST_EMAIL" Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region ap-southeast-1
```

### Step 3: Set permanent password (confirms user)

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id "$POOL_ID" \
  --username "$TEST_EMAIL" \
  --password "$TEST_PASSWORD" \
  --permanent \
  --region ap-southeast-1
```

### Step 4: Authenticate and get tokens

```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id "$POOL_ID" \
  --client-id "$CLIENT_ID" \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="$TEST_EMAIL",PASSWORD="$TEST_PASSWORD" \
  --region ap-southeast-1
```

**Note:** `admin-initiate-auth` with `ADMIN_USER_PASSWORD_AUTH` requires `ALLOW_USER_PASSWORD_AUTH` on the client. If that flow isn't enabled, you'll get `InvalidParameterException`.

### Step 5: Extract id_token

```bash
# Full command with jq to extract token
ID_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id "$POOL_ID" \
  --client-id "$CLIENT_ID" \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="$TEST_EMAIL",PASSWORD="$TEST_PASSWORD" \
  --region ap-southeast-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

echo "ID_TOKEN=$ID_TOKEN"
```

### Step 6: Verify token contents (optional)

Decode JWT payload (middle segment):

```bash
echo "$ID_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | python3 -m json.tool
```

Should show: `sub`, `email`, `aud` (matching CLIENT_ID), `iss` (matching COGNITO_ISSUER).

### Alternative: Use Hosted UI

If CLI auth flow issues, use browser:

```
https://share-money-dev.auth.ap-southeast-1.amazoncognito.com/login?response_type=token&client_id=<CLIENT_ID>&redirect_uri=http://localhost:5173&scope=openid+email+profile
```

After login, token appears in redirect URL fragment: `http://localhost:5173/#id_token=...&access_token=...`

## Todo

- [ ] Update cognito.yaml to add ALLOW_USER_PASSWORD_AUTH (if needed)
- [ ] Redeploy stack (if template changed)
- [ ] Create test user via admin-create-user
- [ ] Set permanent password via admin-set-user-password
- [ ] Authenticate via admin-initiate-auth
- [ ] Extract id_token
- [ ] Verify token payload has correct claims

## Success Criteria

- User created with status CONFIRMED
- `admin-initiate-auth` returns AuthenticationResult with IdToken
- Token payload contains `sub`, `email`, `aud` matching CLIENT_ID
- Token `iss` matches `COGNITO_ISSUER` in .env

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| USER_PASSWORD_AUTH not enabled | Auth fails | Add to ExplicitAuthFlows and redeploy |
| ADMIN_USER_PASSWORD_AUTH requires ALLOW_ADMIN_USER_PASSWORD_AUTH | Auth fails | May need to add this flow too; or use initiate-auth (non-admin) |
| Token aud mismatch | API rejects token | Verify CLIENT_ID matches in .env and token |

## Security Considerations

- Test user uses simple password -- acceptable for dev only
- `--message-action SUPPRESS` skips email verification (dev convenience)
- Tokens logged to terminal -- clear history after testing
- Never commit tokens to git

## Next Steps

Proceed to Phase 03: Test authenticated API calls.
