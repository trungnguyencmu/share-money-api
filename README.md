# Share Money API

A robust REST API for managing shared expenses during trips, built with NestJS, AWS DynamoDB, and Cognito authentication.

## Features

- **User Authentication**: AWS Cognito JWT-based authentication
- **Trip Management**: Create and manage multiple expense-sharing trips
- **Expense Tracking**: Add, update, and delete expenses with detailed information
- **Participant Management**: Manage trip participants for accurate settlement calculations
- **Automatic Settlement**: Calculate optimal transactions to settle debts using a greedy algorithm
- **Secure Operations**: Password-protected deletion operations
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: AWS DynamoDB
- **Authentication**: AWS Cognito
- **Storage**: AWS S3 (optional, for future features)
- **Documentation**: Swagger/OpenAPI
- **Build System**: NX Monorepo
- **Testing**: Jest

## Architecture

```
share-money-api/
├── apps/
│   └── api/                    # Main NestJS application
│       ├── src/
│       │   ├── auth/          # Authentication (Cognito JWT)
│       │   ├── database/      # DynamoDB service & repositories
│       │   ├── trips/         # Trip management endpoints
│       │   ├── expenses/      # Expense CRUD operations
│       │   ├── participants/  # Participant management
│       │   └── settlement/    # Settlement calculation
│       └── ...
├── libs/
│   └── shared/                # Shared DTOs, interfaces, utilities
│       ├── dtos/             # Data Transfer Objects
│       ├── interfaces/       # TypeScript interfaces
│       └── utils/            # Utility functions (calculations, ID generation)
└── infrastructure/           # CloudFormation templates
    └── dynamodb-tables.yaml # DynamoDB table definitions
```

## Database Schema

### Tables

#### 1. Trips Table
- **Primary Key**: `tripId`
- **GSI**: `UserId-CreatedAt-Index` (for querying trips by user)
- **Attributes**: tripId, userId, tripName, createdAt, isActive

#### 2. Expenses Table
- **Primary Key**: `tripId` (PK) + `expenseId` (SK)
- **GSI**: `TripId-CreatedAt-Index` (for sorting by date)
- **Attributes**: tripId, expenseId, payer, title, amount, date, createdAt

#### 3. Participants Table
- **Primary Key**: `tripId` (PK) + `participantName` (SK)
- **Attributes**: tripId, participantName, addedAt

## Setup Instructions

### Quick Start

**New to AWS?** Follow our step-by-step guides:
- 📖 **[AWS Quick Start Guide](AWS_QUICK_START.md)** - Get running in 30 minutes
- 📚 **[Full Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete AWS setup and deployment

### Prerequisites

- Node.js >= 22.17.0
- npm >= 8.0.0
- AWS Account with:
  - DynamoDB access
  - Cognito User Pool configured
  - (Optional) S3 bucket for receipts

### 1. Clone the Repository

```bash
git clone <repository-url>
cd share-money-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your AWS credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Application
NODE_ENV=development
PORT=3000

# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB Tables
DYNAMODB_TRIPS_TABLE=share-money-trips-dev
DYNAMODB_EXPENSES_TABLE=share-money-expenses-dev
DYNAMODB_PARTICIPANTS_TABLE=share-money-participants-dev

# AWS Cognito
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
COGNITO_REGION=ap-southeast-1
COGNITO_ISSUER=https://cognito-idp.ap-southeast-1.amazonaws.com/your_user_pool_id

# Security
ADMIN_PASSWORD=ok

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Deploy DynamoDB Tables

```bash
cd infrastructure
aws cloudformation deploy \
  --template-file dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-dev \
  --parameter-overrides Environment=dev \
  --region ap-southeast-1
```

### 5. Run the Application

#### Development Mode
```bash
npm run serve
```

#### Production Build
```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /` - API status (public endpoint)

### Trips
- `POST /trips` - Create a new trip
- `GET /trips` - Get all trips for current user
- `GET /trips/:id` - Get trip by ID
- `PATCH /trips/:id` - Update trip
- `DELETE /trips/:id` - Delete trip (soft delete)

### Expenses
- `POST /trips/:tripId/expenses` - Create expense
- `GET /trips/:tripId/expenses` - Get all expenses for a trip
- `GET /trips/:tripId/expenses/:id` - Get expense by ID
- `PATCH /trips/:tripId/expenses/:id` - Update expense
- `DELETE /trips/:tripId/expenses/:id` - Delete expense (requires password)
- `DELETE /trips/:tripId/expenses` - Delete all expenses (requires password)

### Participants
- `POST /trips/:tripId/participants` - Add participant
- `GET /trips/:tripId/participants` - Get all participants
- `GET /trips/:tripId/participants/names` - Get participant names (for dropdowns)
- `DELETE /trips/:tripId/participants/:name` - Remove participant

### Settlement
- `GET /trips/:tripId/settlement` - Calculate settlement (balances + transactions)

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs-json`

## Authentication

All endpoints (except `GET /`) require JWT authentication via AWS Cognito.

### Getting a JWT Token

1. Sign up/sign in through your Cognito User Pool
2. Obtain the JWT `id_token`
3. Include in requests:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/trips
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Development

### Build the API
```bash
npm run build
```

### Lint the code
```bash
npm run lint
```

### Format code
```bash
npx prettier --write .
```

## Project Structure

### Shared Library (`libs/shared`)
Contains reusable code:
- **DTOs**: Validation and API contracts
- **Interfaces**: TypeScript type definitions
- **Utils**: Settlement calculations, ID generation

### API Application (`apps/api`)
NestJS modules following Clean Architecture:
- **Auth Module**: JWT strategy and guards
- **Database Module**: DynamoDB service and repositories
- **Feature Modules**: Trips, Expenses, Participants, Settlement

## Settlement Algorithm

The settlement calculation uses a **greedy algorithm** to minimize transactions:

1. Calculate each member's balance (paid - share)
2. Separate members into debtors (negative balance) and creditors (positive balance)
3. Sort both groups by amount (descending)
4. Match largest debtor with largest creditor
5. Repeat until all debts settled

This approach typically produces N-1 transactions for N participants.

## Security Features

- **JWT Authentication**: All routes protected except health check
- **Row-Level Security**: Users can only access their own trips
- **Password Protection**: Deletion operations require password
- **Input Validation**: All DTOs validated with class-validator
- **CORS**: Configurable allowed origins

## Deployment

### AWS Lambda (Serverless)
The API can be deployed to AWS Lambda using the Serverless framework (configuration needed).

### Docker
```bash
docker build -t share-money-api .
docker run -p 3000:3000 --env-file .env share-money-api
```

### Traditional Server
Deploy the built application to any Node.js hosting provider.

## Migration from Google Sheets

To migrate existing data:
1. Export Google Sheets data to JSON
2. Use the API to create trips and expenses
3. Update your frontend to use the new API endpoints

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Environment (development/production) | Yes |
| PORT | Server port | Yes |
| AWS_REGION | AWS region | Yes |
| AWS_ACCESS_KEY_ID | AWS access key | Yes |
| AWS_SECRET_ACCESS_KEY | AWS secret key | Yes |
| DYNAMODB_TRIPS_TABLE | Trips table name | Yes |
| DYNAMODB_EXPENSES_TABLE | Expenses table name | Yes |
| DYNAMODB_PARTICIPANTS_TABLE | Participants table name | Yes |
| COGNITO_USER_POOL_ID | Cognito user pool ID | Yes |
| COGNITO_CLIENT_ID | Cognito client ID | Yes |
| ADMIN_PASSWORD | Password for deletions | Yes |
| CORS_ORIGIN | Allowed CORS origins | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.
