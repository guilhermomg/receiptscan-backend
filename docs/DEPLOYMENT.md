# Deployment Guide

This guide provides comprehensive instructions for deploying the receiptscan-backend API to development, test, and production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Firebase Projects Setup](#firebase-projects-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Deployment Methods](#deployment-methods)
- [CI/CD Pipeline](#cicd-pipeline)
- [Manual Deployment](#manual-deployment)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

The receiptscan-backend supports three deployment environments:

| Environment | Purpose | Domain | Auto-Deploy |
|------------|---------|---------|-------------|
| **Development (dev)** | Active development & testing | api-dev.receiptscan.ai | ✅ Yes (on push to main) |
| **Test (test)** | Pre-production testing | api-test.receiptscan.ai | ⚠️ Manual trigger |
| **Production (prd)** | Live production | api.receiptscan.ai | ⚠️ Manual approval required |

## Prerequisites

Before deploying, ensure you have:

1. **Firebase CLI** installed: `npm install -g firebase-tools`
2. **Google Cloud SDK** (gcloud) installed
3. **Access to Firebase projects** for all environments
4. **GitHub repository access** with appropriate permissions
5. **Service account keys** for each environment

## Environment Setup

### 1. Firebase Projects

Create three separate Firebase projects:

```bash
# Development
receiptscan-dev

# Test
receiptscan-test

# Production
receiptscan-prd
```

For each project:

1. Enable Firestore Database
2. Enable Cloud Storage
3. Enable Authentication
4. Generate service account credentials

### 2. Environment Variables

Each environment requires the following variables:

#### Development (.env.development)
```bash
NODE_ENV=development
PORT=3000
ENVIRONMENT=dev
LOG_LEVEL=debug
API_PREFIX=/api/v1
API_DOMAIN=https://api-dev.receiptscan.ai
CORS_ORIGINS=http://localhost:3001,https://dev.receiptscan.ai
MAX_REQUEST_SIZE=10mb

# Firebase (receiptscan-dev)
FIREBASE_PROJECT_ID=receiptscan-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@receiptscan-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=receiptscan-dev.appspot.com

# OpenAI (Dev key)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.1

# Stripe (Test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_test_...
FRONTEND_URL=http://localhost:3001
```

#### Test (.env.test)
Similar structure with test-specific values.

#### Production (.env.production)
Similar structure with production values (live Stripe keys, etc.).

## Firebase Projects Setup

### 1. Create Firebase Projects

For each environment:

```bash
# Login to Firebase
firebase login

# Create projects via Firebase Console
# https://console.firebase.google.com/

# Initialize Firebase in your project
firebase init
```

Select:
- Firestore
- Storage
- Functions (optional)

### 2. Configure Firestore

```bash
# Deploy Firestore rules and indexes for each environment
firebase use receiptscan-dev
firebase deploy --only firestore

firebase use receiptscan-test
firebase deploy --only firestore

firebase use receiptscan-prd
firebase deploy --only firestore
```

### 3. Configure Cloud Storage

Create storage buckets for each environment:
- `receiptscan-dev.appspot.com`
- `receiptscan-test.appspot.com`
- `receiptscan-prd.appspot.com`

Deploy storage rules:
```bash
firebase deploy --only storage
```

### 4. Service Account Setup

For each Firebase project:

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. Extract credentials:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (escape newlines with `\\n`)

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

### Development Secrets (DEV_*)
```
DEV_CORS_ORIGINS
DEV_FIREBASE_PROJECT_ID
DEV_FIREBASE_CLIENT_EMAIL
DEV_FIREBASE_PRIVATE_KEY
DEV_FIREBASE_STORAGE_BUCKET
DEV_OPENAI_API_KEY
DEV_STRIPE_SECRET_KEY
DEV_STRIPE_WEBHOOK_SECRET
DEV_STRIPE_PRO_PRICE_ID
DEV_FRONTEND_URL
DEV_GCP_SA_KEY (full service account JSON)
```

### Test Secrets (TEST_*)
```
TEST_CORS_ORIGINS
TEST_FIREBASE_PROJECT_ID
TEST_FIREBASE_CLIENT_EMAIL
TEST_FIREBASE_PRIVATE_KEY
TEST_FIREBASE_STORAGE_BUCKET
TEST_OPENAI_API_KEY
TEST_STRIPE_SECRET_KEY
TEST_STRIPE_WEBHOOK_SECRET
TEST_STRIPE_PRO_PRICE_ID
TEST_FRONTEND_URL
TEST_GCP_SA_KEY
```

### Production Secrets (PRD_*)
```
PRD_CORS_ORIGINS
PRD_FIREBASE_PROJECT_ID
PRD_FIREBASE_CLIENT_EMAIL
PRD_FIREBASE_PRIVATE_KEY
PRD_FIREBASE_STORAGE_BUCKET
PRD_OPENAI_API_KEY
PRD_STRIPE_SECRET_KEY (sk_live_...)
PRD_STRIPE_WEBHOOK_SECRET
PRD_STRIPE_PRO_PRICE_ID (price_live_...)
PRD_FRONTEND_URL
PRD_GCP_SA_KEY
```

### Shared Secrets
```
FIREBASE_TOKEN (for Firebase CLI authentication)
```

To generate Firebase token:
```bash
firebase login:ci
```

## Deployment Methods

### CI/CD Pipeline (Recommended)

The repository includes three GitHub Actions workflows:

#### 1. Development Deployment (Automatic)
- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/deploy-dev.yml`
- **Target**: Development environment
- **Approval**: None required

```bash
# Simply push to main
git push origin main
```

#### 2. Test Deployment (Manual)
- **Trigger**: Manual workflow dispatch
- **Workflow**: `.github/workflows/deploy-test.yml`
- **Target**: Test environment
- **Approval**: Manual confirmation required

```bash
# Via GitHub Actions UI:
1. Go to Actions → Deploy to Test
2. Click "Run workflow"
3. Type "deploy-test" to confirm
4. Click "Run workflow"
```

#### 3. Production Deployment (Manual with Blue-Green)
- **Trigger**: Manual workflow dispatch
- **Workflow**: `.github/workflows/deploy-prd.yml`
- **Target**: Production environment
- **Approval**: Manual confirmation + version number required
- **Strategy**: Blue-green deployment with zero downtime

```bash
# Via GitHub Actions UI:
1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Enter version number (e.g., 1.0.0)
4. Type "deploy-production" to confirm
5. Click "Run workflow"
```

### Manual Deployment

Use the deployment script for manual deployments:

```bash
# Make script executable (if not already)
chmod +x scripts/deploy.sh

# Deploy to development
./scripts/deploy.sh dev

# Deploy to test
./scripts/deploy.sh test

# Deploy to production (requires confirmation)
./scripts/deploy.sh prd
```

## Health Checks

After deployment, verify the service is running:

```bash
# Development
curl https://api-dev.receiptscan.ai/api/v1/health

# Test
curl https://api-test.receiptscan.ai/api/v1/health

# Production
curl https://api.receiptscan.ai/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "dev",
  "version": "1.0.0",
  "deployment": {
    "commitSha": "abc123...",
    "deployedAt": "2024-01-15T11:55:00.000Z"
  },
  "services": {
    "firebase": "configured",
    "openai": "configured",
    "stripe": "configured"
  }
}
```

## Monitoring

### Firebase Console
Monitor each environment:
- [Development Console](https://console.firebase.google.com/project/receiptscan-dev)
- [Test Console](https://console.firebase.google.com/project/receiptscan-test)
- [Production Console](https://console.firebase.google.com/project/receiptscan-prd)

### Google Cloud Console
For Cloud Run services:
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --project receiptscan-dev
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --project receiptscan-test
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --project receiptscan-prd

# View service status
gcloud run services describe receiptscan-api-dev --region us-central1
gcloud run services describe receiptscan-api-test --region us-central1
gcloud run services describe receiptscan-api-prd --region us-central1
```

### Metrics to Monitor
- **Request rate**: Requests per second
- **Error rate**: 4xx and 5xx responses
- **Latency**: P50, P95, P99
- **Uptime**: Service availability
- **Firebase usage**: Firestore reads/writes, Storage bandwidth
- **OpenAI usage**: API calls and token usage
- **Stripe events**: Successful payments, failed charges

## Troubleshooting

### Deployment Failures

#### Build Errors
```bash
# Check linter errors
npm run lint

# Check TypeScript compilation
npm run build
```

#### Firebase Authentication
```bash
# Re-authenticate
firebase login
firebase login:ci

# Check project configuration
firebase projects:list
```

#### Cloud Run Errors
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Check service configuration
gcloud run services describe receiptscan-api-dev --region us-central1

# Test container locally
docker build -t receiptscan-api .
docker run -p 3000:3000 --env-file .env.development receiptscan-api
```

### Health Check Failures

If health check returns errors:

1. **Check environment variables**:
   ```bash
   # Verify all required variables are set
   curl https://api-dev.receiptscan.ai/api/v1/health
   ```

2. **Check service connectivity**:
   - Firestore connection
   - Cloud Storage access
   - OpenAI API access
   - Stripe API access

3. **Check logs**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit 50
   ```

### Common Issues

#### Issue: "Firebase Private Key Invalid"
**Solution**: Ensure private key newlines are properly escaped (`\\n` not `\n`)

#### Issue: "CORS Errors"
**Solution**: Verify `CORS_ORIGINS` includes the correct frontend URLs

#### Issue: "Cloud Run out of memory"
**Solution**: Increase memory allocation in Cloud Run service settings

#### Issue: "Firestore Permission Denied"
**Solution**: Check Firestore rules and ensure service account has proper permissions

## Best Practices

1. **Always test in dev/test before production**
2. **Use blue-green deployment for production** (already configured in workflow)
3. **Monitor logs during and after deployment**
4. **Keep secrets updated and rotated regularly**
5. **Tag production releases** for easy rollback
6. **Document all environment changes**
7. **Test rollback procedures periodically**
8. **Use semantic versioning** (e.g., 1.0.0)

## Next Steps

- Review [ROLLBACK.md](./ROLLBACK.md) for rollback procedures
- Configure monitoring alerts
- Setup error tracking (e.g., Sentry)
- Document runbook for common issues
- Schedule regular security audits

## Support

For deployment issues:
1. Check [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Check Cloud Run and Firebase logs
4. Contact DevOps team

---

**Last Updated**: 2024-12-30
