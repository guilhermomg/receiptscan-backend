# Testing Guide

This document provides comprehensive information about testing the receiptscan-backend API.

## Table of Contents

- [Testing Framework](#testing-framework)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Manual Testing](#manual-testing)
- [Testing External Integrations](#testing-external-integrations)

## Testing Framework

The project uses **Jest** with TypeScript support (`ts-jest`) for unit and integration testing.

### Key Testing Dependencies

- **Jest**: Test framework
- **ts-jest**: TypeScript preprocessor for Jest
- **@types/jest**: TypeScript type definitions
- **supertest**: HTTP assertion library for API testing

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (optimized for CI/CD pipelines)
npm run test:ci
```

### Test Output

```
Test Suites: 5 passed, 5 total
Tests:       87 passed, 87 total
Snapshots:   0 total
Time:        8.5s
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Jest configuration and global setup
│   ├── mocks/                # Mock implementations
│   │   ├── firebase.mock.ts  # Firebase Admin SDK mocks
│   │   ├── openai.mock.ts    # OpenAI SDK mocks
│   │   └── stripe.mock.ts    # Stripe SDK mocks
│   ├── unit/                 # Unit tests
│   │   ├── receipt.model.test.ts
│   │   ├── receipt.validation.test.ts
│   │   ├── parsedReceipt.model.test.ts
│   │   ├── parsedReceipt.validation.test.ts
│   │   └── user.model.test.ts
│   └── integration/          # Integration tests
│       └── (future tests)
```

## Writing Tests

### Unit Test Example

```typescript
import { createReceiptSchema } from '../../models/receipt.validation';
import { ReceiptStatus } from '../../models/receipt.model';

describe('Receipt Validation', () => {
  it('should validate a valid receipt', () => {
    const validReceipt = {
      merchant: 'Test Store',
      date: new Date(),
      total: 100,
      currency: 'USD',
      category: 'Food & Dining',
    };

    const result = createReceiptSchema.parse(validReceipt);
    expect(result.merchant).toBe('Test Store');
    expect(result.status).toBe(ReceiptStatus.PENDING);
  });

  it('should reject invalid currency', () => {
    const invalidReceipt = {
      merchant: 'Test Store',
      date: new Date(),
      total: 100,
      currency: 'INVALID',
      category: 'Food & Dining',
    };

    expect(() => createReceiptSchema.parse(invalidReceipt)).toThrow();
  });
});
```

### Mocking External Services

```typescript
// Mock Firebase in your test file
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => mockFirestore),
  auth: jest.fn(() => mockAuth),
}));

// Use mocked services
import { mockFirestore } from '../mocks/firebase.mock';

mockFirestore.collection.mockReturnValue({
  doc: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ /* mock data */ }),
    }),
  }),
});
```

## Test Coverage

### Coverage Requirements

The project maintains **>70% test coverage** for core business logic:

- **Models**: 100% coverage (all types and interfaces)
- **Validation Schemas**: 100% coverage (all Zod schemas)
- **Services**: Target 70%+ coverage for business logic
- **Controllers**: Target 70%+ coverage for request handling

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Coverage reports are generated in:
# - coverage/lcov-report/index.html (HTML report - open in browser)
# - coverage/lcov.info (LCOV format for CI/CD)
# - coverage/coverage-summary.json (JSON summary)
```

### Coverage Output Example

```
---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------|---------|----------|---------|---------|-------------------
All files                  |   48.5  |   45.2   |   52.1  |   48.3  |
 models                    |  100    |  100     |  100    |  100    |
  receipt.model.ts         |  100    |  100     |  100    |  100    |
  receipt.validation.ts    |  100    |  100     |  100    |  100    |
  user.model.ts            |  100    |  100     |  100    |  100    |
---------------------------|---------|----------|---------|---------|-------------------
```

## Manual Testing

### Prerequisites for Manual Testing

1. **Firebase Emulator** (optional for local testing):
   ```bash
   npm install -g firebase-tools
   firebase emulators:start
   ```

2. **Environment Variables**: Create a `.env.test` file with test credentials

3. **Test User Accounts**: Set up test Firebase users

### Testing Authentication Flow

```bash
# 1. Get a Firebase ID token (use Firebase Console or SDK)
export TEST_TOKEN="your-firebase-id-token"

# 2. Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Test User"}'

# 3. Get user profile
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TEST_TOKEN"
```

### Testing Receipt Upload → Parse → Retrieve Flow

```bash
# 1. Upload a receipt
curl -X POST http://localhost:3000/api/v1/receipts/upload \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "receipt=@/path/to/test-receipt.jpg"

# Response includes receiptId and fileUrl

# 2. Parse the receipt
curl -X POST http://localhost:3000/api/v1/receipts/parse \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.googleapis.com/...",
    "receiptId": "receipt-id-from-upload"
  }'

# 3. Retrieve the receipt
curl -X GET http://localhost:3000/api/v1/receipts/:id \
  -H "Authorization: Bearer $TEST_TOKEN"
```

## Testing External Integrations

### OpenAI API Testing

**Mock Testing** (recommended for CI/CD):
- Uses mocked responses in `__tests__/mocks/openai.mock.ts`
- No API calls, no costs
- Fast and reliable

**Live Testing** (for validation):
```bash
# Set up OpenAI API key
export OPENAI_API_KEY="sk-..."

# Test with a real receipt image
curl -X POST http://localhost:3000/api/v1/receipts/parse \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/receipt.jpg"
  }'
```

**Validation Checklist**:
- ✅ Merchant name extracted correctly
- ✅ Date parsed and formatted
- ✅ Total amount accurate
- ✅ Tax amount (if present)
- ✅ Currency detected
- ✅ Category suggested
- ✅ Line items extracted (if available)
- ✅ Confidence scores provided

### Firebase Testing

**Using Firebase Emulator** (recommended for local testing):
```bash
# Start emulators
firebase emulators:start

# Update .env.test to use emulator
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"

# Run tests
npm test
```

**Live Firebase Testing**:
- Use a dedicated test Firebase project
- Never test against production
- Clean up test data regularly

### Stripe Testing

**Test Mode** (recommended):
- Use Stripe test API keys (`sk_test_...`)
- Use test card numbers (e.g., `4242 4242 4242 4242`)
- Webhook events can be simulated using Stripe CLI

**Stripe CLI for Webhook Testing**:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/billing/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

## Continuous Integration

Tests run automatically on:
- **Every Pull Request** to `main` branch
- **Every Push** to `main` branch

### CI Workflow

The GitHub Actions workflow (`.github/workflows/test.yml`) performs:

1. Checkout code
2. Install dependencies
3. Run linter
4. Check code formatting
5. Build TypeScript
6. Run tests with coverage
7. Upload coverage reports
8. **Fail the build if tests fail**

### Coverage Reporting

Coverage reports are:
- Posted as comments on PRs
- Uploaded to Codecov (if configured)
- Available as CI artifacts

## Best Practices

### Test Naming

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Test implementation
    });
  });
});
```

### Arrange-Act-Assert Pattern

```typescript
it('should create a receipt with valid data', () => {
  // Arrange
  const validData = {
    merchant: 'Test Store',
    total: 100,
    // ...
  };

  // Act
  const result = createReceiptSchema.parse(validData);

  // Assert
  expect(result.merchant).toBe('Test Store');
  expect(result.total).toBe(100);
});
```

### Test Isolation

- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/teardown
- Mock external dependencies
- Clean up after tests

### What to Test

**Do Test**:
- ✅ Business logic
- ✅ Data validation
- ✅ Error handling
- ✅ Edge cases
- ✅ API contracts

**Don't Test**:
- ❌ Third-party library internals
- ❌ TypeScript type checking (handled by compiler)
- ❌ Obvious getters/setters without logic

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
```
Solution: Increase timeout in jest.config.js or use jest.setTimeout(10000)
```

**Issue**: Module not found errors
```
Solution: Check tsconfig.json paths and jest moduleNameMapper
```

**Issue**: Firebase/OpenAI connection errors
```
Solution: Ensure mocks are properly configured in __tests__/setup.ts
```

**Issue**: Coverage threshold not met
```
Solution: Add more tests for uncovered files or adjust thresholds in jest.config.js
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Stripe Testing](https://stripe.com/docs/testing)
- [OpenAI API Testing Best Practices](https://platform.openai.com/docs/guides/testing)
