# Share Money API

A NestJS API built with NX monorepo structure.

## Project Structure

```
share-money-api/
├── apps/
│   └── api/                 # Main API application
│       ├── src/
│       │   ├── app/        # Application modules
│       │   ├── assets/     # Static assets
│       │   └── main.ts     # Application entry point
│       └── .env.template   # Environment variables template
├── libs/
│   └── shared/             # Shared library
│       └── src/
└── ...config files
```

## Getting Started

### Prerequisites

- Node.js >= 22.17.0
- npm

### Installation

```bash
npm install
```

### Configuration

1. Copy the environment template:
```bash
cp apps/api/.env.template apps/api/.env
```

2. Update the `.env` file with your configuration

### Running the Application

```bash
# Development mode
npm start

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

### API Documentation

Once the application is running, you can access the Swagger documentation at:
```
http://localhost:3000/docs
```

## Available Scripts

- `npm start` - Start the API in development mode
- `npm run build` - Build the API for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Technology Stack

- **NestJS** - Progressive Node.js framework
- **NX** - Smart monorepo build system
- **TypeScript** - Typed JavaScript
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## License

MIT
