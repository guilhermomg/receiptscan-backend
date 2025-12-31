# Troubleshooting Guide

This guide helps you solve common issues when developing or running receiptscan-backend.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Authentication Issues](#authentication-issues)
- [Firebase Issues](#firebase-issues)
- [OpenAI Integration Issues](#openai-integration-issues)
- [Stripe Integration Issues](#stripe-integration-issues)
- [Development Issues](#development-issues)
- [Testing Issues](#testing-issues)
- [Deployment Issues](#deployment-issues)

## Setup Issues

### Issue: `npm install` fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use correct Node.js version**:
   ```bash
   node --version  # Should be >= 18.x
   nvm use 18      # If using nvm
   ```

3. **Force install** (last resort):
   ```bash
   npm install --legacy-peer-deps
   ```

### Issue: Environment variables not loading

**Symptoms**:
```
Error: FIREBASE_PROJECT_ID is required
```

**Solutions**:

1. **Check `.env` file exists**:
   ```bash
   ls -la .env.development .env.test .env.production
   ```

2. **Verify file naming**:
   - Development: `.env.development`
   - Test: `.env.test`
   - Production: `.env.production`

3. **Check `NODE_ENV` variable**:
   ```bash
   echo $NODE_ENV
   # Should match your environment file suffix
   ```

4. **Verify dotenv loading**:
   ```typescript
   // In config/index.ts
   import dotenv from 'dotenv';
   dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
   ```

### Issue: TypeScript compilation errors

**Symptoms**:
```
error TS2307: Cannot find module 'express' or its corresponding type declarations
```

**Solutions**:

1. **Install type definitions**:
   ```bash
   npm install --save-dev @types/express @types/node
   ```

2. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "esModuleInterop": true,
       "skipLibCheck": true
     }
   }
   ```

3. **Rebuild project**:
   ```bash
   rm -rf dist
   npm run build
   ```

## Authentication Issues

### Issue: "Invalid token" error

**Symptoms**:
```json
{
  "status": "error",
  "message": "Invalid authentication token"
}
```

**Solutions**:

1. **Check token format**:
   ```bash
   # Token should start with "eyJ..."
   echo $TOKEN | cut -c1-10
   ```

2. **Verify token expiration**:
   ```bash
   # Decode JWT to check expiration (use jwt.io)
   # exp field should be in the future
   ```

3. **Get fresh token from Firebase**:
   ```typescript
   // In your client app
   const idToken = await firebase.auth().currentUser.getIdToken(true);
   ```

4. **Check Firebase project ID matches**:
   ```bash
   # In .env file
   FIREBASE_PROJECT_ID=your-actual-project-id
   ```

### Issue: "User not found" after authentication

**Symptoms**:
```json
{
  "status": "error",
  "message": "User profile not found"
}
```

**Solutions**:

1. **Register user first**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"displayName": "Test User"}'
   ```

2. **Check Firestore collection**:
   ```bash
   # Verify 'users' collection exists in Firebase Console
   # Check if user document with UID exists
   ```

## Firebase Issues

### Issue: Firebase connection fails

**Symptoms**:
```
Error: Could not load the default credentials
```

**Solutions**:

1. **Verify environment variables**:
   ```bash
   # Check all required variables are set
   echo $FIREBASE_PROJECT_ID
   echo $FIREBASE_CLIENT_EMAIL
   echo $FIREBASE_PRIVATE_KEY
   ```

2. **Check private key format**:
   ```bash
   # Private key should have \\n for line breaks in .env files
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"
   ```

3. **Verify service account permissions**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Ensure service account has "Firebase Admin SDK Administrator" role

4. **Test Firebase connection**:
   ```typescript
   // In src/config/firebase.ts
   console.log('Firebase initialized:', admin.app().name);
   ```

### Issue: Firestore query times out

**Symptoms**:
```
Error: Deadline exceeded
```

**Solutions**:

1. **Check Firestore indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Verify query structure**:
   ```typescript
   // ✅ Good: Uses existing indexes
   .where('userId', '==', userId)
   .where('date', '>=', startDate)
   .orderBy('date', 'desc')

   // ❌ Bad: May need composite index
   .where('status', '==', 'completed')
   .where('total', '>', 100)
   .orderBy('date', 'desc')
   ```

3. **Create missing indexes**:
   - Check error message for index creation URL
   - Click URL to auto-create required index
   - Wait 2-5 minutes for index to build

### Issue: Cloud Storage upload fails

**Symptoms**:
```
Error: The caller does not have permission
```

**Solutions**:

1. **Check storage bucket name**:
   ```bash
   # Should match your project
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   ```

2. **Verify storage rules**:
   ```bash
   # In storage.rules
   service firebase.storage {
     match /b/{bucket}/o {
       match /receipts/{userId}/{receiptId}/{fileName} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **Deploy storage rules**:
   ```bash
   firebase deploy --only storage
   ```

## OpenAI Integration Issues

### Issue: OpenAI API returns 401 Unauthorized

**Symptoms**:
```
Error: Incorrect API key provided
```

**Solutions**:

1. **Verify API key**:
   ```bash
   # Should start with "sk-"
   echo $OPENAI_API_KEY | cut -c1-3
   ```

2. **Check API key permissions**:
   - Login to OpenAI Platform
   - Go to API Keys
   - Verify key is active and not revoked

3. **Test API key directly**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Issue: Receipt parsing returns low confidence scores

**Symptoms**:
```json
{
  "overallConfidence": 0.45,
  "merchant": {
    "confidence": 0.3,
    "confidenceLevel": "low"
  }
}
```

**Solutions**:

1. **Check image quality**:
   - Ensure image is clear and well-lit
   - Minimum resolution: 800x600 pixels
   - Supported formats: JPEG, PNG, WebP

2. **Adjust OpenAI parameters**:
   ```typescript
   // In config/index.ts
   export default {
     openai: {
       model: 'gpt-4o',        // Use latest model
       maxTokens: 2000,         // Increase if needed
       temperature: 0.1,        // Lower for more consistent results
     }
   };
   ```

3. **Review prompt engineering**:
   ```typescript
   // In services/openai.service.ts
   // Ensure prompt is clear and specific
   const prompt = `
     Extract the following information from this receipt:
     - Merchant name
     - Date (format: YYYY-MM-DD)
     - Total amount (number only)
     ...
   `;
   ```

### Issue: OpenAI API rate limit exceeded

**Symptoms**:
```
Error: Rate limit reached for requests
```

**Solutions**:

1. **Implement exponential backoff**:
   ```typescript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.status === 429 && i < maxRetries - 1) {
           await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
           continue;
         }
         throw error;
       }
     }
   }
   ```

2. **Check rate limits**:
   - OpenAI Dashboard → Usage
   - Upgrade plan if needed

3. **Implement caching**:
   ```typescript
   // Cache parsed results to avoid re-parsing same receipts
   ```

## Stripe Integration Issues

### Issue: Webhook signature verification fails

**Symptoms**:
```
Error: No signatures found matching the expected signature
```

**Solutions**:

1. **Verify webhook secret**:
   ```bash
   # Should start with "whsec_"
   echo $STRIPE_WEBHOOK_SECRET | cut -c1-6
   ```

2. **Check webhook endpoint URL**:
   - Stripe Dashboard → Developers → Webhooks
   - URL should match: `https://your-domain.com/api/v1/billing/webhook`

3. **Test webhook locally with Stripe CLI**:
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/billing/webhook
   stripe trigger checkout.session.completed
   ```

4. **Verify request body is raw**:
   ```typescript
   // In app.ts - webhook endpoint needs raw body
   app.post('/api/v1/billing/webhook',
     express.raw({ type: 'application/json' }),
     webhookHandler
   );
   ```

### Issue: Checkout session creation fails

**Symptoms**:
```
Error: No such price: price_xxxxx
```

**Solutions**:

1. **Verify Price ID**:
   ```bash
   # Check Stripe Dashboard → Products
   # Copy correct Price ID
   STRIPE_PRO_PRICE_ID=price_your_actual_price_id
   ```

2. **Ensure price is active**:
   - Stripe Dashboard → Products
   - Check price status is "Active"

3. **Test with Stripe test keys**:
   ```bash
   # Use test mode keys during development
   STRIPE_SECRET_KEY=sk_test_...
   ```

## Development Issues

### Issue: Server won't start

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:

1. **Kill process on port**:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Use different port**:
   ```bash
   PORT=3001 npm run dev
   ```

### Issue: Hot reload not working

**Symptoms**:
- Changes not reflected after saving files

**Solutions**:

1. **Check nodemon configuration**:
   ```json
   // nodemon.json
   {
     "watch": ["src"],
     "ext": "ts",
     "exec": "ts-node src/index.ts"
   }
   ```

2. **Restart development server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Clear require cache** (if using custom loader):
   ```typescript
   delete require.cache[require.resolve('./module')];
   ```

## Testing Issues

### Issue: Tests fail with "Cannot find module"

**Symptoms**:
```
Cannot find module 'uuid' from 'src/middleware/requestId.ts'
```

**Solutions**:

1. **Check Jest configuration**:
   ```javascript
   // jest.config.js
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
   };
   ```

2. **Mock problematic modules**:
   ```typescript
   // In __tests__/setup.ts
   jest.mock('uuid', () => ({
     v4: jest.fn(() => 'test-uuid'),
   }));
   ```

### Issue: Test coverage below threshold

**Symptoms**:
```
Jest: "global" coverage threshold for statements (70%) not met: 45%
```

**Solutions**:

1. **Add tests for uncovered files**:
   ```bash
   # Check coverage report
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

2. **Focus on core business logic**:
   - Models: 100% coverage required
   - Services: 70% coverage required
   - Controllers: 70% coverage required

3. **Exclude non-critical files**:
   ```javascript
   // jest.config.js
   collectCoverageFrom: [
     'src/**/*.ts',
     '!src/**/*.d.ts',
     '!src/index.ts',
     '!src/types/**',
   ],
   ```

## Deployment Issues

### Issue: Build fails in CI/CD

**Symptoms**:
```
npm ERR! Build failed
```

**Solutions**:

1. **Check GitHub Secrets**:
   - Settings → Secrets → Actions
   - Verify all required secrets are set

2. **Test build locally**:
   ```bash
   npm ci
   npm run lint
   npm run build
   npm test
   ```

3. **Review CI logs**:
   - GitHub Actions tab → Failed workflow
   - Check specific step that failed

### Issue: Health check fails after deployment

**Symptoms**:
```
curl: (7) Failed to connect to api-dev.receiptscan.ai
```

**Solutions**:

1. **Check Cloud Run logs**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" \
     --limit 50 \
     --format json
   ```

2. **Verify service is running**:
   ```bash
   gcloud run services describe receiptscan-api-dev \
     --region us-central1
   ```

3. **Check environment variables in Cloud Run**:
   - Cloud Console → Cloud Run → Service → Variables
   - Ensure all required variables are set

## Getting More Help

If your issue isn't covered here:

1. **Check existing issues**: [GitHub Issues](https://github.com/guilhermomg/receiptscan-backend/issues)
2. **Review documentation**: 
   - [README.md](../README.md)
   - [TESTING.md](./TESTING.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Open a new issue**: Include:
   - Clear description of the problem
   - Steps to reproduce
   - Error messages and logs
   - Environment details (OS, Node version, etc.)
4. **Contact maintainers**: Tag relevant maintainers in your issue

## Debugging Tips

### Enable Debug Logging

```bash
# Set log level to debug
LOG_LEVEL=debug npm run dev
```

### Inspect Network Requests

```bash
# Use curl with verbose output
curl -v http://localhost:3000/api/v1/health
```

### Check Firebase Emulator

```bash
# Start emulators with UI
firebase emulators:start --inspect-functions

# Access emulator UI at http://localhost:4000
```

### Monitor API Performance

```bash
# Check request logs
tail -f logs/combined.log | grep "request completed"
```
