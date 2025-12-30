# Troubleshooting Guide

Common issues and solutions for ReceiptScan Backend development and deployment.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Development Issues](#development-issues)
- [Testing Issues](#testing-issues)
- [Firebase Issues](#firebase-issues)
- [API Issues](#api-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Performance Issues](#performance-issues)

---

## Installation Issues

### Issue: `npm install` fails with EACCES error

**Symptoms:**
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
```

**Solution:**
1. Don't use sudo with npm. Fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

2. Or use nvm (recommended):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Issue: TypeScript installation fails

**Symptoms:**
```
Cannot find module 'typescript'
```

**Solution:**
```bash
npm install --save-dev typescript@latest
npx tsc --version
```

### Issue: Node version mismatch

**Symptoms:**
```
error engines: The engine "node" is incompatible with this module
```

**Solution:**
Ensure you're using Node.js 18 or higher:
```bash
node --version
nvm install 18
nvm use 18
```

---

## Development Issues

### Issue: Server won't start - Port already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
1. Find and kill the process using port 3000:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. Or change the port in `.env`:
```env
PORT=3001
```

### Issue: Environment variables not loading

**Symptoms:**
```
process.env.FIREBASE_PROJECT_ID is undefined
```

**Solution:**
1. Ensure `.env` file exists in root directory
2. Verify `.env` is not in `.gitignore` (only `.env.*` should be)
3. Check that `dotenv` is loaded at the top of `index.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

4. Restart the development server after changing `.env`

### Issue: Hot reload not working

**Symptoms:**
Code changes don't trigger server restart

**Solution:**
1. Ensure nodemon is properly configured in `package.json`:
```json
"dev": "nodemon src/index.ts"
```

2. Check `nodemon.json` (if exists) for correct watch patterns
3. Try killing the process and restarting: `npm run dev`

### Issue: TypeScript errors in IDE but compiles fine

**Symptoms:**
VS Code shows errors, but `npm run build` succeeds

**Solution:**
1. Reload VS Code TypeScript server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
2. Ensure VS Code is using workspace TypeScript:
   - `Cmd+Shift+P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version"
3. Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Testing Issues

### Issue: Tests fail with "Cannot find module" errors

**Symptoms:**
```
Cannot find module '@/models/receipt'
```

**Solution:**
1. Ensure Jest is configured to resolve TypeScript paths:
```javascript
// jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

2. Verify `tsconfig.json` has paths configured:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Issue: Jest tests timeout

**Symptoms:**
```
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Solution:**
1. Increase timeout in `jest.config.js`:
```javascript
testTimeout: 10000,
```

2. Or for specific test:
```typescript
it('should parse receipt', async () => {
  // test code
}, 15000); // 15 second timeout
```

3. Check for unresolved promises in async tests

### Issue: Coverage threshold not met

**Symptoms:**
```
Jest: Coverage for statements (65%) does not meet global threshold (70%)
```

**Solution:**
1. Run coverage report to see which files need more tests:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

2. Focus on files shown in red/yellow in the coverage report
3. Write tests for uncovered branches and statements

### Issue: Mock not working as expected

**Symptoms:**
Test calls real service instead of mock

**Solution:**
1. Ensure mock is defined before importing the module:
```typescript
jest.mock('../services/openai-service');

import { OpenAIService } from '../services/openai-service';

// Then in test
const mockParse = OpenAIService.parse as jest.MockedFunction<typeof OpenAIService.parse>;
mockParse.mockResolvedValue({ merchant: 'Test' });
```

2. For ES modules, use `jest.unstable_mockModule` if needed
3. Clear mocks between tests:
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Firebase Issues

### Issue: Firebase Admin SDK initialization fails

**Symptoms:**
```
Error: Failed to initialize Firebase Admin SDK
```

**Solution:**
1. Verify service account key file exists and path is correct:
```bash
ls -la serviceAccountKey.json
```

2. Ensure `FIREBASE_PRIVATE_KEY_PATH` in `.env` points to correct file
3. Check service account has correct permissions in Firebase Console
4. For production, use environment variable with JSON content:
```env
FIREBASE_PRIVATE_KEY='{"type":"service_account","project_id":"..."}'
```

### Issue: Firestore permissions denied

**Symptoms:**
```
Error: Missing or insufficient permissions
```

**Solution:**
1. Check Firestore security rules in Firebase Console
2. For development, temporarily use permissive rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Ensure Firebase Auth token is being sent with requests:
```typescript
Authorization: Bearer <firebase-id-token>
```

### Issue: Cloud Storage upload fails

**Symptoms:**
```
Error: The caller does not have permission to upload to bucket
```

**Solution:**
1. Verify storage bucket name in `.env` matches Firebase project
2. Check service account has "Storage Object Admin" role
3. Ensure bucket exists in Firebase Console → Storage
4. Check CORS configuration for bucket:
```bash
gsutil cors set cors.json gs://your-bucket-name
```

---

## API Issues

### Issue: CORS errors in browser

**Symptoms:**
```
Access to fetch at 'http://localhost:3000/api/v1/receipts' blocked by CORS policy
```

**Solution:**
1. Add frontend origin to `CORS_ORIGINS` in `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

2. Verify CORS middleware is configured in Express:
```typescript
import cors from 'cors';
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(','),
  credentials: true,
}));
```

### Issue: 401 Unauthorized on protected routes

**Symptoms:**
All authenticated requests return 401

**Solution:**
1. Ensure Firebase ID token is included in Authorization header:
```typescript
headers: {
  'Authorization': `Bearer ${idToken}`
}
```

2. Verify token hasn't expired (Firebase tokens expire after 1 hour)
3. Check authentication middleware is correctly verifying tokens
4. Test token validity:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/auth/me
```

### Issue: OpenAI API rate limit exceeded

**Symptoms:**
```
Error: Rate limit exceeded. Please try again later.
```

**Solution:**
1. Implement exponential backoff with retries:
```typescript
async function parseWithRetry(image: string, retries = 3) {
  try {
    return await openai.parse(image);
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      await sleep(2 ** (3 - retries) * 1000);
      return parseWithRetry(image, retries - 1);
    }
    throw error;
  }
}
```

2. Check your OpenAI usage and limits in OpenAI dashboard
3. Consider implementing a queue system for parsing requests

### Issue: Stripe webhook signature verification fails

**Symptoms:**
```
Error: Invalid signature for webhook
```

**Solution:**
1. Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard webhook settings
2. Use raw body for signature verification:
```typescript
app.post('/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);
```

3. Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

---

## Build & Deployment Issues

### Issue: TypeScript build errors

**Symptoms:**
```
error TS2304: Cannot find name 'Express'
```

**Solution:**
1. Ensure all type definitions are installed:
```bash
npm install --save-dev @types/node @types/express
```

2. Clear TypeScript cache:
```bash
rm -rf dist
npm run build
```

3. Check `tsconfig.json` includes all necessary source files

### Issue: Firebase Functions deployment fails

**Symptoms:**
```
Error: Failed to deploy functions
```

**Solution:**
1. Ensure Firebase CLI is installed and logged in:
```bash
npm install -g firebase-tools
firebase login
firebase projects:list
```

2. Check `firebase.json` configuration
3. Verify all environment variables are set in Firebase:
```bash
firebase functions:config:set openai.key="sk-..."
```

4. Build before deploying:
```bash
npm run build
firebase deploy --only functions
```

### Issue: Cloud Run deployment fails

**Symptoms:**
```
Error: Container health check failed
```

**Solution:**
1. Ensure health check endpoint is implemented:
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

2. Verify Dockerfile exposes correct PORT:
```dockerfile
EXPOSE 8080
ENV PORT=8080
```

3. Check Cloud Run logs:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

---

## Performance Issues

### Issue: Slow API response times

**Symptoms:**
Requests take more than 2 seconds to complete

**Solution:**
1. Add request timing middleware to identify bottlenecks:
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path}: ${Date.now() - start}ms`);
  });
  next();
});
```

2. Check Firestore query performance - add indexes for complex queries
3. Implement caching for frequently accessed data
4. Use Firestore batch operations for multiple writes

### Issue: High memory usage

**Symptoms:**
Node process memory exceeds 512MB

**Solution:**
1. Check for memory leaks with heap snapshots
2. Ensure file uploads are streamed, not buffered:
```typescript
const upload = multer({ storage: multer.memoryStorage() });
```

3. Limit request body size:
```typescript
app.use(express.json({ limit: '1mb' }));
```

4. Set Node.js max memory:
```bash
node --max-old-space-size=512 dist/index.js
```

### Issue: Firestore read limits exceeded

**Symptoms:**
```
Error: Quota exceeded for quota metric 'Read requests'
```

**Solution:**
1. Implement pagination for list endpoints:
```typescript
const query = collection.limit(20).startAfter(lastDoc);
```

2. Cache frequently accessed data
3. Use Firestore composite indexes to reduce read operations
4. Review quota limits in Firebase Console

---

## Getting More Help

If you're still experiencing issues:

1. **Check the logs**: Application logs often contain detailed error information
2. **Search GitHub issues**: Someone may have encountered the same problem
3. **Enable debug logging**: Set `LOG_LEVEL=debug` in `.env`
4. **Ask for help**: Open a GitHub issue with:
   - Description of the problem
   - Steps to reproduce
   - Error messages and logs
   - Environment details (OS, Node version, etc.)

## Useful Commands

```bash
# Check environment setup
node --version
npm --version
firebase --version

# View application logs
npm run dev 2>&1 | tee debug.log

# Test API endpoint
curl -v http://localhost:3000/health

# Check Firebase project
firebase projects:list
firebase use <project-id>

# View Firestore data
firebase firestore:read users

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```
