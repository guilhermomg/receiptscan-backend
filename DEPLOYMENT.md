# Deployment Guide

Complete guide for deploying the ReceiptScan backend across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Methods](#deployment-methods)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Blue-Green Deployment](#blue-green-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Prerequisites

### Required Tools

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **Firebase CLI**: Install with `npm install -g firebase-tools`
- **Git**: Version control
- **Access**: Firebase projects (dev, test, prd)

### Required Access

- Firebase project member (Editor or Owner role)
- GitHub repository access
- Ability to configure GitHub Secrets (Admin)

### Initial Verification

```bash
# Check Node.js version
node --version  # Should be v18.x.x or higher

# Check npm version
npm --version   # Should be 9.x.x or higher

# Check Firebase CLI
firebase --version

# Login to Firebase
firebase login

# Verify access to projects
firebase projects:list
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/guilhermomg/receiptscan-backend.git
cd receiptscan-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase Projects

Create three Firebase projects in the [Firebase Console](https://console.firebase.google.com):

1. **receiptscan-dev** - Development
2. **receiptscan-test** - Test
3. **receiptscan-prd** - Production

For each project:
- Enable Firestore Database
- Enable Cloud Storage
- Enable Authentication
- Enable Cloud Functions

### 4. Initialize Firebase in Each Project

```bash
# Development
firebase use dev

# Test
firebase use test

# Production
firebase use prd
```

## Environment Configuration

### Development Environment

1. **Copy environment template**
   ```bash
   cp .env.example .env.dev
   ```

2. **Configure variables** in `.env.dev`:
   ```env
   NODE_ENV=development
   FIREBASE_PROJECT_ID=receiptscan-dev
   FIREBASE_REGION=us-central1
   API_BASE_URL=https://api-dev.receiptscan.ai
   OPENAI_API_KEY=sk-dev-...
   STRIPE_API_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STORAGE_BUCKET=receiptscan-dev.appspot.com
   ```

3. **Deploy Firestore rules and indexes**
   ```bash
   firebase use dev
   firebase deploy --only firestore
   firebase deploy --only storage
   ```

4. **Run database migrations**
   ```bash
   npm run migrate -- --env dev
   ```

5. **Seed test data**
   ```bash
   npm run seed -- --env dev
   ```

### Test Environment

Repeat the same steps as development, but use `.env.test` and different API keys:

```bash
cp .env.example .env.test
# Edit .env.test with test-specific values
firebase use test
firebase deploy --only firestore
firebase deploy --only storage
npm run migrate -- --env test
npm run seed -- --env test
```

### Production Environment

**⚠️ Production setup requires extra care**

1. **Configure production environment**
   ```bash
   cp .env.example .env.prd
   # Edit .env.prd with production values
   ```

2. **Use production API keys**
   - OpenAI production key
   - Stripe live key (not test key)
   - Strong webhook secrets

3. **Deploy infrastructure**
   ```bash
   firebase use prd
   firebase deploy --only firestore
   firebase deploy --only storage
   ```

4. **Run migrations** (no seeding in production)
   ```bash
   npm run migrate -- --env prd
   ```

5. **Verify configuration**
   ```bash
   # Check that environment variables are correct
   cat .env.prd | grep -v "API_KEY"
   ```

## Deployment Methods

### Method 1: Manual Deployment

Best for: Quick fixes, development environment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to test
npm run deploy:test

# Deploy to production
npm run deploy:prd
```

### Method 2: Using Deployment Script

Best for: Controlled deployments with validation

```bash
# Development
./scripts/deploy.sh dev

# Test
./scripts/deploy.sh test

# Production
./scripts/deploy.sh prd
```

The script performs:
- Dependency installation
- Linting
- Building
- Project switching
- Deployment
- Health check

### Method 3: CI/CD via GitHub Actions

Best for: Automated, consistent deployments

See [CI/CD Pipeline](#cicd-pipeline) section below.

## CI/CD Pipeline

### GitHub Secrets Configuration

Configure these secrets in GitHub repository settings:

**For all environments:**
- `GITHUB_TOKEN` (automatically provided)

**Development:**
- `FIREBASE_SERVICE_ACCOUNT_DEV`
- `OPENAI_API_KEY_DEV`
- `STRIPE_API_KEY_DEV`
- `STRIPE_WEBHOOK_SECRET_DEV`

**Test:**
- `FIREBASE_SERVICE_ACCOUNT_TEST`
- `OPENAI_API_KEY_TEST`
- `STRIPE_API_KEY_TEST`
- `STRIPE_WEBHOOK_SECRET_TEST`

**Production:**
- `FIREBASE_SERVICE_ACCOUNT_PRD`
- `OPENAI_API_KEY_PRD`
- `STRIPE_API_KEY_PRD`
- `STRIPE_WEBHOOK_SECRET_PRD`

### Getting Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely
6. Copy the entire JSON content to the GitHub Secret

### Development Deployment (Automatic)

Triggers on every push to `main` branch:

```bash
git checkout main
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Actions will automatically:
1. Run linter
2. Build the code
3. Deploy to development
4. Run health checks

### Test Deployment (Manual)

1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy to Test" workflow
4. Click "Run workflow"
5. Type "deploy" to confirm
6. Click "Run workflow" button

### Production Deployment (Manual with Approval)

**Prerequisites:**
- Changes are tested in dev and test environments
- Code is tagged with version number
- Team is ready for deployment

**Steps:**

1. **Create a release tag**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Trigger deployment**
   - Go to GitHub Actions
   - Select "Deploy to Production"
   - Click "Run workflow"
   - Enter version tag: `v1.0.0`
   - Type "deploy-production" to confirm
   - Click "Run workflow"

3. **Monitor blue deployment**
   - GitHub Actions deploys to blue environment
   - Automated smoke tests run
   - Review logs and metrics

4. **Approve production switch**
   - Review blue environment health
   - Approve the deployment in GitHub Actions
   - Traffic switches to blue (new version)

5. **Verify production**
   ```bash
   curl https://api.receiptscan.ai/health
   ```

## Blue-Green Deployment

### Overview

Production uses blue-green deployment for zero-downtime releases:

- **Blue Environment**: New version being deployed
- **Green Environment**: Current live version
- **Traffic Switch**: Instant switch from green to blue

### Deployment Flow

```
Current State: Green (v1.0.0) → Live Traffic

Step 1: Deploy to Blue
  Blue (v1.1.0) → No traffic
  Green (v1.0.0) → Live traffic

Step 2: Test Blue
  Blue (v1.1.0) → Run smoke tests
  Green (v1.0.0) → Live traffic

Step 3: Switch Traffic
  Blue (v1.1.0) → Live traffic ✓
  Green (v1.0.0) → No traffic (standby)

Step 4: Monitor
  Blue (v1.1.0) → Monitor for issues
  Green (v1.0.0) → Ready for rollback
```

### Benefits

- **Zero Downtime**: Traffic switch is instant
- **Easy Rollback**: Switch back to green if issues occur
- **Testing in Production**: Test blue before switching traffic
- **Risk Mitigation**: Previous version ready for immediate rollback

### Rollback

If issues are detected after traffic switch:

```bash
# Quick rollback by switching traffic back
firebase use prd
# Use Firebase Console to redirect traffic to green

# Or use automated script
./scripts/rollback.sh prd v1.0.0
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Error**: TypeScript compilation errors

**Solution**:
```bash
# Clean build
rm -rf lib node_modules
npm install
npm run build
```

#### 2. Deployment Permission Denied

**Error**: `Permission denied to deploy`

**Solution**:
```bash
# Re-authenticate
firebase login --reauth

# Verify project access
firebase projects:list

# Check you're using correct project
firebase use
```

#### 3. Environment Variables Not Loading

**Error**: `OPENAI_API_KEY is undefined`

**Solution**:
```bash
# Verify .env file exists
ls -la .env.*

# Check file contents (don't expose keys)
cat .env.dev | grep -v "KEY"

# Ensure NODE_ENV matches
echo $NODE_ENV
```

#### 4. Health Check Fails After Deployment

**Error**: Health endpoint returns 503

**Solution**:
```bash
# Check function logs
firebase use <env>
firebase functions:log --only api

# Verify Firestore connection
# Check Firebase Console for any issues

# Test specific endpoints
curl https://api-dev.receiptscan.ai/
curl https://api-dev.receiptscan.ai/readiness
```

#### 5. Firebase Functions Timeout

**Error**: Function execution timed out

**Solution**:
- Increase function timeout in Firebase Console
- Optimize slow database queries
- Add indexes for common queries
- Consider function splitting

#### 6. CORS Errors

**Error**: `Access-Control-Allow-Origin` error

**Solution**:
```bash
# Check CORS_ORIGINS in .env file
# Ensure client domain is listed
# Redeploy with updated configuration
```

### Debugging Tools

```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only api

# Live log streaming
firebase functions:log --only api --follow

# Check function details
firebase functions:config:get

# Test function locally
npm run serve
```

## Best Practices

### Pre-Deployment

- [ ] Run tests locally: `npm test`
- [ ] Run linter: `npm run lint`
- [ ] Test in dev environment first
- [ ] Test in test environment before production
- [ ] Review code changes
- [ ] Check for breaking changes
- [ ] Verify database migrations work
- [ ] Update version number if needed
- [ ] Create release notes

### During Deployment

- [ ] Monitor deployment logs
- [ ] Watch for errors
- [ ] Run health checks immediately
- [ ] Test critical functionality
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Have team available for support

### Post-Deployment

- [ ] Monitor for 30 minutes
- [ ] Check error logs
- [ ] Verify monitoring dashboards
- [ ] Test user workflows
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Keep previous version ready for rollback

### Version Tagging

Use semantic versioning:

- **Major version** (v2.0.0): Breaking changes
- **Minor version** (v1.1.0): New features, backward compatible
- **Patch version** (v1.0.1): Bug fixes

```bash
# Create version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# List tags
git tag -l

# Delete tag if needed
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

### Security

- ✓ Never commit `.env` files with real keys
- ✓ Use GitHub Secrets for CI/CD
- ✓ Rotate API keys regularly (quarterly)
- ✓ Use different keys for each environment
- ✓ Keep Firebase service accounts secure
- ✓ Review security rules regularly
- ✓ Enable Firebase App Check
- ✓ Monitor for suspicious activity

### Performance

- ✓ Monitor function cold starts
- ✓ Keep functions small and focused
- ✓ Use appropriate timeout values
- ✓ Optimize database queries
- ✓ Add necessary Firestore indexes
- ✓ Use caching where appropriate
- ✓ Monitor memory usage

### Monitoring

- ✓ Set up error alerting
- ✓ Monitor response times
- ✓ Track error rates
- ✓ Set up uptime monitoring
- ✓ Monitor costs
- ✓ Review logs regularly
- ✓ Set up dashboards

## Quick Reference

### Common Commands

```bash
# Deploy to environment
npm run deploy:dev
npm run deploy:test
npm run deploy:prd

# Build and lint
npm run build
npm run lint

# Database operations
npm run migrate -- --env dev
npm run seed -- --env dev

# View logs
firebase functions:log

# Switch projects
firebase use dev
firebase use test
firebase use prd

# Local development
npm run serve
```

### URLs

- Development: https://api-dev.receiptscan.ai
- Test: https://api-test.receiptscan.ai
- Production: https://api.receiptscan.ai

### Support

- Documentation: This file and README.md
- Rollback Guide: ROLLBACK.md
- Team Slack: #engineering
- Email: engineering@receiptscan.ai

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
