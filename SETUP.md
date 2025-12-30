# Setup Guide: Multi-Environment Deployment

This guide walks you through setting up the multi-environment deployment infrastructure for the ReceiptScan backend from scratch.

## Table of Contents

1. [Firebase Projects Setup](#firebase-projects-setup)
2. [GitHub Repository Configuration](#github-repository-configuration)
3. [Local Development Setup](#local-development-setup)
4. [CI/CD Configuration](#cicd-configuration)
5. [Initial Deployment](#initial-deployment)
6. [Verification](#verification)

## Firebase Projects Setup

### Step 1: Create Firebase Projects

Create three Firebase projects:

1. **Development Project** (`receiptscan-dev`)
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add Project"
   - Name: `receiptscan-dev`
   - Disable Google Analytics (optional for dev)
   - Click "Create Project"

2. **Test Project** (`receiptscan-test`)
   - Repeat the process
   - Name: `receiptscan-test`

3. **Production Project** (`receiptscan-prd`)
   - Repeat the process
   - Name: `receiptscan-prd`
   - Enable Google Analytics (recommended for production)

### Step 2: Enable Required Services

For **each project**, enable the following services:

#### A. Firestore Database

1. In Firebase Console, select the project
2. Go to "Build" > "Firestore Database"
3. Click "Create database"
4. Select "Start in test mode" (we'll deploy proper rules later)
5. Choose location: `us-central1` (or your preferred region)
6. Click "Enable"

#### B. Cloud Storage

1. Go to "Build" > "Storage"
2. Click "Get started"
3. Select "Start in test mode"
4. Use default location or choose your preferred one
5. Click "Done"

#### C. Authentication

1. Go to "Build" > "Authentication"
2. Click "Get started"
3. Enable sign-in methods as needed (e.g., Email/Password, Google)

#### D. Cloud Functions

1. Go to "Build" > "Functions"
2. Click "Get started"
3. Follow upgrade prompts if on Spark plan
4. Upgrade to Blaze (pay-as-you-go) plan if needed

**Note**: Cloud Functions require a billing account. For development, costs are minimal.

### Step 3: Configure Firebase Projects

For each project, set the following configuration:

#### A. Storage Buckets

```bash
# Development
gsutil mb -p receiptscan-dev gs://receiptscan-dev.appspot.com

# Test
gsutil mb -p receiptscan-test gs://receiptscan-test.appspot.com

# Production
gsutil mb -p receiptscan-prd gs://receiptscan-prd.appspot.com
```

Or use the Firebase Console to verify default bucket was created.

#### B. Firestore Indexes

Indexes will be deployed automatically when you deploy the application.

### Step 4: Service Account Keys

Generate service account keys for CI/CD:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Repeat for all three projects

**Keep these files secure - they provide admin access to your Firebase projects!**

## GitHub Repository Configuration

### Step 1: Add GitHub Secrets

Go to your GitHub repository:
- Settings > Secrets and variables > Actions
- Click "New repository secret"

Add the following secrets:

#### Development Secrets

- `FIREBASE_SERVICE_ACCOUNT_DEV`: Paste the entire JSON from dev service account key
- `OPENAI_API_KEY_DEV`: Your OpenAI API key for development
- `STRIPE_API_KEY_DEV`: Your Stripe test API key
- `STRIPE_WEBHOOK_SECRET_DEV`: Your Stripe webhook secret for dev

#### Test Secrets

- `FIREBASE_SERVICE_ACCOUNT_TEST`: Paste the entire JSON from test service account key
- `OPENAI_API_KEY_TEST`: Your OpenAI API key for test
- `STRIPE_API_KEY_TEST`: Your Stripe test API key
- `STRIPE_WEBHOOK_SECRET_TEST`: Your Stripe webhook secret for test

#### Production Secrets

- `FIREBASE_SERVICE_ACCOUNT_PRD`: Paste the entire JSON from prd service account key
- `OPENAI_API_KEY_PRD`: Your OpenAI **production** API key
- `STRIPE_API_KEY_PRD`: Your Stripe **live** API key (sk_live_...)
- `STRIPE_WEBHOOK_SECRET_PRD`: Your Stripe webhook secret for production

### Step 2: Configure GitHub Environments

1. Go to Settings > Environments
2. Create three environments:

#### Development Environment
- Name: `development`
- No protection rules needed
- Add environment secrets (same as above, but scoped to environment)

#### Test Environment
- Name: `test`
- Optional: Add required reviewers if desired
- Add environment secrets

#### Production Environment
- Name: `production`
- ✅ Required reviewers: Add at least 1-2 team members
- ✅ Wait timer: 0 minutes (optional: add delay)
- Add environment secrets

This ensures production deployments require manual approval.

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/guilhermomg/receiptscan-backend.git
cd receiptscan-backend

# Install dependencies
npm install
```

### Step 2: Install Firebase CLI

```bash
# Install globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify access to projects
firebase projects:list
```

You should see all three projects listed.

### Step 3: Configure Local Environment

```bash
# Create local environment file
cp .env.dev .env.local

# Edit with your local API keys
nano .env.local
```

Add your actual API keys to `.env.local`:

```env
OPENAI_API_KEY=sk-...
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important**: `.env.local` is ignored by git. Never commit files with real API keys!

### Step 4: Initialize Firebase

```bash
# This is already done in the repo, but if you need to reinitialize:
firebase init

# Select:
# - Functions
# - Firestore
# - Storage
# - Emulators
```

## CI/CD Configuration

The CI/CD pipelines are already configured in `.github/workflows/`. Here's what each does:

### Development Pipeline (`deploy-dev.yml`)

- **Trigger**: Automatic on push to `main` branch
- **Target**: receiptscan-dev project
- **Process**:
  1. Install dependencies
  2. Run linter
  3. Build TypeScript
  4. Deploy to Firebase
  5. Run health checks

### Test Pipeline (`deploy-test.yml`)

- **Trigger**: Manual via GitHub Actions UI
- **Target**: receiptscan-test project
- **Requires**: Typing "deploy" to confirm
- **Process**: Same as dev + confirmation step

### Production Pipeline (`deploy-prd.yml`)

- **Trigger**: Manual via GitHub Actions UI
- **Target**: receiptscan-prd project
- **Requires**: 
  - Version tag (e.g., v1.0.0)
  - Typing "deploy-production" to confirm
  - Manual approval after blue deployment
- **Process**:
  1. Deploy to blue environment
  2. Run smoke tests
  3. Wait for manual approval
  4. Switch traffic to blue
  5. Verify production health

## Initial Deployment

### Step 1: Deploy Security Rules (All Environments)

Deploy Firestore and Storage rules to all environments:

```bash
# Development
firebase use dev
firebase deploy --only firestore:rules
firebase deploy --only storage

# Test
firebase use test
firebase deploy --only firestore:rules
firebase deploy --only storage

# Production
firebase use prd
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Step 2: Deploy Firestore Indexes

```bash
# Deploy indexes to all environments
firebase use dev && firebase deploy --only firestore:indexes
firebase use test && firebase deploy --only firestore:indexes
firebase use prd && firebase deploy --only firestore:indexes
```

### Step 3: Run Database Migrations

```bash
# Development
npm run migrate -- --env dev

# Test
npm run migrate -- --env test

# Production
npm run migrate -- --env prd
```

### Step 4: Seed Test Data (Dev/Test Only)

```bash
# Development
npm run seed -- --env dev

# Test
npm run seed -- --env test

# DO NOT seed production!
```

### Step 5: Deploy Functions

#### Development (Automatic)

```bash
# Just push to main branch
git add .
git commit -m "Initial deployment"
git push origin main
```

GitHub Actions will automatically deploy to development.

#### Test (Manual)

```bash
# Or use GitHub UI:
# 1. Go to Actions tab
# 2. Select "Deploy to Test"
# 3. Click "Run workflow"
# 4. Type "deploy" and click "Run workflow"

# Or deploy manually:
npm run deploy:test
```

#### Production (Manual)

First, create a version tag:

```bash
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0
```

Then use GitHub UI:
1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Enter version: `v1.0.0`
5. Type "deploy-production"
6. Click "Run workflow"
7. Wait for blue deployment
8. Review and approve production switch

## Verification

### Step 1: Verify Health Endpoints

```bash
# Development
curl https://api-dev.receiptscan.ai/health

# Test
curl https://api-test.receiptscan.ai/health

# Production
curl https://api.receiptscan.ai/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T...",
  "environment": {
    "nodeEnv": "development",
    "projectId": "receiptscan-dev",
    "region": "us-central1",
    "apiBaseUrl": "https://api-dev.receiptscan.ai"
  },
  "services": {
    "firestore": {
      "status": "connected",
      "latency": "45ms"
    },
    "storage": {
      "status": "configured",
      "bucket": "receiptscan-dev.appspot.com"
    }
  },
  ...
}
```

### Step 2: Verify Firestore Connection

1. Go to Firebase Console > Firestore
2. Check for `_health` collection
3. Should see a `check` document with recent timestamp

### Step 3: Verify Functions

```bash
# List deployed functions
firebase use dev
firebase functions:list

# View function logs
firebase functions:log --only api
```

### Step 4: Test API Endpoints

```bash
# Root endpoint
curl https://api-dev.receiptscan.ai/

# Readiness check
curl https://api-dev.receiptscan.ai/readiness
```

### Step 5: Verify Environment Isolation

Ensure each environment is properly isolated:

1. Check Firestore - different databases
2. Check Storage - different buckets
3. Check Functions - different deployments
4. Check API keys - different keys per environment

### Step 6: Test CI/CD Pipeline

1. Make a small change (e.g., update README)
2. Push to main branch
3. Check GitHub Actions for automatic dev deployment
4. Verify deployment succeeded
5. Check health endpoint reflects the new deployment

## Troubleshooting

### Issue: Firebase CLI not authenticated

```bash
firebase login --reauth
```

### Issue: Don't have access to Firebase projects

Contact your Firebase project administrator to add you with Editor role.

### Issue: GitHub Actions failing

1. Check GitHub Secrets are configured correctly
2. Verify service account JSON is valid
3. Check Firebase project IDs match
4. Review action logs for specific errors

### Issue: Functions deployment fails

```bash
# Check quota limits
# Verify billing is enabled
# Check function logs for errors
firebase functions:log
```

### Issue: Health check returns 503

1. Check Firestore rules are deployed
2. Verify Firebase Admin SDK is initialized
3. Check function logs for errors
4. Verify environment variables are set

## Next Steps

After successful setup:

1. ✅ Configure custom domains (api-dev.receiptscan.ai, etc.)
2. ✅ Set up monitoring and alerting
3. ✅ Configure backup schedules
4. ✅ Set up error tracking (e.g., Sentry)
5. ✅ Configure uptime monitoring
6. ✅ Document runbooks for common issues
7. ✅ Train team on deployment procedures
8. ✅ Schedule regular security reviews

## Support

For issues during setup:
- Check the [README.md](./README.md) for general documentation
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures
- See [ROLLBACK.md](./ROLLBACK.md) for rollback procedures
- Contact the DevOps team or engineering lead

---

**Congratulations!** 🎉 Your multi-environment deployment infrastructure is now set up and ready to use.
