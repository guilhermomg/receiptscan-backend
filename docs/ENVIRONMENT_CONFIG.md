# Environment Configuration Guide

This guide explains how to configure environment-specific settings for the receiptscan-backend API across development, test, and production environments.

## Table of Contents

- [Overview](#overview)
- [Environment Files](#environment-files)
- [Configuration Variables](#configuration-variables)
- [Firebase Setup](#firebase-setup)
- [Third-Party Services](#third-party-services)
- [GitHub Secrets](#github-secrets)
- [Best Practices](#best-practices)

## Overview

The receiptscan-backend uses environment-specific configuration files to manage different settings for each deployment environment. This ensures proper isolation and security across environments.

### Configuration Hierarchy

```
.env.example        # Template with all available variables
.env.development    # Development environment (local, dev server)
.env.test           # Test environment (pre-production)
.env.production     # Production environment (live)
```

## Environment Files

### .env.development

Used for local development and deployed development environment.

**Key Characteristics**:
- Debug-level logging
- Test/sandbox credentials for external services
- Permissive CORS settings
- Lower rate limits for testing

```bash
NODE_ENV=development
ENVIRONMENT=dev
LOG_LEVEL=debug
API_DOMAIN=https://api-dev.receiptscan.ai
CORS_ORIGINS=http://localhost:3001,https://dev.receiptscan.ai
```

### .env.test

Used for pre-production testing and QA.

**Key Characteristics**:
- Warning-level logging
- Test/sandbox credentials
- Stricter CORS than dev
- Production-like configuration

```bash
NODE_ENV=test
ENVIRONMENT=test
LOG_LEVEL=warn
API_DOMAIN=https://api-test.receiptscan.ai
CORS_ORIGINS=https://test.receiptscan.ai
```

### .env.production

Used for live production environment.

**Key Characteristics**:
- Info-level logging
- Live/production credentials
- Strict CORS settings
- Full rate limiting
- Performance optimizations

```bash
NODE_ENV=production
ENVIRONMENT=prd
LOG_LEVEL=info
API_DOMAIN=https://api.receiptscan.ai
CORS_ORIGINS=https://receiptscan.ai,https://www.receiptscan.ai
```

## Configuration Variables

### Core Application Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | `development`, `test`, `production` |
| `ENVIRONMENT` | Deployment environment identifier | `dev`, `test`, `prd` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging verbosity | `debug`, `info`, `warn`, `error` |
| `API_PREFIX` | API route prefix | `/api/v1` |
| `API_DOMAIN` | Full API domain URL | `https://api.receiptscan.ai` |

### Security Settings

| Variable | Description | Example |
|----------|-------------|---------|
| `CORS_ORIGINS` | Comma-separated allowed origins | `https://receiptscan.ai,https://www.receiptscan.ai` |
| `MAX_REQUEST_SIZE` | Maximum request body size | `10mb` |

### Firebase Configuration

| Variable | Description | How to Get |
|----------|-------------|------------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Firebase Console → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Service account private key | Firebase Console → Generate Private Key |
| `FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket name | Firebase Console → Storage |

### OpenAI Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | Model to use | `gpt-4o` |
| `OPENAI_MAX_TOKENS` | Max tokens per request | `2000` |
| `OPENAI_TEMPERATURE` | Response randomness (0-1) | `0.1` |

### Stripe Configuration

| Variable | Description | Test/Live |
|----------|-------------|-----------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_test_...` / `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | Pro subscription price ID | `price_test_...` / `price_live_...` |
| `FRONTEND_URL` | Frontend URL for redirects | `https://receiptscan.ai` |

### Deployment Metadata

These are automatically set by CI/CD:

| Variable | Description | Set By |
|----------|-------------|--------|
| `DEPLOYMENT_VERSION` | Version number | GitHub Actions workflow |
| `DEPLOYMENT_COMMIT_SHA` | Git commit SHA | GitHub Actions (`${{ github.sha }}`) |
| `DEPLOYMENT_TIMESTAMP` | Deployment timestamp | GitHub Actions (`date -u`) |

## Firebase Setup

### Creating Firebase Projects

1. **Create Projects**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create three projects:
     - `receiptscan-dev`
     - `receiptscan-test`
     - `receiptscan-prd`

2. **Enable Services**:
   For each project:
   - Enable **Firestore Database**
   - Enable **Cloud Storage**
   - Enable **Authentication**

3. **Generate Service Account**:
   - Go to **Project Settings** → **Service Accounts**
   - Click **Generate New Private Key**
   - Download the JSON file

4. **Extract Credentials**:
   ```json
   {
     "project_id": "receiptscan-dev",           // FIREBASE_PROJECT_ID
     "client_email": "firebase-adminsdk@...",   // FIREBASE_CLIENT_EMAIL
     "private_key": "-----BEGIN PRIVATE KEY...", // FIREBASE_PRIVATE_KEY
   }
   ```

5. **Configure Storage Buckets**:
   - Bucket names: `receiptscan-dev.appspot.com`, etc.
   - Set in `FIREBASE_STORAGE_BUCKET`

### Firestore Indexes

Deploy indexes to each environment:

```bash
# Development
firebase use receiptscan-dev
firebase deploy --only firestore:indexes

# Test
firebase use receiptscan-test
firebase deploy --only firestore:indexes

# Production
firebase use receiptscan-prd
firebase deploy --only firestore:indexes
```

### Firestore Security Rules

Deploy security rules:

```bash
firebase deploy --only firestore:rules
```

## Third-Party Services

### OpenAI API Keys

**Recommendation**: Use separate API keys per environment for:
- Cost tracking per environment
- Rate limit isolation
- Security (revoke without affecting other environments)

**Setup**:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create API keys:
   - `receiptscan-dev-key` for development
   - `receiptscan-test-key` for test
   - `receiptscan-prod-key` for production
3. Set spending limits per key
4. Add to environment files

### Stripe Configuration

**Test Mode** (Development & Test):
- Use test mode API keys: `sk_test_...`
- Test webhook secret: `whsec_...`
- Test price ID: `price_test_...`
- Payments won't be charged

**Live Mode** (Production):
- Use live mode API keys: `sk_live_...`
- Live webhook secret: `whsec_...`
- Live price ID: `price_live_...`
- Real payments will be processed

**Webhook Setup**:

Development/Test:
```
Endpoint: https://api-dev.receiptscan.ai/api/v1/billing/webhook
Events: checkout.session.completed, customer.subscription.*, invoice.*
```

Production:
```
Endpoint: https://api.receiptscan.ai/api/v1/billing/webhook
Events: checkout.session.completed, customer.subscription.*, invoice.*
```

## GitHub Secrets

Configure secrets in your GitHub repository for CI/CD:

### Setting Up Secrets

1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add all secrets listed below

### Required Secrets

#### Development (DEV_*)
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
DEV_GCP_SA_KEY
```

#### Test (TEST_*)
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

#### Production (PRD_*)
```
PRD_CORS_ORIGINS
PRD_FIREBASE_PROJECT_ID
PRD_FIREBASE_CLIENT_EMAIL
PRD_FIREBASE_PRIVATE_KEY
PRD_FIREBASE_STORAGE_BUCKET
PRD_OPENAI_API_KEY
PRD_STRIPE_SECRET_KEY
PRD_STRIPE_WEBHOOK_SECRET
PRD_STRIPE_PRO_PRICE_ID
PRD_FRONTEND_URL
PRD_GCP_SA_KEY
```

#### Shared
```
FIREBASE_TOKEN
```

### Getting Firebase Token

```bash
firebase login:ci
```

This generates a CI token for Firebase CLI authentication.

### Formatting Private Keys

When adding `FIREBASE_PRIVATE_KEY` to secrets:

1. Get the private key from service account JSON
2. Replace newlines with `\\n`:
   ```
   "-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"
   ```
3. Or use the full private key string as-is if GitHub Secrets handles it

## Best Practices

### Security

1. **Never Commit Secrets**:
   - All `.env.*` files are in `.gitignore`
   - Only `.env.example` is committed
   - Use placeholder values in example file

2. **Rotate Credentials Regularly**:
   - Rotate service account keys every 90 days
   - Rotate API keys quarterly
   - Update GitHub Secrets after rotation

3. **Use Principle of Least Privilege**:
   - Service accounts should have minimal permissions
   - Separate credentials per environment
   - Revoke unused credentials

4. **Monitor Usage**:
   - Track API usage in Firebase Console
   - Monitor OpenAI token usage
   - Set up billing alerts

### Environment Isolation

1. **Separate Projects**:
   - Use different Firebase projects per environment
   - Never share databases between environments
   - Separate storage buckets

2. **Data Isolation**:
   - Test environments can have fake data
   - Production data stays in production
   - Regular backups for production only

3. **Access Control**:
   - Limit production access to necessary personnel
   - Use role-based access in Firebase
   - Audit access logs regularly

### Configuration Management

1. **Document Changes**:
   - Update `.env.example` when adding variables
   - Document variable purposes in this guide
   - Notify team of breaking configuration changes

2. **Validate Configuration**:
   - Health check endpoint validates service configuration
   - CI/CD fails if required variables missing
   - Test configuration in dev before promoting

3. **Version Control**:
   - Tag configuration changes in Git
   - Document major config changes in CHANGELOG
   - Review configuration in code reviews

## Troubleshooting

### Common Issues

#### "Firebase Private Key Invalid"

**Cause**: Newlines not properly escaped

**Solution**:
```bash
# Ensure private key newlines are escaped
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"
```

#### "CORS Error"

**Cause**: Frontend URL not in `CORS_ORIGINS`

**Solution**: Add frontend URL to CORS_ORIGINS:
```bash
CORS_ORIGINS=https://receiptscan.ai,https://www.receiptscan.ai
```

#### "Stripe Webhook Signature Invalid"

**Cause**: Wrong webhook secret for environment

**Solution**: Verify webhook secret matches Stripe dashboard:
```bash
# Test mode for dev/test
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Live mode for production
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### "OpenAI Rate Limit Exceeded"

**Cause**: Too many requests or shared key

**Solution**: Use separate API keys per environment with rate limits:
```bash
DEV_OPENAI_API_KEY=sk-proj-dev-...
TEST_OPENAI_API_KEY=sk-proj-test-...
PRD_OPENAI_API_KEY=sk-proj-prod-...
```

## Next Steps

- Review [Deployment Guide](./DEPLOYMENT.md) for deployment procedures
- Set up monitoring and alerts for each environment
- Schedule regular credential rotation
- Document any custom configuration variables

---

**Last Updated**: 2024-12-30
