# Rollback Procedures

This document outlines the procedures for rolling back deployments in case of issues.

## Table of Contents

1. [Overview](#overview)
2. [When to Rollback](#when-to-rollback)
3. [Automated Rollback](#automated-rollback)
4. [Manual Rollback](#manual-rollback)
5. [Emergency Procedures](#emergency-procedures)
6. [Post-Rollback Actions](#post-rollback-actions)
7. [Prevention Strategies](#prevention-strategies)

## Overview

Our deployment strategy includes rollback capabilities for all three environments:
- **Development**: Quick rollback for testing
- **Test**: Structured rollback with validation
- **Production**: Blue-Green deployment with traffic switching

## When to Rollback

Consider rolling back when:

- ✗ Health checks are failing consistently
- ✗ Error rates spike significantly (>5% of requests)
- ✗ Critical functionality is broken
- ✗ Database migrations fail
- ✗ Security vulnerabilities are discovered
- ✗ Performance degradation is severe (>50% slower)
- ✗ Service is unavailable or timing out

## Automated Rollback

### Using the Rollback Script

The quickest way to rollback is using our automated script:

```bash
./scripts/rollback.sh <environment> <version>
```

**Examples:**

```bash
# Rollback development to previous version
./scripts/rollback.sh dev v1.0.0

# Rollback test environment
./scripts/rollback.sh test v1.0.0

# Rollback production (use with extreme caution)
./scripts/rollback.sh prd v1.0.0
```

**What the script does:**
1. Switches to the appropriate Firebase project
2. Deletes the current function
3. Redeploys the specified version
4. Runs health checks
5. Reports status

### Using Firebase CLI

```bash
# List available versions
firebase use <environment>
firebase functions:list

# View deployment history
firebase functions:log --only api

# Rollback to specific version
git checkout <version-tag>
npm run deploy:<environment>
```

## Manual Rollback

### Development Environment

**Scenario**: Bad deployment to dev environment

**Steps:**

1. **Identify the issue**
   ```bash
   firebase use dev
   firebase functions:log --only api
   ```

2. **Find the last working version**
   ```bash
   git log --oneline
   # Look for the last successful deployment commit
   ```

3. **Checkout the working version**
   ```bash
   git checkout <commit-hash>
   ```

4. **Redeploy**
   ```bash
   npm run deploy:dev
   ```

5. **Verify**
   ```bash
   curl https://api-dev.receiptscan.ai/health
   ```

**Time Estimate**: 5-10 minutes

### Test Environment

**Scenario**: Failed deployment to test environment

**Steps:**

1. **Assess the impact**
   ```bash
   firebase use test
   firebase functions:log --only api
   curl https://api-test.receiptscan.ai/health
   ```

2. **Notify stakeholders**
   - Post in #engineering channel
   - Update status page if applicable

3. **Execute rollback**
   ```bash
   git checkout <last-working-version>
   npm run deploy:test
   ```

4. **Run smoke tests**
   ```bash
   curl https://api-test.receiptscan.ai/
   curl https://api-test.receiptscan.ai/health
   curl https://api-test.receiptscan.ai/readiness
   ```

5. **Document the incident**
   - What went wrong
   - What was rolled back
   - Current status

**Time Estimate**: 10-15 minutes

### Production Environment

**Scenario**: Critical issue in production

**⚠️ PRODUCTION ROLLBACK IS SERIOUS - FOLLOW THESE STEPS CAREFULLY**

#### Step 1: Assessment (2-3 minutes)

1. **Verify the issue is real**
   ```bash
   # Check health endpoint
   curl https://api.receiptscan.ai/health
   
   # Check error rates in Firebase Console
   # Check monitoring dashboards
   ```

2. **Determine severity**
   - Critical: Service down or data corruption
   - High: Major features broken
   - Medium: Minor features affected
   - Low: Non-critical issues

3. **Decision point**: If severity is Medium or higher, proceed with rollback

#### Step 2: Communication (1-2 minutes)

1. **Alert the team**
   ```
   @channel PRODUCTION ROLLBACK IN PROGRESS
   Issue: [Brief description]
   ETA: 15 minutes
   Current status: [Status page link]
   ```

2. **Update status page** (if available)
   - Set status to "Major Outage" or "Partial Outage"
   - Provide brief description

#### Step 3: Execute Rollback (5-10 minutes)

**Option A: Using Blue-Green (Recommended)**

If the previous version is still in the blue environment:

1. **Switch traffic back to green (previous version)**
   ```bash
   firebase use prd
   # Use Firebase Console to redirect traffic
   # OR redeploy the previous version to live
   ```

2. **Verify immediately**
   ```bash
   curl https://api.receiptscan.ai/health
   ```

**Option B: Full Redeployment**

If you need to redeploy a previous version:

1. **Checkout the last stable version**
   ```bash
   git fetch --tags
   git tag -l | tail -5  # View recent tags
   git checkout <last-stable-tag>
   ```

2. **Verify you have the right version**
   ```bash
   git log -1
   git diff HEAD <current-prod-version>
   ```

3. **Deploy**
   ```bash
   npm ci  # Clean install
   npm run build
   npm run deploy:prd
   ```

4. **Monitor deployment**
   ```bash
   # Watch logs in Firebase Console
   firebase functions:log --only api
   ```

#### Step 4: Verification (3-5 minutes)

1. **Run health checks**
   ```bash
   curl https://api.receiptscan.ai/health
   curl https://api.receiptscan.ai/readiness
   ```

2. **Test critical paths**
   ```bash
   # Test main API endpoint
   curl https://api.receiptscan.ai/
   
   # Test authentication (if applicable)
   # Test database connectivity
   ```

3. **Monitor metrics**
   - Check error rates
   - Check response times
   - Check user reports

#### Step 5: Communication (2 minutes)

1. **Announce rollback completion**
   ```
   @channel PRODUCTION ROLLBACK COMPLETE
   Rolled back to: <version>
   Current status: Stable
   Health check: ✓ Passing
   Next steps: Post-mortem scheduled for [time]
   ```

2. **Update status page**
   - Set status to "Monitoring" or "Operational"
   - Provide update on resolution

**Total Time Estimate**: 15-25 minutes

## Emergency Procedures

### Total Service Outage

If the service is completely down and automated rollback fails:

1. **Immediate action**
   ```bash
   # Stop all functions
   firebase use prd
   firebase functions:delete api --force
   ```

2. **Deploy emergency version**
   ```bash
   # Use last known stable version
   git checkout <emergency-stable-tag>
   npm ci
   npm run build
   firebase deploy --only functions
   ```

3. **Bypass CI/CD if necessary**
   - Use Firebase Console to deploy directly
   - Upload pre-built function code

### Database Migration Failure

If a database migration caused the issue:

1. **Stop the application**
   ```bash
   firebase functions:delete api --force
   ```

2. **Assess database state**
   ```bash
   firebase use prd
   # Check Firestore in console
   # Verify data integrity
   ```

3. **Rollback database if needed**
   - Restore from backup (if available)
   - Run reverse migration script
   - Fix data manually if small scale

4. **Redeploy previous version**
   ```bash
   git checkout <pre-migration-version>
   npm run deploy:prd
   ```

### Configuration Issue

If environment variables or configuration are wrong:

1. **Update configuration**
   ```bash
   # Fix .env.prd file
   # OR update GitHub Secrets
   ```

2. **Redeploy current version**
   ```bash
   npm run deploy:prd
   ```

3. **Verify configuration**
   ```bash
   curl https://api.receiptscan.ai/health
   # Check environment section
   ```

## Post-Rollback Actions

### Immediate (Within 1 hour)

- [ ] Verify service is stable
- [ ] Monitor error rates for 30 minutes
- [ ] Check user reports and support tickets
- [ ] Update team on status
- [ ] Document what happened

### Short-term (Within 24 hours)

- [ ] Schedule post-mortem meeting
- [ ] Create detailed incident report
- [ ] Identify root cause
- [ ] Create tickets to fix underlying issues
- [ ] Update runbooks if needed

### Long-term (Within 1 week)

- [ ] Implement fixes for root cause
- [ ] Add tests to prevent recurrence
- [ ] Update deployment procedures
- [ ] Improve monitoring/alerting
- [ ] Share learnings with team

## Prevention Strategies

### Before Deployment

- ✓ Run full test suite
- ✓ Test in development environment first
- ✓ Test in test environment before production
- ✓ Review changes carefully
- ✓ Check for breaking changes
- ✓ Verify database migrations work
- ✓ Check environment variables are correct

### During Deployment

- ✓ Use blue-green deployment
- ✓ Monitor logs in real-time
- ✓ Run health checks immediately
- ✓ Test critical functionality
- ✓ Keep previous version ready
- ✓ Have team member available for rollback

### After Deployment

- ✓ Monitor for 30 minutes
- ✓ Check error rates
- ✓ Check performance metrics
- ✓ Review user feedback
- ✓ Document any issues
- ✓ Keep team on standby

## Rollback Checklist

Use this checklist for production rollbacks:

```markdown
## Pre-Rollback
- [ ] Issue severity confirmed (Medium/High/Critical)
- [ ] Team notified
- [ ] Status page updated
- [ ] Last stable version identified: ___________

## Rollback Execution
- [ ] Checked out correct version
- [ ] Dependencies installed
- [ ] Build completed successfully
- [ ] Deployment initiated
- [ ] Deployment completed

## Verification
- [ ] Health check passing
- [ ] Readiness check passing
- [ ] Critical paths tested
- [ ] Error rates normal
- [ ] Response times acceptable

## Communication
- [ ] Team notified of completion
- [ ] Status page updated
- [ ] Users informed (if needed)
- [ ] Post-mortem scheduled

## Documentation
- [ ] Incident documented
- [ ] Root cause identified
- [ ] Tickets created for fixes
- [ ] Runbook updated (if needed)
```

## Contact Information

### Escalation Path

1. **On-call Engineer**: Check PagerDuty schedule
2. **Engineering Lead**: [Contact info]
3. **CTO**: [Contact info]

### Support Channels

- Slack: #engineering
- Email: engineering@receiptscan.ai
- Phone: [Emergency contact]

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2024-01-15 | Initial version | DevOps Team |

---

**Remember**: It's better to rollback quickly than to debug in production. When in doubt, rollback first, then investigate.
