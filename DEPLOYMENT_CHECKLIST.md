# Deployment Setup Checklist

Use this checklist when setting up the multi-environment deployment infrastructure for the first time.

## Prerequisites ✓

### Required Accounts
- [ ] Google Cloud Platform account with billing enabled
- [ ] Firebase account (linked to GCP)
- [ ] GitHub account with repository access
- [ ] OpenAI account with API access
- [ ] Stripe account (for billing features)

### Required Tools
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Google Cloud SDK installed: `gcloud` command available
- [ ] Docker installed (for local testing)
- [ ] Node.js 18+ and npm 9+

## Phase 1: Firebase Projects Setup

### Development Environment
- [ ] Create Firebase project: `receiptscan-dev`
- [ ] Enable Firestore Database
- [ ] Enable Cloud Storage
- [ ] Enable Authentication
- [ ] Generate service account key (download JSON)
- [ ] Note project ID, client email, private key, storage bucket

### Test Environment
- [ ] Create Firebase project: `receiptscan-test`
- [ ] Enable Firestore Database
- [ ] Enable Cloud Storage
- [ ] Enable Authentication
- [ ] Generate service account key (download JSON)
- [ ] Note project ID, client email, private key, storage bucket

### Production Environment
- [ ] Create Firebase project: `receiptscan-prd`
- [ ] Enable Firestore Database
- [ ] Enable Cloud Storage
- [ ] Enable Authentication
- [ ] Generate service account key (download JSON)
- [ ] Note project ID, client email, private key, storage bucket

## Phase 2: Firebase Configuration

### Deploy Firestore Rules & Indexes

#### Development
```bash
firebase use receiptscan-dev
firebase deploy --only firestore
firebase deploy --only storage
```
- [ ] Firestore rules deployed to dev
- [ ] Firestore indexes deployed to dev
- [ ] Storage rules deployed to dev

#### Test
```bash
firebase use receiptscan-test
firebase deploy --only firestore
firebase deploy --only storage
```
- [ ] Firestore rules deployed to test
- [ ] Firestore indexes deployed to test
- [ ] Storage rules deployed to test

#### Production
```bash
firebase use receiptscan-prd
firebase deploy --only firestore
firebase deploy --only storage
```
- [ ] Firestore rules deployed to prd
- [ ] Firestore indexes deployed to prd
- [ ] Storage rules deployed to prd

### Verify Configuration
- [ ] Test Firestore read/write in dev
- [ ] Test Storage upload in dev
- [ ] Verify indexes are being built

## Phase 3: External Services Setup

### OpenAI

#### Create API Keys
- [ ] Create API key for development: `receiptscan-dev-key`
- [ ] Create API key for test: `receiptscan-test-key`
- [ ] Create API key for production: `receiptscan-prod-key`
- [ ] Set usage limits on each key
- [ ] Note all three API keys

### Stripe

#### Development/Test (Test Mode)
- [ ] Switch Stripe to Test Mode
- [ ] Copy test Secret Key (sk_test_...)
- [ ] Create "Pro Subscription" product ($9/month)
- [ ] Copy test Price ID (price_test_...)
- [ ] Setup webhook for dev: `https://api-dev.receiptscan.ai/api/v1/billing/webhook`
- [ ] Setup webhook for test: `https://api-test.receiptscan.ai/api/v1/billing/webhook`
- [ ] Copy webhook signing secrets
- [ ] Select webhook events: checkout.session.completed, customer.subscription.*, invoice.*

#### Production (Live Mode)
- [ ] Switch Stripe to Live Mode
- [ ] Copy live Secret Key (sk_live_...)
- [ ] Create "Pro Subscription" product ($9/month) in live mode
- [ ] Copy live Price ID (price_...)
- [ ] Setup webhook for prod: `https://api.receiptscan.ai/api/v1/billing/webhook`
- [ ] Copy webhook signing secret
- [ ] Select webhook events: checkout.session.completed, customer.subscription.*, invoice.*

### Firebase CI Token
```bash
firebase login:ci
```
- [ ] Generate Firebase CI token
- [ ] Note token for GitHub Secrets

## Phase 4: GitHub Secrets Configuration

### Development Secrets (11 total)
- [ ] `DEV_CORS_ORIGINS`: e.g., `http://localhost:3001,https://dev.receiptscan.ai`
- [ ] `DEV_FIREBASE_PROJECT_ID`: `receiptscan-dev`
- [ ] `DEV_FIREBASE_CLIENT_EMAIL`: Service account email from JSON
- [ ] `DEV_FIREBASE_PRIVATE_KEY`: Private key from JSON (include header/footer)
- [ ] `DEV_FIREBASE_STORAGE_BUCKET`: `receiptscan-dev.appspot.com`
- [ ] `DEV_OPENAI_API_KEY`: OpenAI dev key
- [ ] `DEV_STRIPE_SECRET_KEY`: Stripe test key (sk_test_...)
- [ ] `DEV_STRIPE_WEBHOOK_SECRET`: Dev webhook secret
- [ ] `DEV_STRIPE_PRO_PRICE_ID`: Test price ID (price_test_...)
- [ ] `DEV_FRONTEND_URL`: `http://localhost:3001`
- [ ] `DEV_GCP_SA_KEY`: Full service account JSON

### Test Secrets (11 total)
- [ ] `TEST_CORS_ORIGINS`: e.g., `https://test.receiptscan.ai`
- [ ] `TEST_FIREBASE_PROJECT_ID`: `receiptscan-test`
- [ ] `TEST_FIREBASE_CLIENT_EMAIL`: Service account email from JSON
- [ ] `TEST_FIREBASE_PRIVATE_KEY`: Private key from JSON
- [ ] `TEST_FIREBASE_STORAGE_BUCKET`: `receiptscan-test.appspot.com`
- [ ] `TEST_OPENAI_API_KEY`: OpenAI test key
- [ ] `TEST_STRIPE_SECRET_KEY`: Stripe test key
- [ ] `TEST_STRIPE_WEBHOOK_SECRET`: Test webhook secret
- [ ] `TEST_STRIPE_PRO_PRICE_ID`: Test price ID
- [ ] `TEST_FRONTEND_URL`: `https://test.receiptscan.ai`
- [ ] `TEST_GCP_SA_KEY`: Full service account JSON

### Production Secrets (11 total)
- [ ] `PRD_CORS_ORIGINS`: e.g., `https://receiptscan.ai,https://www.receiptscan.ai`
- [ ] `PRD_FIREBASE_PROJECT_ID`: `receiptscan-prd`
- [ ] `PRD_FIREBASE_CLIENT_EMAIL`: Service account email from JSON
- [ ] `PRD_FIREBASE_PRIVATE_KEY`: Private key from JSON
- [ ] `PRD_FIREBASE_STORAGE_BUCKET`: `receiptscan-prd.appspot.com`
- [ ] `PRD_OPENAI_API_KEY`: OpenAI production key
- [ ] `PRD_STRIPE_SECRET_KEY`: Stripe live key (sk_live_...)
- [ ] `PRD_STRIPE_WEBHOOK_SECRET`: Production webhook secret
- [ ] `PRD_STRIPE_PRO_PRICE_ID`: Live price ID (price_...)
- [ ] `PRD_FRONTEND_URL`: `https://receiptscan.ai`
- [ ] `PRD_GCP_SA_KEY`: Full service account JSON

### Shared Secrets (1 total)
- [ ] `FIREBASE_TOKEN`: Token from `firebase login:ci`

**Total Secrets: 34** (11 dev + 11 test + 11 prd + 1 shared)

## Phase 5: Cloud Run Setup

### Development Service
- [ ] Create Cloud Run service: `receiptscan-api-dev`
- [ ] Set region: `us-central1`
- [ ] Allow unauthenticated access
- [ ] Configure custom domain: `api-dev.receiptscan.ai` (optional)

### Test Service
- [ ] Create Cloud Run service: `receiptscan-api-test`
- [ ] Set region: `us-central1`
- [ ] Allow unauthenticated access
- [ ] Configure custom domain: `api-test.receiptscan.ai` (optional)

### Production Service
- [ ] Create Cloud Run service: `receiptscan-api-prd`
- [ ] Set region: `us-central1`
- [ ] Allow unauthenticated access
- [ ] Configure custom domain: `api.receiptscan.ai` (required)
- [ ] Configure SSL certificate
- [ ] Set up Cloud CDN (optional)

## Phase 6: DNS Configuration

### Development Domain
- [ ] Create A record: `api-dev.receiptscan.ai` → Cloud Run IP
- [ ] Verify SSL certificate
- [ ] Test: `curl https://api-dev.receiptscan.ai`

### Test Domain
- [ ] Create A record: `api-test.receiptscan.ai` → Cloud Run IP
- [ ] Verify SSL certificate
- [ ] Test: `curl https://api-test.receiptscan.ai`

### Production Domain
- [ ] Create A record: `api.receiptscan.ai` → Cloud Run IP
- [ ] Verify SSL certificate
- [ ] Test: `curl https://api.receiptscan.ai`

## Phase 7: Initial Deployment

### Test GitHub Actions

#### Development Deployment
```bash
git checkout main
git push origin main
```
- [ ] Development workflow triggers automatically
- [ ] Build succeeds
- [ ] Deployment succeeds
- [ ] Health check passes
- [ ] Verify: `curl https://api-dev.receiptscan.ai/api/v1/health`

#### Test Deployment
1. Go to GitHub Actions
2. Select "Deploy to Test"
3. Run workflow with confirmation
- [ ] Test workflow completes successfully
- [ ] Deployment succeeds
- [ ] Health check passes
- [ ] Verify: `curl https://api-test.receiptscan.ai/api/v1/health`

#### Production Deployment (First Release)
1. Go to GitHub Actions
2. Select "Deploy to Production"
3. Enter version: `1.0.0`
4. Type confirmation: `deploy-production`
5. Run workflow
- [ ] Production workflow completes successfully
- [ ] Blue-green deployment succeeds
- [ ] Smoke tests pass
- [ ] Traffic routes to new revision
- [ ] Health check passes
- [ ] Verify: `curl https://api.receiptscan.ai/api/v1/health`
- [ ] Git tag `v1.0.0` created

## Phase 8: Monitoring Setup

### Firebase Console
- [ ] Set up billing alerts for Firestore
- [ ] Set up billing alerts for Storage
- [ ] Configure Authentication monitoring
- [ ] Review security rules

### Cloud Run
- [ ] Configure error rate alerts (>5%)
- [ ] Configure latency alerts (P95 >2s)
- [ ] Configure memory usage alerts (>80%)
- [ ] Set up log-based metrics

### External Services
- [ ] Configure OpenAI usage alerts
- [ ] Configure Stripe event monitoring
- [ ] Set up failed payment alerts

### Health Check Monitoring
- [ ] Set up external monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Monitor all three environments
- [ ] Configure email/Slack notifications

## Phase 9: Security Verification

### Access Control
- [ ] Review GitHub repository permissions
- [ ] Enable branch protection on `main`
- [ ] Require code review for PRs
- [ ] Enable two-factor authentication for all team members

### Secrets Security
- [ ] Verify no secrets in source code
- [ ] Audit GitHub Secrets access
- [ ] Document secret rotation schedule
- [ ] Set calendar reminders for quarterly rotation

### Firestore Security
- [ ] Test Firestore rules with authenticated requests
- [ ] Test Firestore rules with unauthenticated requests
- [ ] Verify users can only access their own data
- [ ] Test admin role permissions

### API Security
- [ ] Verify CORS only allows approved origins
- [ ] Test rate limiting
- [ ] Verify authentication on protected endpoints
- [ ] Test abuse detection

## Phase 10: Documentation & Training

### Team Documentation
- [ ] Share `DEPLOYMENT_SUMMARY.md` with team
- [ ] Share `docs/QUICK_REFERENCE.md` for daily use
- [ ] Share `docs/ROLLBACK.md` for emergencies
- [ ] Share `docs/GITHUB_SECRETS_SETUP.md` for reference

### Runbooks
- [ ] Create incident response runbook
- [ ] Document escalation procedures
- [ ] Create on-call schedule
- [ ] Set up team communication channels

### Training
- [ ] Train team on deployment process
- [ ] Practice rollback procedures
- [ ] Review monitoring dashboards
- [ ] Test emergency procedures

## Phase 11: Testing & Validation

### Functional Testing

#### Development Environment
- [ ] Test user registration
- [ ] Test receipt upload
- [ ] Test receipt parsing
- [ ] Test billing webhook
- [ ] Test export functionality

#### Test Environment
- [ ] Run full regression test suite
- [ ] Test integration with frontend
- [ ] Test Stripe checkout flow
- [ ] Verify webhook handling
- [ ] Test rate limiting

#### Production Environment
- [ ] Smoke test all critical endpoints
- [ ] Verify monitoring alerts work
- [ ] Test health check endpoint
- [ ] Verify SSL/TLS configuration
- [ ] Test CORS with actual frontend

### Performance Testing
- [ ] Load test development environment
- [ ] Measure API response times
- [ ] Test concurrent user scenarios
- [ ] Verify database query performance
- [ ] Test Cloud Storage performance

## Phase 12: Final Checks

### Pre-Production Checklist
- [ ] All GitHub Secrets configured correctly
- [ ] All three environments deployed and healthy
- [ ] DNS and SSL configured
- [ ] Monitoring and alerts active
- [ ] Team trained on procedures
- [ ] Backup and recovery tested
- [ ] Security audit completed
- [ ] Performance benchmarks established

### Production Go-Live
- [ ] Deploy production version
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Monitor external service usage
- [ ] Confirm billing is working
- [ ] Announce to team

## Post-Deployment

### Week 1
- [ ] Monitor deployments daily
- [ ] Review logs for errors
- [ ] Track API usage
- [ ] Collect team feedback
- [ ] Document any issues

### Month 1
- [ ] Review and optimize costs
- [ ] Tune performance if needed
- [ ] Update documentation based on experience
- [ ] Schedule first secret rotation
- [ ] Conduct first rollback drill

### Ongoing
- [ ] Monthly secret rotation review
- [ ] Quarterly disaster recovery test
- [ ] Regular security audits
- [ ] Keep documentation updated
- [ ] Monitor and optimize costs

## Completion

✅ When all items are checked, your multi-environment deployment infrastructure is fully operational!

## Support Resources

- **DEPLOYMENT.md**: Complete deployment procedures
- **ROLLBACK.md**: Emergency rollback procedures
- **ENVIRONMENT_CONFIG.md**: Configuration reference
- **GITHUB_SECRETS_SETUP.md**: Secrets setup guide
- **QUICK_REFERENCE.md**: Daily command reference
- **DEPLOYMENT_SUMMARY.md**: Implementation overview

## Questions?

Refer to the comprehensive documentation in the `docs/` folder or contact the DevOps team.

---

**Document Version**: 1.0.0
**Last Updated**: 2024-12-30
