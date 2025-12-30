# ReceiptScan Backend API

AI-powered receipt scanning and expense tracking API for receiptscan.ai with comprehensive security features.

## 🔒 Security Features

This API implements industry-standard security measures to protect against common attacks and ensure data integrity:

### Implemented Security Measures

1. **Security Headers (Helmet.js)**
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options (Clickjacking protection)
   - X-Content-Type-Options (MIME sniffing protection)
   - X-XSS-Protection
   - Referrer Policy
   - Permissions Policy

2. **Rate Limiting**
   - General API: 100 requests/minute per IP
   - Upload endpoints: 10 requests/minute per IP
   - Authentication: 5 requests/15 minutes per IP
   - Exponential backoff for repeated failures

3. **Input Validation & Sanitization**
   - Request body validation with express-validator
   - MongoDB injection prevention
   - XSS attack prevention
   - Null byte removal
   - Special character sanitization

4. **CORS Configuration**
   - Whitelist-based origin validation
   - Configurable allowed origins
   - Credential support
   - Proper preflight handling

5. **IP-Based Abuse Detection**
   - Automatic IP blocking after 10 failed attempts
   - 30-minute block duration
   - Manual IP blocking/unblocking for admins
   - Abuse statistics tracking

6. **Audit Logging**
   - Sensitive operations tracking
   - User actions logging
   - IP address and timestamp recording
   - Sensitive data redaction

7. **API Key Authentication**
   - Header-based API key validation
   - Multiple trusted keys support
   - Optional and required authentication modes

8. **Request Size Limits**
   - 10MB maximum payload size
   - Protection against payload attacks

9. **Firebase Security Rules**
   - Firestore access control
   - Storage access control
   - User-based permissions
   - Admin API key validation

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Firebase project (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/guilhermomg/receiptscan-backend.git
cd receiptscan-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
TRUSTED_API_KEYS=your-secure-api-key-here
```

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📡 API Endpoints

### Public Endpoints

#### Health Check
```
GET /api/health
```
Returns server health status.

#### Receipts
```
GET    /api/receipts          - List all receipts
GET    /api/receipts/:id      - Get specific receipt
POST   /api/receipts          - Create new receipt
POST   /api/receipts/upload   - Upload receipt image (10 req/min limit)
PUT    /api/receipts/:id      - Update receipt
DELETE /api/receipts/:id      - Delete receipt
```

### Admin Endpoints (API Key Required)

```
GET  /api/admin/audit-logs    - Get audit logs
GET  /api/admin/abuse-stats   - Get IP abuse statistics
POST /api/admin/block-ip      - Block an IP address
POST /api/admin/unblock-ip    - Unblock an IP address
```

## 🔑 Authentication

### API Key Authentication

Add API key to request headers:
```
X-API-Key: your-api-key-here
```

Example with curl:
```bash
curl -H "X-API-Key: your-api-key" https://api.receiptscan.ai/api/admin/audit-logs
```

## 🛡️ Security Configuration

### Rate Limits

Configure rate limits via environment variables:

```env
RATE_LIMIT_WINDOW_MS=60000        # 1 minute
RATE_LIMIT_MAX_REQUESTS=100       # General endpoints
RATE_LIMIT_UPLOAD_MAX=10          # Upload endpoints
```

### CORS Configuration

Set allowed origins (comma-separated):
```env
ALLOWED_ORIGINS=https://app.receiptscan.ai,https://receiptscan.ai
```

### API Keys

Add trusted API keys (comma-separated):
```env
TRUSTED_API_KEYS=key1,key2,key3
```

### Firebase Security Rules

Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

Deploy Storage rules:
```bash
firebase deploy --only storage
```

## 📊 Monitoring & Logging

### Audit Logs

All sensitive operations are automatically logged:
- Receipt creation/deletion
- Billing changes
- IP blocking/unblocking
- Admin actions

Access audit logs via:
```
GET /api/admin/audit-logs?operation=create_receipt&startDate=2024-01-01
```

### Abuse Statistics

Monitor IP-based abuse:
```
GET /api/admin/abuse-stats
```

Returns:
```json
{
  "blockedIPs": ["192.168.1.100"],
  "trackedIPs": 5,
  "totalAttempts": 15
}
```

## 🧪 Testing

The project includes comprehensive tests for:

- Rate limiting functionality
- Security headers
- Input validation and sanitization
- Audit logging
- IP blocking
- API key authentication
- Integration tests for all endpoints

Test coverage threshold: 70%

## 🚢 Deployment

### Environment Variables

Required for production:
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` (specific domains only, no wildcards)
- `TRUSTED_API_KEYS` (strong, random keys)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure specific `ALLOWED_ORIGINS` (no wildcards)
- [ ] Generate strong API keys
- [ ] Enable HTTPS/TLS
- [ ] Configure Firebase Security Rules
- [ ] Set up monitoring and alerting
- [ ] Enable audit logging
- [ ] Configure rate limits appropriately
- [ ] Set up IP allowlisting for admin endpoints

### Recommended Infrastructure

- Use a reverse proxy (nginx, Cloudflare)
- Enable DDoS protection
- Set up Web Application Firewall (WAF)
- Use Redis for rate limiting in production
- Implement proper logging infrastructure
- Set up alerting for security events

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please ensure all security tests pass before submitting PRs.

## 🔗 Related Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
