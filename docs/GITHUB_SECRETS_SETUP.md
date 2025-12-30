# GitHub Secrets Setup Guide

This guide provides step-by-step instructions for configuring GitHub Secrets required for the CI/CD pipeline.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Accessing GitHub Secrets](#accessing-github-secrets)
- [Required Secrets](#required-secrets)
- [Step-by-Step Setup](#step-by-step-setup)
- [Verification](#verification)
- [Security Best Practices](#security-best-practices)

## Overview

GitHub Secrets securely store sensitive credentials used by GitHub Actions workflows to deploy the application across different environments. These secrets are encrypted and only accessible to authorized workflows.

### Why Secrets?

- ✅ Secure storage of API keys and credentials
- ✅ Environment-specific configuration
- ✅ No credentials in source code
- ✅ Easy rotation and updates
- ✅ Audit trail of changes

## Prerequisites

Before setting up secrets, you need:

1. **Admin access** to the GitHub repository
2. **Firebase service account keys** for each environment
3. **OpenAI API keys** (separate per environment recommended)
4. **Stripe API keys** (test keys for dev/test, live keys for production)
5. **Frontend URLs** for each environment

## Accessing GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

## Required Secrets

### Complete Secrets Checklist

#### Development Environment (12 secrets)
- [ ] `DEV_CORS_ORIGINS`
- [ ] `DEV_FIREBASE_PROJECT_ID`
- [ ] `DEV_FIREBASE_CLIENT_EMAIL`
- [ ] `DEV_FIREBASE_PRIVATE_KEY`
- [ ] `DEV_FIREBASE_STORAGE_BUCKET`
- [ ] `DEV_OPENAI_API_KEY`
- [ ] `DEV_STRIPE_SECRET_KEY`
- [ ] `DEV_STRIPE_WEBHOOK_SECRET`
- [ ] `DEV_STRIPE_PRO_PRICE_ID`
- [ ] `DEV_FRONTEND_URL`
- [ ] `DEV_GCP_SA_KEY`

#### Test Environment (11 secrets)
- [ ] `TEST_CORS_ORIGINS`
- [ ] `TEST_FIREBASE_PROJECT_ID`
- [ ] `TEST_FIREBASE_CLIENT_EMAIL`
- [ ] `TEST_FIREBASE_PRIVATE_KEY`
- [ ] `TEST_FIREBASE_STORAGE_BUCKET`
- [ ] `TEST_OPENAI_API_KEY`
- [ ] `TEST_STRIPE_SECRET_KEY`
- [ ] `TEST_STRIPE_WEBHOOK_SECRET`
- [ ] `TEST_STRIPE_PRO_PRICE_ID`
- [ ] `TEST_FRONTEND_URL`
- [ ] `TEST_GCP_SA_KEY`

#### Production Environment (11 secrets)
- [ ] `PRD_CORS_ORIGINS`
- [ ] `PRD_FIREBASE_PROJECT_ID`
- [ ] `PRD_FIREBASE_CLIENT_EMAIL`
- [ ] `PRD_FIREBASE_PRIVATE_KEY`
- [ ] `PRD_FIREBASE_STORAGE_BUCKET`
- [ ] `PRD_OPENAI_API_KEY`
- [ ] `PRD_STRIPE_SECRET_KEY`
- [ ] `PRD_STRIPE_WEBHOOK_SECRET`
- [ ] `PRD_STRIPE_PRO_PRICE_ID`
- [ ] `PRD_FRONTEND_URL`
- [ ] `PRD_GCP_SA_KEY`

#### Shared Secrets (1 secret)
- [ ] `FIREBASE_TOKEN`

**Total**: 35 secrets

## Step-by-Step Setup

### 1. Firebase Configuration

For each environment (dev, test, prd):

#### Get Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (e.g., `receiptscan-dev`)
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

#### Extract Values

Open the downloaded JSON file and extract:

```json
{
  "project_id": "receiptscan-dev",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@receiptscan-dev.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

#### Add to GitHub Secrets

**Secret**: `DEV_FIREBASE_PROJECT_ID`
```
receiptscan-dev
```

**Secret**: `DEV_FIREBASE_CLIENT_EMAIL`
```
firebase-adminsdk-xxxxx@receiptscan-dev.iam.gserviceaccount.com
```

**Secret**: `DEV_FIREBASE_PRIVATE_KEY`
```
-----BEGIN PRIVATE KEY-----
MIIE...
-----END PRIVATE KEY-----
```

**Note**: Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines.

**Secret**: `DEV_FIREBASE_STORAGE_BUCKET`
```
receiptscan-dev.appspot.com
```

**Secret**: `DEV_GCP_SA_KEY`
```json
{
  "type": "service_account",
  "project_id": "receiptscan-dev",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@receiptscan-dev.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Note**: Paste the entire JSON content.

Repeat for `TEST_*` and `PRD_*` with respective Firebase projects.

### 2. OpenAI Configuration

#### Get API Keys

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Name it (e.g., "receiptscan-dev")
4. Set usage limits (recommended)
5. Copy the key (starts with `sk-proj-...` or `sk-...`)

#### Add to GitHub Secrets

**Secret**: `DEV_OPENAI_API_KEY`
```
sk-proj-...your-key-here
```

**Note**: Create separate keys for each environment for better cost tracking and security.

Repeat for `TEST_OPENAI_API_KEY` and `PRD_OPENAI_API_KEY`.

### 3. Stripe Configuration

#### Development & Test (Test Mode)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Switch to **Test Mode** (toggle in top right)
3. Copy **Secret key** (starts with `sk_test_`)

**Secret**: `DEV_STRIPE_SECRET_KEY`
```
sk_test_...your-test-key
```

**Secret**: `TEST_STRIPE_SECRET_KEY`
```
sk_test_...your-test-key
```

#### Production (Live Mode)

1. Switch to **Live Mode** in Stripe Dashboard
2. Copy **Secret key** (starts with `sk_live_`)

**Secret**: `PRD_STRIPE_SECRET_KEY`
```
sk_live_...your-live-key
```

#### Webhook Secrets

For each environment:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL:
   - Dev: `https://api-dev.receiptscan.ai/api/v1/billing/webhook`
   - Test: `https://api-test.receiptscan.ai/api/v1/billing/webhook`
   - Prod: `https://api.receiptscan.ai/api/v1/billing/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy **Signing secret** (starts with `whsec_`)

**Secret**: `DEV_STRIPE_WEBHOOK_SECRET`
```
whsec_...your-webhook-secret
```

Repeat for `TEST_STRIPE_WEBHOOK_SECRET` and `PRD_STRIPE_WEBHOOK_SECRET`.

#### Price IDs

1. Go to **Products** in Stripe Dashboard
2. Create or find your "Pro Subscription" product
3. Copy the **Price ID** (starts with `price_test_` or `price_`)

**Secret**: `DEV_STRIPE_PRO_PRICE_ID`
```
price_test_...
```

**Secret**: `TEST_STRIPE_PRO_PRICE_ID`
```
price_test_...
```

**Secret**: `PRD_STRIPE_PRO_PRICE_ID`
```
price_...
```

### 4. CORS Origins

**Secret**: `DEV_CORS_ORIGINS`
```
http://localhost:3001,https://dev.receiptscan.ai
```

**Secret**: `TEST_CORS_ORIGINS`
```
https://test.receiptscan.ai,https://receiptscan-test.web.app
```

**Secret**: `PRD_CORS_ORIGINS`
```
https://receiptscan.ai,https://www.receiptscan.ai
```

### 5. Frontend URLs

**Secret**: `DEV_FRONTEND_URL`
```
http://localhost:3001
```

**Secret**: `TEST_FRONTEND_URL`
```
https://test.receiptscan.ai
```

**Secret**: `PRD_FRONTEND_URL`
```
https://receiptscan.ai
```

### 6. Firebase Token

Generate Firebase CI token:

```bash
firebase login:ci
```

This will open a browser for authentication and output a token.

**Secret**: `FIREBASE_TOKEN`
```
1//0...your-firebase-token
```

## Verification

### Check All Secrets Are Set

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify all 35 secrets are listed
3. Note: You cannot view secret values, only names

### Test with a Workflow

Trigger a development deployment to verify secrets work:

```bash
git push origin main
```

This will trigger the development deployment workflow.

### Check Workflow Logs

1. Go to **Actions** tab
2. Click on the running workflow
3. Check for errors related to missing secrets
4. Verify environment variables are set correctly

### Common Errors

**Error**: "Secret not found"
- **Solution**: Secret name typo, ensure exact match (case-sensitive)

**Error**: "Invalid Firebase credentials"
- **Solution**: Verify private key format, ensure newlines are preserved

**Error**: "CORS error"
- **Solution**: Check CORS_ORIGINS includes correct URLs

## Security Best Practices

### 1. Access Control

- Limit repository admin access
- Use branch protection rules
- Require code review for changes to workflows
- Enable two-factor authentication

### 2. Secret Rotation

Schedule regular rotation:

| Secret Type | Rotation Frequency |
|------------|-------------------|
| Firebase service accounts | Every 90 days |
| OpenAI API keys | Every 90 days |
| Stripe API keys | Annually or after breach |
| Webhook secrets | After any compromise |

### 3. Monitoring

- Enable GitHub audit log
- Monitor workflow runs for failures
- Track API usage in external services
- Set up alerts for unusual activity

### 4. Incident Response

If secrets are compromised:

1. **Immediately revoke** the compromised credential in the source service
2. **Generate new** credentials
3. **Update** GitHub Secret with new value
4. **Redeploy** affected environments
5. **Audit** recent activity for unauthorized access
6. **Document** incident and prevention measures

### 5. Never

- ❌ Commit secrets to repository
- ❌ Print secrets in workflow logs
- ❌ Share secrets via chat/email
- ❌ Reuse secrets across environments
- ❌ Use production secrets in dev/test

## Troubleshooting

### "Secret is empty or null"

**Cause**: Secret not set or has incorrect name

**Solution**:
1. Verify secret name matches workflow exactly (case-sensitive)
2. Ensure secret has a value (not empty string)
3. Check for leading/trailing spaces in secret name

### "Firebase authentication failed"

**Cause**: Malformed private key

**Solution**:
1. Ensure entire private key is copied including header/footer
2. Check newlines are preserved (don't strip them)
3. Verify service account has correct permissions

### "Stripe signature verification failed"

**Cause**: Wrong webhook secret

**Solution**:
1. Verify webhook secret matches endpoint
2. Check environment (test vs live mode)
3. Ensure webhook endpoint URL is correct

### "Cannot access GitHub Secrets"

**Cause**: Insufficient permissions

**Solution**:
1. Verify you have admin access to repository
2. Check organization settings if in an org
3. Ensure workflows are enabled

## Maintenance Checklist

### Monthly
- [ ] Review workflow logs for secret-related errors
- [ ] Verify all environments are deploying successfully
- [ ] Check API usage in Firebase, OpenAI, Stripe

### Quarterly
- [ ] Rotate Firebase service account keys
- [ ] Rotate OpenAI API keys
- [ ] Review and update CORS origins if needed
- [ ] Audit secret access logs

### Annually
- [ ] Rotate Stripe API keys
- [ ] Review all secrets for necessity
- [ ] Update documentation with any changes
- [ ] Security audit of CI/CD pipeline

## Additional Resources

- [GitHub Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [OpenAI API Keys Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Stripe API Keys Documentation](https://stripe.com/docs/keys)

---

**Last Updated**: 2024-12-30
