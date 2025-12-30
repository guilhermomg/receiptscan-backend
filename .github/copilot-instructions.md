# GitHub Copilot Instructions for receiptscan-backend

## Pull Request Workflow

When assigned to a GitHub issue:

1. **DO NOT create a draft PR immediately**
2. Work on implementing all requirements from the issue
3. Complete ALL acceptance criteria listed in the issue
4. Ensure all tests pass
5. Only after everything is complete, create a PR and mark it as "Ready for review"

## Code Quality Standards

- Follow TypeScript best practices with strict typing
- Use the layered architecture pattern: Controller → Service → Repository
- Add comprehensive error handling with meaningful messages
- Include JSDoc comments for public APIs
- Write unit tests for business logic (minimum 70% coverage for core features)
- Follow existing code style and ESLint rules

## API Development Guidelines

- All endpoints must be versioned: `/api/v1/*`
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Include request validation using Zod or Joi
- Add Swagger/OpenAPI documentation for all endpoints
- Implement proper authentication middleware on protected routes
- Add rate limiting where appropriate

## Firebase Integration

- Use lazy initialization to prevent circular dependencies
- Handle missing credentials gracefully (log warning, allow development)
- Store data with proper Firestore indexes
- Use TypeScript interfaces for all Firestore documents

## Security Requirements

- Never commit sensitive credentials or API keys
- Validate and sanitize all user inputs
- Use parameterized queries to prevent injection
- Add CORS configuration with explicit allowed origins
- Include security headers (CSP, HSTS, X-Frame-Options)

## Testing Requirements

- Write unit tests using Jest
- Mock external services (Firebase, OpenAI, Stripe)
- Test both success and error scenarios
- Include edge cases in test coverage

## Documentation Requirements

- Update README.md if adding new features
- Document environment variables needed
- Add inline comments for complex logic
- Include usage examples in API documentation
- Update SECURITY.md for security-related changes

## Commit Standards

- Use descriptive commit messages
- Reference issue numbers in commits: "feat: implement auth (#2)"
- Keep commits atomic and focused

## Before Requesting Review

Ensure the following checklist is complete:

- [ ] All acceptance criteria from the issue are met
- [ ] Code follows project structure and conventions
- [ ] Tests are written and passing
- [ ] No TypeScript errors or linting issues
- [ ] Swagger documentation is updated
- [ ] README is updated if needed
- [ ] Security considerations are addressed
- [ ] PR description summarizes changes clearly

Only mark the PR as "Ready for review" when ALL items above are complete.
