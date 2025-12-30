# Rollback Procedures

This document provides step-by-step procedures for rolling back deployments to previous versions in case of issues.

## Table of Contents

- [Overview](#overview)
- [When to Rollback](#when-to-rollback)
- [Rollback Strategies](#rollback-strategies)
- [Quick Rollback Guide](#quick-rollback-guide)
- [Environment-Specific Procedures](#environment-specific-procedures)
- [Post-Rollback Steps](#post-rollback-steps)
- [Prevention](#prevention)

## Overview

The receiptscan-backend uses a blue-green deployment strategy for production, allowing for quick rollbacks with zero downtime. For development and test environments, rollbacks can be performed by redeploying a previous version.

### Rollback Capabilities

| Environment | Strategy | Downtime | Time to Rollback |
|------------|----------|----------|------------------|
| Development | Redeploy previous version | ~2-3 minutes | ~5 minutes |
| Test | Redeploy previous version | ~2-3 minutes | ~5 minutes |
| Production | Blue-green (instant traffic switch) | Zero downtime | ~30 seconds |

## When to Rollback

Consider rolling back when:

1. **Critical bugs** affecting core functionality
2. **Security vulnerabilities** introduced in new version
3. **Performance degradation** (increased latency, errors)
4. **Data integrity issues** or corruption
5. **Failed health checks** or service unavailability
6. **Integration failures** with external services (Firebase, OpenAI, Stripe)
7. **High error rates** (>5% of requests)

## Rollback Strategies

### 1. Production: Blue-Green Traffic Switch (Recommended)

The production deployment keeps previous revisions available for instant rollback.

**Advantages**:
- Zero downtime
- Instant rollback (30 seconds)
- Can revert multiple times
- Previous revision tested and verified

**Process**:
1. Identify previous working revision
2. Route 100% traffic to previous revision
3. Verify health checks
4. Monitor for issues

### 2. Redeploy Previous Version

Deploy a specific previous version from Git history.

**Advantages**:
- Works for all environments
- Full control over version
- Can skip problematic versions

**Process**:
1. Checkout previous working commit/tag
2. Run deployment for specific environment
3. Verify deployment
4. Monitor health

### 3. Database Rollback

If database changes need to be reverted.

**Advantages**:
- Restores data state
- Can fix data corruption

**Disadvantages**:
- Potential data loss
- Requires backup
- Time-consuming

**Process**:
1. Stop application traffic
2. Restore from backup/snapshot
3. Redeploy compatible application version
4. Verify data integrity

## Quick Rollback Guide

### Production (Emergency)

```bash
# 1. List Cloud Run revisions
gcloud run revisions list \
  --service receiptscan-api-prd \
  --region us-central1 \
  --project receiptscan-prd

# 2. Identify last known good revision (e.g., receiptscan-api-prd-00042-abc)
GOOD_REVISION="receiptscan-api-prd-00042-abc"

# 3. Route 100% traffic to previous revision (INSTANT)
gcloud run services update-traffic receiptscan-api-prd \
  --to-revisions=$GOOD_REVISION=100 \
  --region us-central1 \
  --project receiptscan-prd

# 4. Verify health check
curl https://api.receiptscan.ai/api/v1/health

# 5. Monitor logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --project receiptscan-prd
```

**Time to complete**: ~30 seconds

### Development/Test (Redeploy)

```bash
# 1. Identify working version
git log --oneline

# 2. Checkout previous version
git checkout <commit-sha>

# 3. Run deployment script
./scripts/deploy.sh dev  # or test

# 4. Verify health check
curl https://api-dev.receiptscan.ai/api/v1/health
```

**Time to complete**: ~5 minutes

## Environment-Specific Procedures

### Production Rollback (Detailed)

#### Step 1: Assess the Situation

```bash
# Check current health
curl https://api.receiptscan.ai/api/v1/health

# Check error rates in logs
gcloud logging read "severity>=ERROR" \
  --limit 100 \
  --project receiptscan-prd

# Check Cloud Run metrics
gcloud run services describe receiptscan-api-prd \
  --region us-central1 \
  --project receiptscan-prd
```

#### Step 2: Notify Team

Send notification:
```
🚨 PRODUCTION ROLLBACK INITIATED
Reason: [Brief description]
Current version: [version]
Target version: [previous version]
ETA: 1 minute
```

#### Step 3: Execute Rollback

```bash
# List revisions with traffic allocation
gcloud run revisions list \
  --service receiptscan-api-prd \
  --region us-central1 \
  --project receiptscan-prd \
  --format="table(metadata.name, metadata.creationTimestamp, status.traffic[0].percent)"

# Identify previous working revision
# Revisions are named: receiptscan-api-prd-00001-xxx, receiptscan-api-prd-00002-yyy, etc.
PREVIOUS_REVISION="receiptscan-api-prd-00042-abc"

# Switch traffic immediately (blue-green)
gcloud run services update-traffic receiptscan-api-prd \
  --to-revisions=$PREVIOUS_REVISION=100 \
  --region us-central1 \
  --project receiptscan-prd

echo "✅ Traffic switched to $PREVIOUS_REVISION"
```

#### Step 4: Verify Rollback

```bash
# Health check
curl https://api.receiptscan.ai/api/v1/health

# Expected response should show previous version
# {
#   "status": "ok",
#   "environment": "prd",
#   "version": "1.0.0",  // Previous version
#   "deployment": {
#     "commitSha": "abc123..."  // Previous commit
#   }
# }

# Monitor error rates
gcloud logging read "severity>=ERROR" \
  --limit 50 \
  --project receiptscan-prd

# Check key endpoints
curl https://api.receiptscan.ai/api/v1/auth/me \
  -H "Authorization: Bearer <test-token>"
```

#### Step 5: Monitor

Monitor for 15-30 minutes:
- Error rates
- Request latency
- User feedback
- External service integrations

#### Step 6: Post-Rollback

```bash
# Tag the problematic version for investigation
git tag -a "v1.1.0-rollback" -m "Rolled back due to [reason]"
git push origin v1.1.0-rollback

# Document incident
# Update INCIDENTS.md with:
# - Date/time of rollback
# - Reason
# - Version rolled back from/to
# - Root cause (if known)
# - Lessons learned
```

### Development/Test Rollback (Detailed)

#### Via Git

```bash
# 1. Find the commit to rollback to
git log --oneline --graph --decorate

# 2. Checkout the previous working commit
git checkout <commit-sha>

# 3. Create a rollback branch
git checkout -b rollback/revert-issue-xyz

# 4. Deploy
./scripts/deploy.sh dev  # or test

# 5. Verify
curl https://api-dev.receiptscan.ai/api/v1/health

# 6. If successful, merge rollback
git checkout main
git merge rollback/revert-issue-xyz
git push origin main
```

#### Via GitHub Actions

```bash
# Trigger deployment workflow for specific commit
1. Go to GitHub Actions
2. Select "Deploy to Development" or "Deploy to Test"
3. Click "Run workflow"
4. Select branch/tag of previous working version
5. Run workflow
```

### Database Rollback

⚠️ **USE WITH EXTREME CAUTION - POTENTIAL DATA LOSS**

#### Firestore Rollback

Firestore doesn't support automatic snapshots, but you can restore from exports:

```bash
# If you have a backup export
gcloud firestore import gs://receiptscan-prd-backups/2024-01-15 \
  --project receiptscan-prd

# Note: Create regular exports using:
gcloud firestore export gs://receiptscan-prd-backups/$(date +%Y-%m-%d) \
  --project receiptscan-prd
```

#### Cloud Storage Rollback

Cloud Storage supports object versioning:

```bash
# List object versions
gsutil ls -a gs://receiptscan-prd.appspot.com/receipts/

# Restore specific version
gsutil cp gs://receiptscan-prd.appspot.com/receipts/file.jpg#1234567890 \
  gs://receiptscan-prd.appspot.com/receipts/file.jpg
```

## Post-Rollback Steps

### 1. Root Cause Analysis

Document the issue:
- What went wrong?
- When was it detected?
- What was the impact?
- How was it resolved?

### 2. Update Team

Send notification:
```
✅ PRODUCTION ROLLBACK COMPLETE
Previous version restored: [version]
Current status: Stable
Impact duration: [X minutes]
Root cause: [Description]
Follow-up: [Action items]
```

### 3. Create Incident Report

Document in `docs/INCIDENTS.md`:

```markdown
## Incident: [Date] - [Brief Description]

**Timeline**:
- [Time] - Issue detected
- [Time] - Rollback initiated
- [Time] - Rollback completed
- [Time] - Service stable

**Impact**:
- Duration: X minutes
- Affected users: ~X
- Error rate: X%

**Root Cause**:
[Detailed explanation]

**Resolution**:
Rolled back from v1.1.0 to v1.0.0

**Action Items**:
- [ ] Fix bug in v1.1.0
- [ ] Add test coverage
- [ ] Update deployment checklist
```

### 4. Fix and Redeploy

```bash
# Fix the issue
git checkout main
git revert <problematic-commit>

# Test thoroughly
npm run lint
npm run build
npm test

# Deploy to dev first
./scripts/deploy.sh dev

# Test in dev
[Run manual tests]

# Deploy to test
./scripts/deploy.sh test

# Test in test environment
[Run manual tests]

# Deploy to production when ready
# Via GitHub Actions with proper approval
```

## Prevention

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Linter passes
- [ ] Code review completed
- [ ] Tested in development
- [ ] Tested in test environment
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Health checks verified

### Automated Safeguards

1. **Health checks** in CI/CD pipeline
2. **Smoke tests** after deployment
3. **Blue-green deployment** for production
4. **Automated rollback** on failed health checks (consider implementing)
5. **Canary deployments** (consider implementing for gradual rollout)

### Regular Backups

Schedule automated backups:

```bash
# Firestore daily export (add to cron or Cloud Scheduler)
gcloud firestore export gs://receiptscan-prd-backups/$(date +%Y-%m-%d) \
  --project receiptscan-prd

# Cloud Storage versioning
gsutil versioning set on gs://receiptscan-prd.appspot.com
```

### Monitoring and Alerts

Configure alerts for:
- Error rate > 5%
- Latency P95 > 2 seconds
- Health check failures
- Failed deployments
- High memory/CPU usage

## Common Rollback Scenarios

### Scenario 1: Breaking API Change

**Symptoms**: Frontend errors, 400/500 responses

**Solution**:
1. Immediate production rollback (blue-green)
2. Fix API compatibility
3. Redeploy with proper versioning

### Scenario 2: Database Migration Issue

**Symptoms**: Data corruption, Firestore errors

**Solution**:
1. Stop application (maintenance mode)
2. Restore database from backup
3. Rollback application to compatible version
4. Fix migration
5. Test thoroughly before redeploying

### Scenario 3: External Service Integration Failure

**Symptoms**: OpenAI/Stripe/Firebase errors

**Solution**:
1. Check service status
2. Verify credentials/configuration
3. If new integration: rollback
4. If credential rotation: update secrets and redeploy

### Scenario 4: Performance Degradation

**Symptoms**: Slow response times, timeouts

**Solution**:
1. Check resource usage (CPU/memory)
2. Review recent code changes
3. Rollback if caused by new code
4. Scale resources if needed
5. Optimize and redeploy

## Testing Rollback Procedures

Schedule quarterly rollback drills:

```bash
# Practice rollback in dev/test
1. Deploy current version
2. Deploy new test version
3. Perform rollback
4. Verify functionality
5. Document any issues with procedure
```

## Emergency Contacts

- **DevOps Lead**: [Contact]
- **Tech Lead**: [Contact]
- **On-Call Engineer**: [Contact]
- **Firebase Support**: https://firebase.google.com/support

## References

- [Deployment Guide](./DEPLOYMENT.md)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**Last Updated**: 2024-12-30
