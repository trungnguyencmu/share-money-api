# AWS Quick Start Guide - Share Money API

## 🚀 Fast Track to Deployment (30 minutes)

### Prerequisites
- ✅ AWS Account
- ✅ AWS CLI installed (`brew install awscli`)
- ✅ Node.js 22+ installed

---

## Step 1: Configure AWS CLI (5 min)

```bash
# Install AWS CLI
brew install awscli  # macOS
# or download from: https://aws.amazon.com/cli/

# Configure credentials
aws configure
# Enter:
#   - AWS Access Key ID
#   - AWS Secret Access Key
#   - Default region: ap-southeast-1
#   - Default output: json
```

---

## Step 2: Deploy DynamoDB Tables (5 min)

### Automated Setup (Recommended)
```bash
cd /Users/lucas/Documents/Personal/share-money-api
./scripts/aws-setup.sh
```

### Manual Setup
```bash
cd infrastructure
aws cloudformation deploy \
  --template-file dynamodb-tables.yaml \
  --stack-name share-money-dynamodb-dev \
  --parameter-overrides Environment=dev \
  --region ap-southeast-1
```

**Verify:**
```bash
aws dynamodb list-tables --region ap-southeast-1
```

---

## Step 3: Create Cognito User Pool (10 min)

### Via AWS Console

1. **Go to**: https://console.aws.amazon.com/cognito
2. **Click**: "Create user pool"
3. **Sign-in options**: Email ✅
4. **Password policy**: Cognito defaults
5. **MFA**: No MFA (for dev)
6. **User pool name**: `share-money-users-dev`
7. **App client name**: `share-money-web-client`
8. **Auth flows**:
   - ✅ ALLOW_USER_PASSWORD_AUTH
   - ✅ ALLOW_REFRESH_TOKEN_AUTH
9. **Click**: "Create user pool"

### Save These Values:
- **User Pool ID**: `ap-southeast-1_XXXXXXXXX`
- **App Client ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Region**: `ap-southeast-1`

---

## Step 4: Create Test User (2 min)

```bash
# Replace with your values
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-1_YOUR_POOL_ID \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password Test1234! \
  --region ap-southeast-1
```

---

## Step 5: Update .env File (3 min)

```bash
cd /Users/lucas/Documents/Personal/share-money-api
nano .env
```

**Update these values:**
```env
# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

# DynamoDB Tables
DYNAMODB_TRIPS_TABLE=share-money-trips-dev
DYNAMODB_EXPENSES_TABLE=share-money-expenses-dev
DYNAMODB_PARTICIPANTS_TABLE=share-money-participants-dev

# Cognito
COGNITO_USER_POOL_ID=ap-southeast-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=ap-southeast-1
COGNITO_ISSUER=https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_XXXXXXXXX
```

---

## Step 6: Start the API (2 min)

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm start
```

**Expected output:**
```
✅ Cognito configured successfully
🚀 Application is running on: http://localhost:3000
📚 API Documentation available at: http://localhost:3000/docs
```

---

## Step 7: Test the API (3 min)

### Get JWT Token

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=test@example.com,PASSWORD=Test1234! \
  --region ap-southeast-1
```

Copy the `IdToken` from response.

### Test Endpoints

**Visit Swagger UI:**
```
http://localhost:3000/docs
```

1. Click "Authorize" 🔓
2. Enter: `Bearer YOUR_ID_TOKEN`
3. Test endpoints!

**Or use curl:**
```bash
# Create a trip
curl -X POST http://localhost:3000/api/trips \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tripName": "Test Trip"}'

# Get all trips
curl http://localhost:3000/api/trips \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎉 You're Done!

Your API is now running with:
- ✅ AWS Cognito authentication
- ✅ DynamoDB database
- ✅ Swagger documentation
- ✅ Full REST API endpoints

---

## Common Issues & Solutions

### ❌ "COGNITO_USER_POOL_ID must be configured"
**Fix**: Update `.env` and restart server

### ❌ "Access Denied" from DynamoDB
**Fix**: Check IAM permissions
```bash
aws sts get-caller-identity
```

### ❌ "Invalid token"
**Fix**: Get a new JWT token (they expire after 1 hour)

### ❌ "Cannot GET /docs"
**Fix**:
1. Restart server
2. Try: http://localhost:3000/docs (not /api/docs)

---

## Next Steps

### 1. Deploy to Production
See full guide: `DEPLOYMENT_GUIDE.md`

### 2. Update Frontend
Point your React app to: `http://localhost:3000/api`

### 3. Set Up CI/CD
- GitHub Actions
- AWS CodePipeline
- Docker deployment

---

## Costs

**Free Tier (First year):**
- EC2: 750 hours/month
- DynamoDB: 25GB, 25 WCU, 25 RCU
- Cognito: 50,000 users
- **Total**: FREE ✨

**After Free Tier:**
- ~$10-15/month for 100 users

---

## Important Links

- **AWS Console**: https://console.aws.amazon.com
- **Cognito Console**: https://console.aws.amazon.com/cognito
- **DynamoDB Console**: https://console.aws.amazon.com/dynamodb
- **Full Deployment Guide**: DEPLOYMENT_GUIDE.md

---

## Support

Need help? Check:
1. `DEPLOYMENT_GUIDE.md` - Detailed setup guide
2. `README.md` - API documentation
3. GitHub Issues - Report problems

Happy coding! 🚀
