# Contributing to receiptscan-backend

Thank you for your interest in contributing to receiptscan-backend! This document provides guidelines and standards for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Standards](#code-style-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Git
- Firebase account (for testing)
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork and clone the repository**:
   ```bash
   git fork https://github.com/guilhermomg/receiptscan-backend.git
   git clone https://github.com/YOUR_USERNAME/receiptscan-backend.git
   cd receiptscan-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Run tests**:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `feature/*`: New features
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates
- `refactor/*`: Code refactoring

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in logical, atomic commits
2. Write or update tests for your changes
3. Ensure all tests pass: `npm test`
4. Run linter: `npm run lint:fix`
5. Check formatting: `npm run format:check`
6. Build the project: `npm run build`

## Code Style Standards

### TypeScript Guidelines

#### 1. Use Strict TypeScript

```typescript
// ✅ Good: Explicit types
function createReceipt(data: CreateReceiptDto): Receipt {
  // ...
}

// ❌ Bad: Implicit any
function createReceipt(data) {
  // ...
}
```

#### 2. Interface Naming

```typescript
// ✅ Good: PascalCase for interfaces
interface UserProfile {
  userId: string;
  email: string;
}

// ✅ Good: Prefix with 'I' only if necessary for clarity
interface IAuthService {
  login(): Promise<void>;
}
```

#### 3. Enum Naming

```typescript
// ✅ Good: PascalCase for enum name, UPPER_CASE for values
export enum ReceiptStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
}
```

#### 4. Function Naming

```typescript
// ✅ Good: Descriptive verb-noun pattern
function getUserById(id: string): Promise<User> { }
function validateReceiptData(data: unknown): boolean { }

// ❌ Bad: Unclear naming
function get(id: string) { }
function check(data: unknown) { }
```

### Architecture Patterns

#### Layered Architecture

Follow the layered architecture pattern:

```
Controller → Service → Repository → Database
```

**Example**:

```typescript
// Controller: Handle HTTP requests
export const getReceiptById = async (req: Request, res: Response) => {
  const receipt = await receiptService.getById(req.params.id, req.user.uid);
  res.json({ status: 'success', data: { receipt } });
};

// Service: Business logic
export const getById = async (id: string, userId: string): Promise<Receipt> => {
  const receipt = await receiptRepository.getReceiptById(id, userId);
  if (!receipt) throw new Error('Receipt not found');
  return receipt;
};

// Repository: Data access
export const getReceiptById = async (id: string, userId: string) => {
  const doc = await db.collection('receipts').doc(id).get();
  return doc.data() as Receipt;
};
```

### Code Documentation

#### JSDoc Comments

```typescript
/**
 * Creates a new receipt in the database
 * 
 * @param userId - The ID of the user creating the receipt
 * @param data - Receipt data to create
 * @returns The created receipt with generated ID
 * @throws {Error} If validation fails or database operation fails
 * 
 * @example
 * ```typescript
 * const receipt = await createReceipt('user123', {
 *   merchant: 'Whole Foods',
 *   total: 127.45,
 *   currency: 'USD'
 * });
 * ```
 */
export async function createReceipt(
  userId: string,
  data: CreateReceiptDto
): Promise<Receipt> {
  // Implementation
}
```

#### Inline Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Use exponential backoff to avoid rate limiting
await retryWithBackoff(apiCall, 3);

// ❌ Bad: States the obvious
// Loop through items
for (const item of items) {
  // ...
}
```

### Error Handling

```typescript
// ✅ Good: Specific error messages
if (!receipt) {
  throw new Error(`Receipt not found: ${receiptId}`);
}

// ✅ Good: Use custom error classes
class ReceiptNotFoundError extends Error {
  constructor(receiptId: string) {
    super(`Receipt not found: ${receiptId}`);
    this.name = 'ReceiptNotFoundError';
  }
}

// ✅ Good: Log errors with context
catch (error) {
  logger.error('Failed to create receipt', {
    userId,
    error: error.message,
    stack: error.stack,
  });
  throw error;
}
```

### Validation

```typescript
// ✅ Good: Use Zod for validation
import { z } from 'zod';

export const createReceiptSchema = z.object({
  merchant: z.string().min(1).max(200),
  total: z.number().nonnegative(),
  currency: z.enum(['USD', 'EUR', 'BRL']),
});

// Validate input
const validatedData = createReceiptSchema.parse(requestBody);
```

### API Response Format

```typescript
// ✅ Good: Consistent response structure
{
  "status": "success",
  "data": {
    "receipt": { /* ... */ }
  }
}

// Error response
{
  "status": "error",
  "message": "Receipt not found",
  "code": "RECEIPT_NOT_FOUND"
}
```

## Pull Request Process

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Build succeeds (`npm run build`)
- [ ] Test coverage meets requirements (>70% for core logic)
- [ ] Documentation is updated (if applicable)
- [ ] Commits follow commit message guidelines

### PR Title Format

```
<type>: <description>

Examples:
feat: add receipt export to PDF
fix: resolve authentication token validation issue
docs: update API documentation for billing endpoints
refactor: simplify receipt parsing logic
test: add unit tests for receipt validation
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does and why.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List key changes
- With bullet points

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
Relates to #456
```

### Review Process

1. **Automated Checks**: CI/CD runs tests, linting, and builds
2. **Code Review**: At least one maintainer reviews the code
3. **Feedback**: Address review comments
4. **Approval**: PR is approved by maintainer
5. **Merge**: PR is merged to main branch

## Testing Requirements

### Test Coverage

- **Models & Validation**: 100% coverage required
- **Services**: Minimum 70% coverage
- **Controllers**: Minimum 70% coverage
- **Integration Tests**: Critical user flows must be tested

### Writing Tests

```typescript
describe('ReceiptService', () => {
  describe('createReceipt', () => {
    it('should create a receipt with valid data', async () => {
      // Arrange
      const userId = 'user123';
      const receiptData: CreateReceiptDto = {
        merchant: 'Test Store',
        total: 100,
        currency: 'USD',
        category: 'Food & Dining',
      };

      // Act
      const receipt = await receiptService.createReceipt(userId, receiptData);

      // Assert
      expect(receipt).toBeDefined();
      expect(receipt.merchant).toBe('Test Store');
      expect(receipt.userId).toBe(userId);
    });

    it('should throw error for invalid data', async () => {
      // Arrange
      const userId = 'user123';
      const invalidData = {
        merchant: '',
        total: -100,
      };

      // Act & Assert
      await expect(
        receiptService.createReceipt(userId, invalidData)
      ).rejects.toThrow('Invalid receipt data');
    });
  });
});
```

### Mock External Services

```typescript
// Mock Firebase
jest.mock('../config/firebase', () => ({
  db: mockFirestore,
  auth: mockAuth,
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => mockOpenAI),
}));
```

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add JWT token refresh endpoint

Implements automatic token refresh for expired tokens.
Users can now refresh their authentication token without
re-authenticating.

Closes #123
```

```
fix(receipt): resolve parsing error for multi-page PDFs

Fixed an issue where receipts with multiple pages would
fail to parse correctly. Now handles multi-page documents
by processing each page separately.

Fixes #456
```

```
docs(api): update authentication flow documentation

- Added token refresh examples
- Updated error response codes
- Added troubleshooting section

Relates to #789
```

## Security Guidelines

### Never Commit Secrets

```bash
# ✅ Good: Use environment variables
const apiKey = process.env.OPENAI_API_KEY;

# ❌ Bad: Hardcoded secrets
const apiKey = "sk-123abc...";
```

### Input Validation

```typescript
// ✅ Good: Validate and sanitize all inputs
const validatedData = createReceiptSchema.parse(req.body);

// ❌ Bad: Trust user input
const data = req.body;
await createReceipt(data);
```

### Prevent Injection Attacks

```typescript
// ✅ Good: Use parameterized queries
const receipt = await db.collection('receipts')
  .where('userId', '==', userId)
  .where('id', '==', receiptId)
  .get();

// ❌ Bad: String concatenation (if using SQL)
const query = `SELECT * FROM receipts WHERE id = '${receiptId}'`;
```

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Zod Documentation](https://zod.dev/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## Questions?

If you have questions or need help:

1. Check existing [GitHub Issues](https://github.com/guilhermomg/receiptscan-backend/issues)
2. Review project documentation in `/docs`
3. Open a new issue with the `question` label

Thank you for contributing to receiptscan-backend! 🎉
