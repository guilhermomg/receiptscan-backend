# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in receiptscan-backend, please report it by emailing security@receiptscan.ai. Please do not open public GitHub issues for security vulnerabilities.

**Please include the following information:**
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if applicable)

We will respond within 48 hours and work with you to address the issue.

## Firebase Security Rules

### Firestore Security Rules

The following security rules should be configured in the Firebase Console for Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      // Users can read and write their own profile
      allow read, write: if isOwner(userId);
      // Admins can read all user profiles
      allow read: if isAdmin();
    }

    // Receipts collection
    match /receipts/{receiptId} {
      // Users can only access their own receipts
      allow read, write: if isAuthenticated() && 
                           resource.data.userId == request.auth.uid;
      // On create, ensure userId matches authenticated user
      allow create: if isAuthenticated() && 
                      request.resource.data.userId == request.auth.uid;
      // Admins can read all receipts
      allow read: if isAdmin();
    }

    // Audit logs collection
    match /auditLogs/{logId} {
      // Only allow server-side writes (via Admin SDK)
      allow read: if false;
      allow write: if false;
    }

    // API Keys collection
    match /apiKeys/{keyId} {
      // Users can read their own API keys
      allow read: if isAuthenticated() && 
                    resource.data.userId == request.auth.uid;
      // Only allow server-side writes (via Admin SDK)
      allow write: if false;
    }

    // Usage tracking collection
    match /usage/{userId} {
      // Users can read their own usage data
      allow read: if isOwner(userId);
      // Only allow server-side writes (via Admin SDK)
      allow write: if false;
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Firebase Storage Security Rules

The following security rules should be configured in the Firebase Console for Cloud Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidReceiptImage() {
      return request.resource.size < 10 * 1024 * 1024 && // Max 10MB
             (request.resource.contentType.matches('image/.*') ||
              request.resource.contentType == 'application/pdf');
    }

    // Receipt images: receipts/{userId}/{receiptId}/{filename}
    match /receipts/{userId}/{receiptId}/{filename} {
      // Users can upload files to their own directory
      allow create: if isOwner(userId) && isValidReceiptImage();
      
      // Users can read files from their own directory
      allow read: if isOwner(userId);
      
      // Users can delete files from their own directory
      allow delete: if isOwner(userId);
      
      // No updates allowed (delete and recreate instead)
      allow update: if false;
    }

    // Export files: exports/{userId}/{filename}
    match /exports/{userId}/{filename} {
      // Users can read their own exports
      allow read: if isOwner(userId);
      
      // Only allow server-side writes (via Admin SDK)
      allow write: if false;
    }

    // Deny all other access by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Deploying Security Rules

To deploy Firestore indexes and security rules:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy indexes
firebase deploy --only firestore:indexes
```

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use environment variables for all sensitive configuration
2. **Validate all inputs**: Use Zod schemas for request validation
3. **Sanitize user inputs**: The sanitization middleware is applied automatically
4. **Use parameterized queries**: Always use Firestore's built-in query methods
5. **Check authorization**: Verify user ownership before performing operations
6. **Log security events**: Use the audit logger for sensitive operations
7. **Keep dependencies updated**: Regularly run `npm audit` and update packages

### For Deployments

1. **Use HTTPS only**: Configure HSTS headers and redirect HTTP to HTTPS
2. **Restrict CORS origins**: Only allow your production domains
3. **Set strong environment variables**: Use cryptographically secure random values
4. **Enable Cloud Firestore backups**: Configure automatic backups in Firebase Console
5. **Monitor audit logs**: Set up alerts for suspicious activity
6. **Implement rate limiting**: Use the provided rate limiters on all endpoints
7. **Use Firebase App Check**: Add an additional layer of protection against abuse

### Monitoring Security Events

Query audit logs for security events:

```typescript
import { auditLogger } from './services/audit.service';

// Get all security events (failed operations)
const securityEvents = await auditLogger.getSecurityEvents(100);

// Get rate limit violations
const rateLimitEvents = await auditLogger.getLogsByAction(
  'security.rate_limit.exceeded',
  100
);

// Get IP blocking events
const ipBlockedEvents = await auditLogger.getLogsByAction(
  'security.ip.blocked',
  100
);
```

## Compliance

This application implements security measures to help with:

- **GDPR**: User data access controls and audit logging
- **PCI DSS**: No credit card data is stored (handled by Stripe)
- **SOC 2**: Audit trails and access controls
- **HIPAA**: Not applicable (no health data is processed)

**Note**: This application provides security controls, but full compliance requires additional organizational policies and procedures.

## Third-Party Security

### Dependencies

We use the following security scanning tools:

- `npm audit`: Check for known vulnerabilities in dependencies
- GitHub Dependabot: Automatic security updates for dependencies
- Snyk (recommended): Advanced vulnerability scanning

Run security audit:
```bash
npm audit
npm audit fix  # Apply automatic fixes
```

### External Services

- **Firebase Admin SDK**: Keep updated for security patches
- **Stripe**: PCI-compliant payment processing
- **OpenAI**: API keys are never logged or exposed to clients

## Security Features Summary

✅ **Authentication**: Firebase JWT token verification  
✅ **Authorization**: User ownership checks on all resources  
✅ **Input Validation**: Zod schemas + sanitization middleware  
✅ **Rate Limiting**: Per-endpoint and IP-based limits  
✅ **Abuse Detection**: Automatic IP blocking after failed attempts  
✅ **Audit Logging**: All sensitive operations tracked  
✅ **Security Headers**: CSP, HSTS, X-Frame-Options, etc.  
✅ **CORS Protection**: Allowed origins validation  
✅ **Request Size Limits**: Prevents payload attacks  
✅ **API Key Support**: Scoped API keys with rate limits  
✅ **Secure Storage**: Firestore + Firebase Storage with rules  

## Security Roadmap

Future security enhancements:

- [ ] CAPTCHA integration for signup endpoints
- [ ] Two-factor authentication (2FA) support
- [ ] Advanced anomaly detection using ML
- [ ] Web Application Firewall (WAF) integration
- [ ] Automated security testing in CI/CD
- [ ] Regular penetration testing
- [ ] Security headers testing and reporting

## Contact

For security concerns or questions, contact: security@receiptscan.ai

Last Updated: December 2024
