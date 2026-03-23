# Share Money API

REST API for managing shared expenses during trips. Built with NestJS, AWS DynamoDB, Cognito, and deployed as serverless Lambda.

**Production**: `https://ovb0x2eura.execute-api.ap-southeast-1.amazonaws.com`

## Features

- **Authentication**: AWS Cognito JWT (RS256)
- **Trip Management**: Create and manage expense-sharing trips
- **Expense Tracking**: CRUD expenses with payer validation
- **Participant Management**: Add/remove trip participants
- **Settlement**: Greedy algorithm calculates optimal debt settlement
- **Secure Deletions**: Admin password required for delete operations
- **API Docs**: Swagger UI at `/docs` (dev only)

## Tech Stack

- **Runtime**: NestJS 11 / TypeScript 5 / Node.js 22
- **Database**: AWS DynamoDB
- **Auth**: AWS Cognito (JWKS RS256)
- **Deployment**: AWS Lambda + API Gateway (HTTP API)
- **Infra**: CloudFormation (SAM)
- **Build**: Nx Monorepo + Webpack

## Architecture

```
Client -> API Gateway (HTTPS) -> Lambda -> NestJS -> DynamoDB
                                             |
                                          Cognito (JWT validation)
```

```
share-money-api/
├── apps/api/src/
│   ├── auth/           # JWT strategy, guards, Cognito integration
│   ├── database/       # DynamoDB service & repositories
│   ├── trips/          # Trip CRUD
│   ├── expenses/       # Expense CRUD + payer validation
│   ├── participants/   # Participant management
│   ├── settlement/     # Settlement calculation
│   ├── app-factory.ts  # Shared app setup (used by main.ts and lambda.ts)
│   ├── main.ts         # Local dev entry point
│   └── lambda.ts       # AWS Lambda entry point
├── libs/shared/src/
│   ├── dtos/           # Request/response DTOs with validation
│   ├── interfaces/     # TypeScript interfaces
│   └── utils/          # Settlement calculator, ID generator
├── infrastructure/
│   ├── dynamodb-tables.yaml  # DynamoDB tables
│   ├── cognito.yaml          # Cognito User Pool
│   └── api-lambda.yaml       # Lambda + API Gateway
└── scripts/
    └── deploy-api.sh         # Build + deploy to AWS
```

## Quick Start

### Prerequisites

- Node.js >= 22.17.0
- AWS CLI configured (`aws configure`)
- AWS account with DynamoDB, Cognito, Lambda access

### 1. Install

```bash
git clone <repository-url>
cd share-money-api
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` with your values. Key variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_REGION` | AWS region | Yes |
| `DYNAMODB_TRIPS_TABLE` | Trips table name | Yes |
| `DYNAMODB_EXPENSES_TABLE` | Expenses table name | Yes |
| `DYNAMODB_PARTICIPANTS_TABLE` | Participants table name | Yes |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | Yes |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | Yes |
| `COGNITO_ISSUER` | Cognito issuer URL | Yes |
| `ADMIN_PASSWORD` | Password for delete operations | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | Yes |
| `JWT_SECRET` | Local dev only (HS256 fallback) | Dev only |

Note: `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` are not needed — the SDK uses the default credential chain (`aws configure`, IAM roles, etc.).

### 3. Deploy Infrastructure

```bash
# DynamoDB tables
aws cloudformation deploy \
  --template-file infrastructure/dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-dev \
  --parameter-overrides Environment=dev \
  --region ap-southeast-1

# Cognito User Pool
aws cloudformation deploy \
  --template-file infrastructure/cognito.yaml \
  --stack-name share-money-cognito-dev \
  --parameter-overrides Environment=dev \
  --region ap-southeast-1
```

### 4. Run Locally

```bash
npx nx serve api
```

API at `http://localhost:3000`, Swagger at `http://localhost:3000/docs`.

### 5. Deploy to Production

```bash
bash scripts/deploy-api.sh dev
```

This builds the Lambda bundle, uploads to S3, and deploys via CloudFormation. Outputs the API Gateway URL.

## API Endpoints

All endpoints except `GET /` require `Authorization: Bearer <JWT>` header.

### Health Check
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | API status |

### Trips
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/trips` | JWT | Create trip |
| GET | `/trips` | JWT | List user's trips |
| GET | `/trips/:id` | JWT | Get trip |
| PATCH | `/trips/:id` | JWT | Update trip |
| DELETE | `/trips/:id` | JWT | Soft delete trip |

### Expenses
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/trips/:tripId/expenses` | JWT | Create expense |
| GET | `/trips/:tripId/expenses` | JWT | List expenses |
| GET | `/trips/:tripId/expenses/:id` | JWT | Get expense |
| PATCH | `/trips/:tripId/expenses/:id` | JWT | Update expense |
| DELETE | `/trips/:tripId/expenses/:id` | JWT + `X-Admin-Password` | Delete expense |
| DELETE | `/trips/:tripId/expenses` | JWT + `X-Admin-Password` | Delete all expenses |

### Participants
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/trips/:tripId/participants` | JWT | Add participant |
| GET | `/trips/:tripId/participants` | JWT | List participants |
| GET | `/trips/:tripId/participants/names` | JWT | Get names only |
| DELETE | `/trips/:tripId/participants/:name` | JWT | Remove participant |

### Settlement
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/trips/:tripId/settlement` | JWT | Calculate settlement |

## Authentication

Authentication is handled by AWS Cognito. The API validates JWTs — it does not provide login/register endpoints.

### Flow

1. User signs up/logs in via Cognito Hosted UI or AWS SDK
2. Frontend receives JWT `id_token`
3. Frontend sends requests with `Authorization: Bearer <token>`
4. API validates JWT against Cognito JWKS (RS256)

### Testing with CLI

```bash
# Get token
ID_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id <POOL_ID> \
  --client-id <CLIENT_ID> \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=user@example.com,PASSWORD='YourPass123' \
  --region ap-southeast-1 \
  --query 'AuthenticationResult.IdToken' --output text)

# Use token
curl -H "Authorization: Bearer $ID_TOKEN" https://your-api-url/trips
```

## AWS Infrastructure

All infrastructure is defined as CloudFormation templates in `infrastructure/`:

| Stack | Template | Resources |
|-------|----------|-----------|
| `share-money-dynamodb-dev` | `dynamodb-tables.yaml` | 3 DynamoDB tables with GSIs |
| `share-money-cognito-dev` | `cognito.yaml` | User Pool, App Client, Hosted UI domain |
| `share-money-api-dev` | `api-lambda.yaml` | Lambda function, HTTP API Gateway, IAM role |

Region: `ap-southeast-1`

## Development

```bash
# Local dev server (hot reload)
npx nx serve api

# Build
npx nx build api

# Build Lambda bundle
npx nx build-lambda api

# Lint
npx nx lint api
```

## Settlement Algorithm

Greedy algorithm to minimize transactions:

1. Calculate each member's balance (paid - share)
2. Separate into debtors (negative) and creditors (positive)
3. Sort both by amount descending
4. Match largest debtor with largest creditor
5. Repeat until settled

Produces at most N-1 transactions for N participants. Amounts rounded to integers (VND currency).

## Security

- Global JWT auth guard (all routes except `GET /`)
- Row-level security: users only see their own trips
- Admin password for delete operations (timing-safe comparison)
- Input validation via class-validator with whitelist mode
- Helmet security headers
- CORS with configurable origins
- IAM least-privilege for Lambda execution role

## License

MIT
