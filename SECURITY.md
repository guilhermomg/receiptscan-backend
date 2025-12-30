# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ReceiptScan Backend API, please report it by emailing [security@receiptscan.ai] or opening a private security advisory on GitHub.

**Please do not report security vulnerabilities through public GitHub issues.**

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

This API implements comprehensive security measures:

### 1. Authentication & Authorization
- API key authentication for protected endpoints
- Firebase Authentication integration ready
- Role-based access control
- Secure session management

### 2. Rate Limiting
- General API: 100 requests/minute per IP
- Upload endpoints: 10 requests/minute per IP
- Authentication: 5 requests/15 minutes per IP
- Automatic exponential backoff

### 3. Input Validation & Sanitization
- Request body validation (express-validator)
- MongoDB injection prevention (express-mongo-sanitize)
- XSS attack prevention
- Null byte removal
- Special character sanitization
- Maximum length enforcement

### 4. Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection
- Referrer Policy
- Permissions Policy

### 5. Network Security
- CORS whitelist configuration
- IP-based abuse detection and blocking
- Request size limits (10MB)
- DDoS protection ready

### 6. Audit & Monitoring
- Comprehensive audit logging
- Sensitive data redaction
- Security event tracking
- IP address logging

### 7. Data Protection
- Firebase Security Rules
- Encryption in transit (HTTPS/TLS)
- Sensitive field redaction in logs
- Environment variable security

## Security Best Practices

### For Deployment

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong, random API keys
   - Rotate keys regularly
   - Use secrets management service in production

2. **Network Configuration**
   - Enable HTTPS/TLS (minimum TLS 1.2)
   - Use reverse proxy (nginx, Cloudflare)
   - Configure Web Application Firewall (WAF)
   - Enable DDoS protection

3. **Access Control**
   - Implement least privilege principle
   - Use API key rotation
   - Monitor and audit access logs
   - Implement IP allowlisting for admin endpoints

4. **Monitoring**
   - Set up security event alerting
   - Monitor rate limit violations
   - Track failed authentication attempts
   - Review audit logs regularly

5. **Database Security**
   - Use Firebase Security Rules
   - Implement row-level security
   - Encrypt sensitive data at rest
   - Regular security audits

### For Development

1. **Dependencies**
   - Keep dependencies up to date
   - Run `npm audit` regularly
   - Review security advisories
   - Use `npm audit fix` for automated fixes

2. **Code Quality**
   - Follow secure coding practices
   - Use ESLint for code quality
   - Implement input validation everywhere
   - Never log sensitive data

3. **Testing**
   - Write security tests
   - Test rate limiting
   - Test input validation
   - Test authentication/authorization

## Security Checklist

Before deploying to production:

- [ ] All environment variables configured securely
- [ ] HTTPS/TLS enabled (minimum TLS 1.2)
- [ ] Strong API keys generated and configured
- [ ] CORS configured with specific origins (no wildcards)
- [ ] Rate limits appropriate for production traffic
- [ ] Firebase Security Rules deployed
- [ ] Audit logging enabled
- [ ] Security headers configured
- [ ] Request size limits set appropriately
- [ ] IP allowlisting configured for admin endpoints
- [ ] Monitoring and alerting configured
- [ ] All tests passing
- [ ] Security review completed
- [ ] `npm audit` shows no vulnerabilities
- [ ] Documentation reviewed and updated

## Known Security Considerations

1. **In-Memory Storage**: Current implementation uses in-memory storage for:
   - Rate limiting counters
   - IP blocking lists
   - Audit logs
   
   **Production Recommendation**: Use Redis or similar for distributed systems.

2. **API Keys**: Current implementation uses simple API key matching.
   
   **Production Recommendation**: Implement hashed API keys with secure comparison.

3. **Audit Logs**: Current implementation stores logs in memory.
   
   **Production Recommendation**: Use persistent storage (database, Cloud Logging, Elasticsearch).

## Compliance

This API is designed to help meet common security compliance requirements:

- OWASP Top 10 protections
- PCI DSS (for payment processing)
- GDPR (data protection)
- HIPAA (healthcare data) - with additional controls
- SOC 2 - with proper logging and monitoring

## Updates & Patches

Security updates are released as needed. Subscribe to GitHub releases or watch this repository for notifications.

To update to the latest secure version:

```bash
npm update
npm audit fix
```

## Contact

For security concerns or questions:
- Email: [security@receiptscan.ai]
- GitHub Security Advisories: https://github.com/guilhermomg/receiptscan-backend/security/advisories

## Acknowledgments

We appreciate responsible disclosure of security vulnerabilities. Security researchers who report vulnerabilities will be acknowledged in our security advisories (with permission).
