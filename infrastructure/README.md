# Infrastructure Setup

This directory contains Infrastructure as Code (IaC) templates for the Share Money API.

## Cognito User Pool

### Deploy Cognito

```bash
# For development environment
aws cloudformation deploy \
  --template-file cognito.yaml \
  --stack-name share-money-cognito-dev \
  --parameter-overrides Environment=dev CallbackUrl=http://localhost:5173 \
  --region ap-southeast-1

# For production environment
aws cloudformation deploy \
  --template-file cognito.yaml \
  --stack-name share-money-cognito-prod \
  --parameter-overrides Environment=prod CallbackUrl=https://your-frontend-domain.com \
  --region ap-southeast-1
```

After deployment, copy the outputs into your `.env`:

```bash
aws cloudformation describe-stacks \
  --stack-name share-money-cognito-dev \
  --region ap-southeast-1 \
  --query 'Stacks[0].Outputs'
```

Map outputs to env vars: `UserPoolId` → `COGNITO_USER_POOL_ID`, `UserPoolClientId` → `COGNITO_CLIENT_ID`, `CognitoIssuer` → `COGNITO_ISSUER`.

## DynamoDB Tables

### Deploy Tables

To deploy the DynamoDB tables to AWS:

```bash
# For development environment
aws cloudformation deploy \
  --template-file dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-dev \
  --parameter-overrides Environment=dev \
  --region ap-southeast-1

# For production environment
aws cloudformation deploy \
  --template-file dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-prod \
  --parameter-overrides Environment=prod \
  --region ap-southeast-1
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name share-money-dynamodb-dev \
  --region ap-southeast-1
```

### View Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name share-money-dynamodb-dev \
  --region ap-southeast-1 \
  --query 'Stacks[0].Outputs'
```

## Table Structure

### Trips Table
- **Primary Key**: `tripId` (String)
- **GSI**: `UserId-CreatedAt-Index` - Query all trips for a user sorted by creation date
- **Attributes**: tripId, userId, tripName, createdAt, isActive

### Expenses Table
- **Primary Key**: `tripId` (String) + `expenseId` (String)
- **GSI**: `TripId-CreatedAt-Index` - Query expenses by trip sorted by creation date
- **Attributes**: tripId, expenseId, payer, title, amount, date, createdAt

### Participants Table
- **Primary Key**: `tripId` (String) + `participantName` (String)
- **Attributes**: tripId, participantName, addedAt

## Billing

All tables use **PAY_PER_REQUEST** (On-Demand) billing mode, which means:
- No capacity planning required
- Pay only for actual read/write requests
- Automatically scales with traffic
- Ideal for unpredictable workloads

## Features Enabled

- **Point-in-Time Recovery**: Enabled for all tables (can restore to any point in last 35 days)
- **DynamoDB Streams**: Enabled with NEW_AND_OLD_IMAGES view type (useful for auditing and event-driven architectures)
- **Tags**: All resources tagged with Application and Environment

## Cost Estimation

For low to moderate usage:
- Reads: $0.25 per million requests
- Writes: $1.25 per million requests
- Storage: $0.25 per GB-month

Example monthly cost for 100 users:
- ~10,000 reads/day = 300k/month = $0.075
- ~1,000 writes/day = 30k/month = $0.0375
- 1 GB storage = $0.25
- **Total**: ~$0.36/month
