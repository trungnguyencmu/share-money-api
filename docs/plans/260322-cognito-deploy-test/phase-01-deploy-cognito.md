---
phase: "01"
title: Deploy Cognito via CloudFormation
status: pending
---

# Phase 01: Deploy Cognito via CloudFormation

## Context

- Template: `infrastructure/cognito.yaml`
- Docs: `infrastructure/README.md`
- Region: `ap-southeast-1`
- Stack name: `share-money-cognito-dev`

## Overview

Deploy Cognito User Pool, User Pool Client, and hosted UI domain. Extract stack outputs and populate `.env` with real values.

## Key Insights

- Template creates: UserPool, UserPoolClient (no secret, SRP auth), UserPoolDomain
- Token validity: access/id = 1hr, refresh = 30 days
- OAuth flows: implicit only (for hosted UI); SRP for programmatic auth
- `GenerateSecret: false` means we can use `InitiateAuth` directly from CLI
- Domain is globally unique in Cognito -- `share-money-dev` might collide

## Requirements

- AWS CLI configured with valid credentials for `ap-southeast-1`
- IAM permissions: `cognito-idp:*`, `cloudformation:*`

## Architecture

```
CloudFormation Stack
  -> UserPool (email-based, auto-verify email)
  -> UserPoolClient (SRP auth, implicit OAuth)
  -> UserPoolDomain (share-money-dev.auth.ap-southeast-1.amazoncognito.com)
```

## Related Code

- `apps/api/src/auth/jwt.strategy.ts` - consumes COGNITO_USER_POOL_ID, COGNITO_REGION, COGNITO_CLIENT_ID
- `.env.example` - template for env vars

## Implementation Steps

### Step 1: Deploy stack

```bash
cd infrastructure

aws cloudformation deploy \
  --template-file cognito.yaml \
  --stack-name share-money-cognito-dev \
  --parameter-overrides Environment=dev CallbackUrl=http://localhost:5173 \
  --region ap-southeast-1
```

If domain conflict error occurs, update `cognito.yaml` Domain property to a unique value (e.g., `share-money-dev-<your-initials>`) and redeploy.

### Step 2: Extract outputs

```bash
aws cloudformation describe-stacks \
  --stack-name share-money-cognito-dev \
  --region ap-southeast-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Step 3: Update .env

Map outputs:
- `UserPoolId` -> `COGNITO_USER_POOL_ID`
- `UserPoolClientId` -> `COGNITO_CLIENT_ID`
- `CognitoIssuer` -> `COGNITO_ISSUER`
- `COGNITO_REGION` = `ap-southeast-1` (already set)

One-liner to extract and set:

```bash
# Get values
POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name share-money-cognito-dev \
  --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name share-money-cognito-dev \
  --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text)

ISSUER=$(aws cloudformation describe-stacks \
  --stack-name share-money-cognito-dev \
  --region ap-southeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoIssuer`].OutputValue' \
  --output text)

echo "COGNITO_USER_POOL_ID=$POOL_ID"
echo "COGNITO_CLIENT_ID=$CLIENT_ID"
echo "COGNITO_ISSUER=$ISSUER"
```

Paste these values into `.env`.

### Step 4: Verify JWKS endpoint reachable

```bash
curl -s "https://cognito-idp.ap-southeast-1.amazonaws.com/$POOL_ID/.well-known/jwks.json" | head -c 200
```

Should return JSON with `keys` array.

## Todo

- [ ] Deploy CloudFormation stack
- [ ] Handle domain conflict if occurs
- [ ] Extract stack outputs
- [ ] Update .env with real Cognito values
- [ ] Verify JWKS endpoint reachable

## Success Criteria

- Stack status: `CREATE_COMPLETE` or `UPDATE_COMPLETE`
- All 5 outputs present (UserPoolId, UserPoolArn, UserPoolClientId, UserPoolDomainUrl, CognitoIssuer)
- `.env` updated with real values
- JWKS endpoint returns valid JSON

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Domain `share-money-dev` taken | Deploy fails | Change domain prefix in template |
| IAM insufficient permissions | Deploy fails | Need cognito-idp:* and cloudformation:* |
| Stack rollback on error | Lose partial resources | DeletionPolicy: Retain on UserPool protects data |

## Security Considerations

- UserPool has DeletionPolicy: Retain -- won't be deleted on stack delete
- No client secret generated (public client for SPA use case)
- PreventUserExistenceErrors: ENABLED -- no user enumeration
- Password policy: 8+ chars, upper+lower+numbers, no symbols required

## Next Steps

Proceed to Phase 02: Create test user and obtain JWT token.
