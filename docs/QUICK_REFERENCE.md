# Deployment Quick Reference

Quick reference guide for common deployment tasks and commands.

## Quick Commands

### Local Development

```bash
# Start development server
npm run dev

# Build application
npm run build

# Start production mode locally
npm run start:prod
```

### Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to test
npm run deploy:test

# Deploy to production (requires confirmation)
npm run deploy:prd
```

### Database

```bash
# Seed development database
npm run seed:dev

# Seed test database
npm run seed:test

# Deploy Firestore rules/indexes
firebase use receiptscan-dev
firebase deploy --only firestore
```

### Health Checks

```bash
# Development
curl https://api-dev.receiptscan.ai/api/v1/health

# Test
curl https://api-test.receiptscan.ai/api/v1/health

# Production
curl https://api.receiptscan.ai/api/v1/health
```

## CI/CD Workflows

### Trigger Development Deployment

```bash
git push origin main
```

**Automatic**: Deploys immediately on push to main branch.

### Trigger Test Deployment

1. Go to GitHub Actions
2. Select "Deploy to Test" workflow
3. Click "Run workflow"
4. Type "deploy-test" to confirm
5. Click "Run workflow"

### Trigger Production Deployment

1. Go to GitHub Actions
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Enter version number (e.g., "1.0.0")
5. Type "deploy-production" to confirm
6. Click "Run workflow"

## Rollback

### Production (Instant)

```bash
# List revisions
gcloud run revisions list \
  --service receiptscan-api-prd \
  --region us-central1

# Rollback to previous revision
PREV_REVISION="receiptscan-api-prd-00042-abc"
gcloud run services update-traffic receiptscan-api-prd \
  --to-revisions=$PREV_REVISION=100 \
  --region us-central1

# Verify
curl https://api.receiptscan.ai/api/v1/health
```

### Development/Test

```bash
# Checkout previous version
git checkout <commit-sha>

# Deploy
npm run deploy:dev  # or deploy:test

# Verify
curl https://api-dev.receiptscan.ai/api/v1/health
```

## Firebase Commands

### Switch Projects

```bash
firebase use receiptscan-dev
firebase use receiptscan-test
firebase use receiptscan-prd
```

### Deploy Firestore

```bash
# Rules and indexes
firebase deploy --only firestore

# Just rules
firebase deploy --only firestore:rules

# Just indexes
firebase deploy --only firestore:indexes
```

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

### View Logs

```bash
firebase functions:log --limit 50
```

## Cloud Run Commands

### View Service Status

```bash
gcloud run services describe receiptscan-api-dev --region us-central1
gcloud run services describe receiptscan-api-test --region us-central1
gcloud run services describe receiptscan-api-prd --region us-central1
```

### View Logs

```bash
# Development
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=receiptscan-api-dev" --limit 50 --project receiptscan-dev

# Test
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=receiptscan-api-test" --limit 50 --project receiptscan-test

# Production
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=receiptscan-api-prd" --limit 50 --project receiptscan-prd
```

### View Revisions

```bash
gcloud run revisions list --service receiptscan-api-prd --region us-central1
```

### Update Traffic

```bash
# Gradual rollout (canary)
gcloud run services update-traffic receiptscan-api-prd \
  --to-revisions=new-revision=10,current-revision=90 \
  --region us-central1

# Full traffic to specific revision
gcloud run services update-traffic receiptscan-api-prd \
  --to-revisions=revision-name=100 \
  --region us-central1
```

## Docker Commands

### Build Image

```bash
docker build -t receiptscan-api .
```

### Run Locally

```bash
docker run -p 3000:3000 --env-file .env.development receiptscan-api
```

### Test Container

```bash
# Start container
docker run -d -p 3000:3000 --name test-api --env-file .env.development receiptscan-api

# Check logs
docker logs test-api

# Health check
curl http://localhost:3000/api/v1/health

# Stop and remove
docker stop test-api && docker rm test-api
```

## Monitoring

### Check Service Health

```bash
# Development
curl -f https://api-dev.receiptscan.ai/api/v1/health || echo "Health check failed"

# Test
curl -f https://api-test.receiptscan.ai/api/v1/health || echo "Health check failed"

# Production
curl -f https://api.receiptscan.ai/api/v1/health || echo "Health check failed"
```

### View Metrics

Firebase Console:
- [Development](https://console.firebase.google.com/project/receiptscan-dev)
- [Test](https://console.firebase.google.com/project/receiptscan-test)
- [Production](https://console.firebase.google.com/project/receiptscan-prd)

Cloud Console:
```bash
# Open Cloud Run service page
gcloud run services describe receiptscan-api-prd \
  --region us-central1 \
  --format="value(status.url)"
```

## Environment Variables

### View Current Configuration

```bash
# Development
firebase use receiptscan-dev
firebase functions:config:get

# Cloud Run
gcloud run services describe receiptscan-api-dev \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Update Environment Variable

Update in GitHub Secrets, then redeploy.

## Common Issues

### "Firebase Private Key Invalid"

```bash
# Ensure proper format with newlines
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### "CORS Error"

Check CORS_ORIGINS includes the requesting domain:
```bash
CORS_ORIGINS=https://receiptscan.ai,https://www.receiptscan.ai
```

### "Health Check Failing"

```bash
# Check logs
gcloud logging read "severity>=ERROR" --limit 50

# Verify environment variables
gcloud run services describe receiptscan-api-dev --region us-central1

# Check service status
curl -v https://api-dev.receiptscan.ai/api/v1/health
```

### "Deployment Failed"

```bash
# Check GitHub Actions logs
# Go to Actions tab → Select failed workflow → View logs

# Check Cloud Build logs
gcloud builds list --limit 5

# View specific build
gcloud builds log <BUILD_ID>
```

## Useful Links

### Firebase
- [Console](https://console.firebase.google.com/)
- [Firestore Data](https://console.firebase.google.com/project/receiptscan-prd/firestore)
- [Storage Buckets](https://console.firebase.google.com/project/receiptscan-prd/storage)
- [Authentication](https://console.firebase.google.com/project/receiptscan-prd/authentication)

### Google Cloud
- [Cloud Run](https://console.cloud.google.com/run)
- [Logs Explorer](https://console.cloud.google.com/logs)
- [Monitoring](https://console.cloud.google.com/monitoring)

### External Services
- [OpenAI Dashboard](https://platform.openai.com/usage)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [GitHub Actions](https://github.com/guilhermomg/receiptscan-backend/actions)

## Emergency Procedures

### Production Down

1. **Check health**:
   ```bash
   curl https://api.receiptscan.ai/api/v1/health
   ```

2. **Check logs**:
   ```bash
   gcloud logging read "severity>=ERROR" --limit 50 --project receiptscan-prd
   ```

3. **Rollback immediately**:
   ```bash
   # Get previous revision
   gcloud run revisions list --service receiptscan-api-prd --region us-central1
   
   # Switch traffic
   gcloud run services update-traffic receiptscan-api-prd \
     --to-revisions=PREVIOUS_REVISION=100 \
     --region us-central1
   ```

4. **Verify restoration**:
   ```bash
   curl https://api.receiptscan.ai/api/v1/health
   ```

5. **Notify team and investigate**

### Database Issues

1. **Stop incoming traffic** (if necessary):
   ```bash
   # Scale to 0
   gcloud run services update receiptscan-api-prd \
     --no-traffic \
     --region us-central1
   ```

2. **Assess data integrity**:
   - Check Firestore console
   - Review recent audit logs

3. **Restore from backup** (if needed):
   ```bash
   gcloud firestore import gs://receiptscan-prd-backups/BACKUP_DATE \
     --project receiptscan-prd
   ```

4. **Restore traffic**:
   ```bash
   gcloud run services update receiptscan-api-prd \
     --to-revisions=LATEST=100 \
     --region us-central1
   ```

### Security Incident

1. **Revoke compromised credentials immediately**
2. **Generate new credentials**
3. **Update GitHub Secrets**
4. **Redeploy all environments**
5. **Audit access logs**
6. **Document incident**

## Daily Checklist

- [ ] Check deployment pipeline status
- [ ] Review error logs
- [ ] Verify health checks passing
- [ ] Monitor API usage (Firebase, OpenAI, Stripe)
- [ ] Check for security alerts

## Weekly Checklist

- [ ] Review Cloud Run metrics
- [ ] Check Firestore usage and costs
- [ ] Review GitHub Actions usage
- [ ] Update dependencies if needed
- [ ] Test backup/restore procedures

## Monthly Checklist

- [ ] Rotate development API keys
- [ ] Review and update secrets
- [ ] Audit access logs
- [ ] Update documentation
- [ ] Test disaster recovery procedures

---

For detailed procedures, see:
- [Deployment Guide](./DEPLOYMENT.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Environment Configuration](./ENVIRONMENT_CONFIG.md)
- [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md)

---

**Last Updated**: 2024-12-30
