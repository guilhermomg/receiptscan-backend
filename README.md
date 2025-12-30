# receiptscan-backend

AI-powered receipt scanning and expense tracking API for receiptscan.ai

## Overview

This backend API provides multi-environment deployment support with Firebase Functions, Firestore, and Cloud Storage. It includes automated CI/CD pipelines, health monitoring, and database management tools.

## Architecture

- **Runtime**: Node.js 18
- **Framework**: Express.js on Firebase Functions
- **Database**: Cloud Firestore
- **Storage**: Cloud Storage
- **Language**: TypeScript
- **CI/CD**: GitHub Actions

## Environments

The application supports three separate environments:

| Environment | Firebase Project | API URL | Purpose |
|-------------|-----------------|---------|---------|
| Development | `receiptscan-dev` | `https://api-dev.receiptscan.ai` | Development and testing |
| Test | `receiptscan-test` | `https://api-test.receiptscan.ai` | Integration and QA testing |
| Production | `receiptscan-prd` | `https://api.receiptscan.ai` | Live production environment |

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Access to Firebase projects (receiptscan-dev, receiptscan-test, receiptscan-prd)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and configure for your environment:

```bash
cp .env.example .env.dev
```

**IMPORTANT SECURITY NOTE**: 
The `.env.dev`, `.env.test`, and `.env.prd` files in this repository are **template files with empty API keys**. These files are committed to the repository to provide a consistent structure but **do not contain any actual secrets**.

For local development:
- Copy one of these files and add your actual API keys
- Keep your local secrets file separate (e.g., `.env.local`)

For CI/CD deployment:
- Actual secrets are injected via GitHub Secrets during deployment
- Never commit files with real API keys to the repository

Edit `.env.dev` and add your API keys:
- `OPENAI_API_KEY`: Your OpenAI API key
- `STRIPE_API_KEY`: Your Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

Repeat for `.env.test` and `.env.prd` as needed.

### 3. Authenticate with Firebase

```bash
firebase login
```

### 4. Initialize Firebase Projects

Ensure you have access to all three Firebase projects:

```bash
firebase projects:list
```

## Development

### Local Development

Start the Firebase emulators for local development:

```bash
npm run serve
```

This will start:
- Functions emulator on port 5001
- Firestore emulator on port 8080
- Storage emulator on port 9199
- Auth emulator on port 9099
- Emulator UI on port 4000

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Testing

Run the test suite:

```bash
npm test
```

## Database Management

### Migrations

Run database migrations:

```bash
# Development environment
npm run migrate -- --env dev

# Test environment
npm run migrate -- --env test

# Production (use with caution)
npm run migrate -- --env prd
```

### Seeding Test Data

Seed the database with test data (dev/test only):

```bash
# Development environment
npm run seed -- --env dev

# Test environment
npm run seed -- --env test

# Production seeding is blocked for safety
```

## Deployment

### Manual Deployment

Deploy to a specific environment using the deployment script:

```bash
# Deploy to development
./scripts/deploy.sh dev

# Deploy to test
./scripts/deploy.sh test

# Deploy to production
./scripts/deploy.sh prd
```

Or use npm scripts:

```bash
npm run deploy:dev
npm run deploy:test
npm run deploy:prd
```

### Automated Deployment with GitHub Actions

#### Development Environment

Automatically deploys on push to `main` branch:

```yaml
on:
  push:
    branches: [main]
```

#### Test Environment

Manual deployment via GitHub Actions:

1. Go to Actions tab in GitHub
2. Select "Deploy to Test" workflow
3. Click "Run workflow"
4. Type "deploy" to confirm
5. Click "Run workflow" button

#### Production Environment

Blue-Green deployment with manual approval:

1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Enter version tag (e.g., `v1.0.0`)
5. Type "deploy-production" to confirm
6. Click "Run workflow" button
7. Wait for blue environment deployment
8. Review and approve production switch

### Environment Variables in CI/CD

Configure the following secrets in GitHub repository settings:

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

## Rollback Procedures

### Automated Rollback

Use the rollback script to revert to a previous version:

```bash
./scripts/rollback.sh <environment> <version>
```

Example:
```bash
./scripts/rollback.sh prd v1.0.0
```

### Manual Rollback via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the appropriate project
3. Navigate to Functions
4. Find the function and click on it
5. Go to "Usage" tab
6. View deployment history
7. Select a previous version to rollback

### Emergency Rollback Steps

If automated rollback fails:

1. **Stop Current Traffic**
   ```bash
   firebase use prd
   firebase functions:delete api --force
   ```

2. **Redeploy Previous Version**
   ```bash
   git checkout <previous-version-tag>
   npm run deploy:prd
   ```

3. **Verify Health**
   ```bash
   curl https://api.receiptscan.ai/health
   ```

4. **Document Incident**
   - Record what went wrong
   - Document rollback steps taken
   - Create post-mortem if necessary

## Health Checks

### Health Endpoint

Check service health and configuration:

```bash
curl https://api-dev.receiptscan.ai/health
```

Response includes:
- Service status
- Environment information
- Firestore connectivity
- Storage configuration
- Feature flags
- Version information

### Readiness Endpoint

Check if service is ready to accept traffic:

```bash
curl https://api-dev.receiptscan.ai/readiness
```

## Monitoring

### Firebase Console

Monitor functions in the Firebase Console:
- [Development](https://console.firebase.google.com/project/receiptscan-dev/functions)
- [Test](https://console.firebase.google.com/project/receiptscan-test/functions)
- [Production](https://console.firebase.google.com/project/receiptscan-prd/functions)

### Logs

View function logs:

```bash
# Development
firebase use dev && npm run logs

# Test
firebase use test && npm run logs

# Production
firebase use prd && npm run logs
```

## Security

### Firestore Rules

Database security rules are defined in `firestore.rules`:
- Users can only access their own data
- Receipt and expense data is user-scoped
- Categories are read-only for authenticated users

### Storage Rules

Storage security rules are defined in `storage.rules`:
- Users can only access their own receipt images
- 10MB file size limit
- Image files only

### API Keys

- Never commit `.env` files with real API keys
- Use GitHub Secrets for CI/CD
- Rotate keys regularly
- Use different keys for each environment

## Troubleshooting

### Build Failures

```bash
# Clear build cache
rm -rf lib node_modules
npm install
npm run build
```

### Deployment Failures

```bash
# Check Firebase authentication
firebase login --reauth

# Verify project access
firebase projects:list

# Check function logs
firebase use dev && npm run logs
```

### Health Check Failures

- Verify environment variables are set correctly
- Check Firestore database rules
- Verify Firebase project configuration
- Check network connectivity

## Project Structure

```
receiptscan-backend/
├── .github/
│   └── workflows/          # GitHub Actions workflows
├── src/
│   ├── config/            # Configuration management
│   ├── controllers/       # Request handlers
│   ├── scripts/           # Database migration and seeding
│   └── index.ts           # Main application entry
├── scripts/
│   ├── deploy.sh          # Deployment script
│   └── rollback.sh        # Rollback script
├── .env.example           # Environment variables template
├── .env.dev               # Development configuration
├── .env.test              # Test configuration
├── .env.prd               # Production configuration
├── firebase.json          # Firebase configuration
├── .firebaserc            # Firebase projects
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules          # Storage security rules
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run linter and tests
4. Push to the branch
5. Create a Pull Request
6. Wait for CI checks to pass
7. Get approval and merge

## License

Private - All Rights Reserved

## Support

For issues or questions, please contact the development team or create an issue in the repository.

