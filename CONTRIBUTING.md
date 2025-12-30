# Contributing to ReceiptScan Backend

Thank you for your interest in contributing to ReceiptScan! This document provides guidelines and standards for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/receiptscan-backend.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes following our code standards
5. Test your changes thoroughly
6. Submit a pull request

## Development Workflow

### Branch Naming Convention

- Feature branches: `feature/description-of-feature`
- Bug fixes: `bugfix/description-of-bug`
- Hotfixes: `hotfix/description-of-hotfix`
- Documentation: `docs/description-of-docs`

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without functionality changes
- `test`: Adding or modifying tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**
```
feat(auth): add Firebase authentication middleware

fix(receipts): correct date parsing in OpenAI response

docs(readme): update setup instructions for M1 Macs

test(receipts): add integration tests for upload flow
```

## Code Style Standards

### TypeScript Guidelines

1. **Use TypeScript strict mode** - All code must pass strict type checking
2. **Avoid `any` type** - Use proper types or `unknown` when type is truly unknown
3. **Use interfaces for object shapes** - Define clear contracts for data structures
4. **Prefer const over let** - Use `const` by default, `let` only when reassignment is needed
5. **Use async/await** - Prefer async/await over raw promises for better readability

### Naming Conventions

- **Variables/Functions**: camelCase (`getUserById`, `receiptData`)
- **Classes/Interfaces**: PascalCase (`ReceiptService`, `IReceipt`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_VERSION`)
- **Files**: kebab-case (`receipt-service.ts`, `auth-middleware.ts`)
- **Test files**: `*.test.ts` or `*.spec.ts`

### Code Organization

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Data models and interfaces
├── services/        # Business logic
├── repositories/    # Data access layer
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

### Formatting

We use Prettier for code formatting. Configuration is in `.prettierrc.json`.

Run before committing:
```bash
npm run format
```

### Linting

We use ESLint for code quality. Configuration is in `.eslintrc.json`.

Run before committing:
```bash
npm run lint
```

## Testing Standards

### Test Coverage Requirements

- **Minimum 70% coverage** for all new code
- **Core business logic must have 90%+ coverage**
- All public API endpoints must have integration tests
- Critical user flows must have end-to-end tests

### Writing Tests

1. **Follow AAA pattern** - Arrange, Act, Assert
2. **Use descriptive test names** - Test name should describe what is being tested
3. **One assertion per test** - Each test should verify one specific behavior
4. **Mock external dependencies** - Mock Firebase, OpenAI, Stripe in unit tests
5. **Use test fixtures** - Create reusable test data

**Example:**
```typescript
describe('ReceiptService', () => {
  describe('parseReceipt', () => {
    it('should extract merchant name from receipt image', async () => {
      // Arrange
      const mockImageUrl = 'https://example.com/receipt.jpg';
      const mockOpenAIResponse = { merchant: 'Starbucks' };
      jest.spyOn(openaiClient, 'analyze').mockResolvedValue(mockOpenAIResponse);

      // Act
      const result = await receiptService.parseReceipt(mockImageUrl);

      // Assert
      expect(result.merchant).toBe('Starbucks');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Pull Request Process

1. **Update documentation** - Update README, API docs, or comments as needed
2. **Add/update tests** - Ensure tests cover your changes
3. **Run linting and formatting** - Code must pass `npm run lint` and `npm run format:check`
4. **Ensure tests pass** - All tests must pass with adequate coverage
5. **Update CHANGELOG** - Add entry describing your changes (if applicable)
6. **Write clear PR description** - Explain what changes were made and why
7. **Link related issues** - Reference issue numbers (e.g., "Closes #123")
8. **Request review** - Tag relevant reviewers

### PR Description Template

```markdown
## Description
Brief description of changes made

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] Coverage meets requirements
```

## Security Guidelines

- **Never commit secrets** - Use environment variables
- **Validate all inputs** - Use Joi or Zod for request validation
- **Sanitize user data** - Prevent injection attacks
- **Use parameterized queries** - Prevent NoSQL injection
- **Implement rate limiting** - Prevent abuse
- **Log security events** - Audit sensitive operations
- **Keep dependencies updated** - Regularly update packages

## API Design Guidelines

1. **Follow RESTful conventions** - Use appropriate HTTP methods and status codes
2. **Version your APIs** - Use `/api/v1/` prefix
3. **Use plural nouns for resources** - `/api/v1/receipts`, not `/api/v1/receipt`
4. **Use proper status codes**:
   - 200: Success
   - 201: Created
   - 204: No Content
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Internal Server Error
5. **Return consistent error format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Documentation

- **Document all public APIs** - Use Swagger/OpenAPI
- **Add JSDoc comments** - Document complex functions
- **Update README** - Keep setup instructions current
- **Create ADRs** - Document significant architectural decisions
- **Write clear comments** - Explain "why", not "what"

## Questions?

If you have questions or need help:
- Open a GitHub issue
- Contact the maintainers
- Check the troubleshooting guide

Thank you for contributing to ReceiptScan! 🎉
