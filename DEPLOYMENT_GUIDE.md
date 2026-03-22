# Share Money API - AWS Deployment Guide

This guide will walk you through setting up AWS services and deploying your Share Money API.

## Table of Contents

1. [AWS Account Setup](#1-aws-account-setup)
2. [Create DynamoDB Tables](#2-create-dynamodb-tables)
3. [Set Up AWS Cognito](#3-set-up-aws-cognito)
4. [Configure IAM User](#4-configure-iam-user)
5. [Local Development Setup](#5-local-development-setup)
6. [Deploy to AWS (EC2)](#6-deploy-to-aws-ec2)
7. [Deploy to AWS Lambda (Serverless)](#7-deploy-to-aws-lambda-serverless)
8. [Testing the API](#8-testing-the-api)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. AWS Account Setup

### Prerequisites
- AWS Account (sign up at https://aws.amazon.com)
- AWS CLI installed on your machine
- Credit card for AWS billing (free tier available)

### Install AWS CLI

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download from: https://aws.amazon.com/cli/

### Verify Installation
```bash
aws --version
```

---

## 2. Create DynamoDB Tables

### Step 1: Navigate to Infrastructure Directory
```bash
cd /Users/lucas/Documents/Personal/share-money-api/infrastructure
```

### Step 2: Deploy CloudFormation Stack

**For Development Environment:**
```bash
aws cloudformation deploy \
  --template-file dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-dev \
  --parameter-overrides Environment=dev \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_IAM
```

**For Production Environment:**
```bash
aws cloudformation deploy \
  --template-file dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-prod \
  --parameter-overrides Environment=prod \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_IAM
```

### Step 3: Verify Tables Created
```bash
aws dynamodb list-tables --region ap-southeast-1
```

You should see:
- `share-money-trips-dev`
- `share-money-expenses-dev`
- `share-money-participants-dev`

### Step 4: Get Table Details
```bash
aws cloudformation describe-stacks \
  --stack-name share-money-dynamodb-dev \
  --region ap-southeast-1 \
  --query 'Stacks[0].Outputs'
```

---

## 3. Set Up AWS Cognito

### Step 1: Create User Pool

**Via AWS Console:**

1. Go to **AWS Console** → **Cognito** → **User Pools**
2. Click **Create user pool**

#### Step 1.1: Configure sign-in experience
- **Cognito user pool sign-in options**:
  - ✅ Email
  - ✅ Username (optional)
- Click **Next**

#### Step 1.2: Configure security requirements
- **Password policy**:
  - Select **Cognito defaults** or customize
- **Multi-factor authentication**:
  - Select **No MFA** (for development)
  - Or **Optional MFA** for production
- Click **Next**

#### Step 1.3: Configure sign-up experience
- **Self-registration**: ✅ Enable
- **Attribute verification**: Email
- **Required attributes**:
  - ✅ email
- Click **Next**

#### Step 1.4: Configure message delivery
- **Email provider**:
  - Select **Send email with Cognito** (for testing)
  - Or configure **SES** for production
- Click **Next**

#### Step 1.5: Integrate your app
- **User pool name**: `share-money-users-dev`
- **App type**: **Public client**
- **App client name**: `share-money-web-client`
- **Authentication flows**:
  - ✅ ALLOW_USER_PASSWORD_AUTH
  - ✅ ALLOW_REFRESH_TOKEN_AUTH
- Click **Next**

#### Step 1.6: Review and create
- Review all settings
- Click **Create user pool**

### Step 2: Get Cognito Configuration

After creating the user pool:

1. **User Pool ID**: Copy from the overview page
   - Example: `ap-southeast-1_ABC123XYZ`

2. **App Client ID**:
   - Go to **App integration** tab
   - Click on your app client
   - Copy **Client ID**
   - Example: `1234567890abcdefghijklmnop`

3. **Region**: Your AWS region
   - Example: `ap-southeast-1`

4. **Issuer URL**:
   - Format: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}`
   - Example: `https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_ABC123XYZ`

### Step 3: Test User Creation

**Create a test user via AWS CLI:**
```bash
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-1_YOUR_POOL_ID \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \
  --temporary-password TempPassword123! \
  --region ap-southeast-1
```

**Or via Console:**
1. Go to your User Pool → **Users** tab
2. Click **Create user**
3. Enter email and temporary password
4. Click **Create user**

---

## 4. Configure IAM User

### Step 1: Create IAM User for API Access

**Via AWS Console:**

1. Go to **IAM** → **Users** → **Create user**
2. **User name**: `share-money-api-user`
3. **Access type**: ✅ Programmatic access
4. Click **Next**

### Step 2: Attach Policies

Create a custom policy or attach existing ones:

**Recommended Policies:**
- `AmazonDynamoDBFullAccess` (for development)
- `AmazonS3FullAccess` (if using S3)
- `AmazonCognitoPowerUser` (for user management)

**Custom Policy (Least Privilege):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-southeast-1:*:table/share-money-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::share-money-receipts-dev/*"
      ]
    }
  ]
}
```

### Step 3: Download Credentials

1. After user creation, **download the CSV** with:
   - Access Key ID
   - Secret Access Key
2. **Keep these secure!** Never commit to git.

### Step 4: Configure AWS CLI

```bash
aws configure
```

Enter:
- **AWS Access Key ID**: (from CSV)
- **AWS Secret Access Key**: (from CSV)
- **Default region**: `ap-southeast-1`
- **Default output format**: `json`

---

## 5. Local Development Setup

### Step 1: Update .env File

```bash
cd /Users/lucas/Documents/Personal/share-money-api
cp .env.example .env
```

Edit `.env`:

```env
# Application Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE

# DynamoDB Table Names
DYNAMODB_TRIPS_TABLE=share-money-trips-dev
DYNAMODB_EXPENSES_TABLE=share-money-expenses-dev
DYNAMODB_PARTICIPANTS_TABLE=share-money-participants-dev

# AWS Cognito Configuration
COGNITO_USER_POOL_ID=ap-southeast-1_ABC123XYZ
COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
COGNITO_REGION=ap-southeast-1
COGNITO_ISSUER=https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_ABC123XYZ

# S3 Configuration (Optional)
S3_BUCKET_NAME=share-money-receipts-dev
S3_REGION=ap-southeast-1

# Application Security
ADMIN_PASSWORD=ok
JWT_SECRET=dev_secret_change_in_production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Step 2: Test Local Connection

```bash
npm start
```

You should see:
```
⚠️  Cognito configured successfully
🚀 Application is running on: http://localhost:3000
📚 API Documentation available at: http://localhost:3000/docs
```

### Step 3: Test DynamoDB Connection

Create a test trip:
```bash
# First, get a JWT token (see Testing section)
# Then:
curl -X POST http://localhost:3000/api/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tripName": "Test Trip"}'
```

---

## 6. Deploy to AWS (EC2)

### Option A: EC2 Instance

#### Step 1: Create EC2 Instance

1. Go to **EC2** → **Launch Instance**
2. **Name**: `share-money-api`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance type**: `t3.micro` (free tier eligible)
5. **Key pair**: Create new or use existing
6. **Network settings**:
   - ✅ Allow SSH (port 22)
   - ✅ Allow HTTP (port 80)
   - ✅ Allow HTTPS (port 443)
   - ✅ Custom TCP (port 3000) - for API
7. Click **Launch instance**

#### Step 2: Connect to Instance

```bash
# Download your .pem key file
chmod 400 your-key.pem

# Connect
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

#### Step 3: Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be >= 22.17.0
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 4: Deploy Application

```bash
# Clone your repository (or upload files)
git clone <your-repo-url>
cd share-money-api

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your production environment variables

# Build the application
npm run build

# Start with PM2
pm2 start dist/apps/api/main.js --name share-money-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Step 5: Set Up Nginx (Optional - Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/share-money-api
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or use EC2 public IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/share-money-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: Set Up SSL with Let's Encrypt (Optional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 7. Deploy to AWS Lambda (Serverless)

### Coming Soon
For serverless deployment, you'll need to:
1. Install Serverless Framework
2. Configure `serverless.yml`
3. Deploy using `serverless deploy`

This requires additional setup and will be documented separately.

---

## 8. Testing the API

### Step 1: Get JWT Token from Cognito

**Using AWS CLI:**
```bash
# Initiate auth
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=testuser@example.com,PASSWORD=YourPassword123! \
  --region ap-southeast-1
```

Copy the `IdToken` from the response.

**Or use Postman/Thunder Client:**

1. **URL**: `https://cognito-idp.ap-southeast-1.amazonaws.com/`
2. **Method**: POST
3. **Headers**:
   - `X-Amz-Target`: `AWSCognitoIdentityProviderService.InitiateAuth`
   - `Content-Type`: `application/x-amz-json-1.1`
4. **Body**:
```json
{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "YOUR_CLIENT_ID",
  "AuthParameters": {
    "USERNAME": "testuser@example.com",
    "PASSWORD": "YourPassword123!"
  }
}
```

### Step 2: Test API Endpoints

**Create a Trip:**
```bash
curl -X POST http://your-api-url/api/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tripName": "Tokyo Trip 2026"}'
```

**Get All Trips:**
```bash
curl -X GET http://your-api-url/api/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Add Expense:**
```bash
curl -X POST http://your-api-url/api/trips/TRIP_ID/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "John",
    "title": "Hotel",
    "amount": 1500000,
    "date": "2026-01-10"
  }'
```

**Calculate Settlement:**
```bash
curl -X GET http://your-api-url/api/trips/TRIP_ID/settlement \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3: Use Swagger UI

Visit: `http://your-api-url/docs`

1. Click **Authorize** 🔓
2. Enter: `Bearer YOUR_JWT_TOKEN`
3. Click **Authorize**
4. Test endpoints directly from the UI

---

## 9. Troubleshooting

### Issue: "Cannot GET /docs"
**Solution**:
- Restart the server
- Check that Swagger is accessible at `/docs` not `/api/docs`
- Ensure `main.ts` has Swagger setup before `setGlobalPrefix()`

### Issue: "COGNITO_USER_POOL_ID must be configured"
**Solution**:
- Check `.env` file has correct Cognito values
- Restart server after updating `.env`

### Issue: "Access Denied" from DynamoDB
**Solution**:
- Verify IAM user has DynamoDB permissions
- Check table names match in `.env`
- Verify AWS credentials are correct: `aws sts get-caller-identity`

### Issue: Authentication fails
**Solution**:
- Verify JWT token is valid (check expiration)
- Ensure `COGNITO_ISSUER` URL is correct
- Check user exists in Cognito User Pool

### Issue: CORS errors
**Solution**:
- Add your frontend URL to `CORS_ORIGIN` in `.env`
- Restart the API server

### Check AWS CLI Configuration
```bash
aws configure list
aws sts get-caller-identity
```

### Check DynamoDB Tables
```bash
aws dynamodb list-tables --region ap-southeast-1
aws dynamodb describe-table --table-name share-money-trips-dev --region ap-southeast-1
```

### View API Logs (EC2)
```bash
pm2 logs share-money-api
pm2 status
```

---

## Cost Estimation

**Free Tier (First 12 months):**
- EC2 t3.micro: 750 hours/month
- DynamoDB: 25GB storage, 25 WCU, 25 RCU
- Cognito: 50,000 MAUs
- S3: 5GB storage, 20,000 GET requests

**After Free Tier (Estimate for 100 users):**
- EC2 t3.micro: ~$8/month
- DynamoDB On-Demand: ~$1-5/month
- Cognito: Free for <50K MAUs
- S3: ~$1/month
- **Total**: ~$10-15/month

---

## Security Checklist

Before going to production:

- [ ] Change `ADMIN_PASSWORD` from "ok" to a strong password
- [ ] Use environment-specific JWT secrets
- [ ] Enable MFA on Cognito for production
- [ ] Set up CloudWatch logging
- [ ] Enable DynamoDB point-in-time recovery
- [ ] Set up AWS Backup for DynamoDB
- [ ] Use HTTPS only (SSL certificate)
- [ ] Restrict IAM permissions (least privilege)
- [ ] Enable API rate limiting
- [ ] Set up monitoring and alerts
- [ ] Keep dependencies updated

---

## Next Steps

1. ✅ Complete AWS setup (Cognito + DynamoDB)
2. ✅ Test locally with real AWS services
3. ✅ Deploy to EC2
4. 🔄 Update frontend to use new API endpoints
5. 🔄 Set up CI/CD pipeline (GitHub Actions)
6. 🔄 Add monitoring and logging
7. 🔄 Implement caching (Redis/ElastiCache)

---

## Support

- **AWS Documentation**: https://docs.aws.amazon.com
- **NestJS Documentation**: https://docs.nestjs.com
- **DynamoDB Best Practices**: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html

Need help? Open an issue in the GitHub repository.
