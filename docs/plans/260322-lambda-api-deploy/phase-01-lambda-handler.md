---
phase: "01"
title: Create Lambda Handler
status: pending
---

# Phase 01: Create Lambda Handler

## Context

- Parent: [plan.md](plan.md)
- NestJS app bootstrap in `apps/api/src/main.ts`
- Build: `npx nx build api` produces `dist/apps/api/main.js`

## Overview

Create `lambda.ts` entry point using `@codegenie/serverless-express` to wrap the NestJS app for Lambda execution. Update webpack config to produce a Lambda-compatible bundle.

## Key Insights

- `@codegenie/serverless-express` converts API Gateway events to Express req/res
- NestJS app must be created once outside handler (reused across warm invocations)
- Must skip `app.listen()` in Lambda -- only in standalone mode
- Swagger already disabled in production (`NODE_ENV=production` check in main.ts)
- webpack already bundles to single file via `@nx/webpack` -- ideal for Lambda
- Project requires Node.js >=22.17.0; use Lambda `nodejs22.x` runtime

## Requirements

- `@codegenie/serverless-express` package
- `lambda.ts` that exports a handler function
- Shared app creation logic between `main.ts` and `lambda.ts`
- Webpack entry point config for Lambda build target

## Related Code

- `apps/api/src/main.ts` - current bootstrap (CORS, helmet, validation pipe, swagger)
- `apps/api/src/app/app.module.ts` - root module (ConfigModule, AuthModule, DatabaseModule, etc.)
- `apps/api/webpack.config.js` - build config (composePlugins with withNx)
- `apps/api/project.json` - Nx build targets (@nx/webpack:webpack executor)

## Implementation Steps

### Step 1: Install dependency

```bash
npm install @codegenie/serverless-express
```

### Step 2: Extract shared app creation

Create `apps/api/src/app-factory.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { useContainer } from 'class-validator';
import { AppModule } from './app/app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';
  const allowedOrigins = configService.get('CORS_ORIGIN')?.split(',').map((o: string) => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:4200',
  ];

  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Admin-Password'],
  });

  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  return { app, configService, isProduction };
}
```

### Step 3: Create Lambda handler

Create `apps/api/src/lambda.ts`:

```typescript
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { createApp } from './app-factory';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const { app } = await createApp();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

### Step 4: Simplify main.ts to use app-factory

Update `apps/api/src/main.ts` to reuse `createApp()` for the shared setup (CORS, helmet, validation pipe), then add swagger and `app.listen()` on top.

### Step 5: Add build-lambda target to project.json

Add a `build-lambda` target to `apps/api/project.json` that uses `lambda.ts` as entry point and outputs `lambda.js`:

```json
"build-lambda": {
  "executor": "@nx/webpack:webpack",
  "outputs": ["{options.outputPath}"],
  "options": {
    "target": "node",
    "compiler": "tsc",
    "main": "apps/api/src/lambda.ts",
    "tsConfig": "apps/api/tsconfig.app.json",
    "outputPath": "dist/apps/api",
    "outputFileName": "lambda.js",
    "assets": [],
    "optimization": true,
    "outputHashing": "none",
    "generatePackageJson": false,
    "webpackConfig": "apps/api/webpack.config.js"
  }
}
```

### Step 6: Test build

```bash
npx nx build-lambda api
ls -la dist/apps/api/lambda.js
```

## Todo

- [ ] Install @codegenie/serverless-express
- [ ] Create apps/api/src/app-factory.ts
- [ ] Create apps/api/src/lambda.ts
- [ ] Update main.ts to use app-factory
- [ ] Add build-lambda target to project.json
- [ ] Test build produces valid bundle

## Success Criteria

- `npx nx build-lambda api` produces `dist/apps/api/lambda.js`
- Bundle includes all dependencies (single file)
- Handler exports correctly
- Existing `npx nx serve api` still works (no regression)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Express adapter mismatch | Lambda handler fails | Use default Express adapter (NestJS default, already in use) |
| Missing deps in bundle | Runtime errors | webpack bundles all node_modules; verify with test invocation |
| aws-lambda types missing | TS compile error | Install @types/aws-lambda as devDependency |

## Next Steps

Phase 02: CloudFormation template for Lambda + API Gateway
