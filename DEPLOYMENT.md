# Deployment Guide

This guide covers deploying the ReceiptScan Backend API to various platforms with security best practices.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Firebase project (optional)
- Domain with SSL/TLS certificate

## Environment Configuration

### Required Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# CORS - Specific domains only, no wildcards
ALLOWED_ORIGINS=https://app.receiptscan.ai,https://receiptscan.ai

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_UPLOAD_MAX=10

# Security
API_KEY_HEADER=X-API-Key
TRUSTED_API_KEYS=<generate-strong-random-keys>

# Firebase (if using)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
```

### Generate Strong API Keys

```bash
# Generate random API key (Linux/macOS)
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Platforms

### 1. Google Cloud Run

```bash
# Build container
docker build -t gcr.io/[PROJECT-ID]/receiptscan-api .

# Push to Container Registry
docker push gcr.io/[PROJECT-ID]/receiptscan-api

# Deploy to Cloud Run
gcloud run deploy receiptscan-api \
  --image gcr.io/[PROJECT-ID]/receiptscan-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### 2. AWS Elastic Beanstalk

```bash
# Initialize EB CLI
eb init -p node.js-18 receiptscan-api

# Create environment
eb create receiptscan-prod

# Set environment variables
eb setenv NODE_ENV=production \
  ALLOWED_ORIGINS=https://receiptscan.ai \
  TRUSTED_API_KEYS=your-key

# Deploy
eb deploy
```

### 3. Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create receiptscan-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://receiptscan.ai
heroku config:set TRUSTED_API_KEYS=your-key

# Deploy
git push heroku main
```

### 4. DigitalOcean App Platform

```yaml
# app.yaml
name: receiptscan-api
services:
- name: api
  github:
    repo: guilhermomg/receiptscan-backend
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_size_slug: basic-xxs
  instance_count: 1
  envs:
  - key: NODE_ENV
    value: production
  - key: ALLOWED_ORIGINS
    value: https://receiptscan.ai
  - key: TRUSTED_API_KEYS
    scope: RUN_TIME
    type: SECRET
```

### 5. Traditional VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/guilhermomg/receiptscan-backend.git
cd receiptscan-backend

# Install dependencies
npm ci --only=production

# Create .env file
nano .env
# Add production environment variables

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start src/index.js --name receiptscan-api

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Setup nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/receiptscan-api
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name api.receiptscan.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and install SSL:
```bash
sudo ln -s /etc/nginx/sites-available/receiptscan-api /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.receiptscan.ai
sudo systemctl restart nginx
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files
COPY src ./src

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped
```

## Post-Deployment Checklist

### Security

- [ ] HTTPS/TLS configured and working
- [ ] Environment variables properly set
- [ ] Strong API keys generated
- [ ] CORS origins set to specific domains
- [ ] Rate limits appropriate for expected traffic
- [ ] Firebase Security Rules deployed
- [ ] Security headers verified (use securityheaders.com)
- [ ] Admin endpoints protected with IP allowlisting

### Monitoring

- [ ] Health check endpoint accessible
- [ ] Logging configured and working
- [ ] Audit logs being collected
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] SSL certificate monitoring
- [ ] Alerts configured for security events

### Performance

- [ ] Load testing completed
- [ ] Rate limits tested
- [ ] Response times acceptable
- [ ] Database indexes optimized (if applicable)
- [ ] CDN configured (if needed)

### Backup & Recovery

- [ ] Database backups configured
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested
- [ ] Configuration backed up

## Firebase Deployment

### Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

## Monitoring & Maintenance

### Health Checks

Regular health check endpoints:
- `GET /api/health` - Basic health status
- `GET /api/health/detailed` - Detailed system info

### Log Monitoring

Monitor these log patterns:
- `[Security]` - Security events
- `[Audit Log]` - Audit trail
- `[Error]` - Application errors

### Performance Monitoring

Key metrics to monitor:
- Request latency
- Error rate
- Rate limit hits
- Memory usage
- CPU usage

### Security Audits

Regular security tasks:
```bash
# Check for dependency vulnerabilities
npm audit

# Update dependencies
npm update

# Run security tests
npm test
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Verify `ALLOWED_ORIGINS` includes requesting domain
2. **Rate limiting too aggressive**: Adjust `RATE_LIMIT_MAX_REQUESTS`
3. **Memory issues**: Increase container/instance memory
4. **High CPU**: Check for infinite loops or inefficient code

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## Scaling

### Horizontal Scaling

For high traffic:
1. Use Redis for rate limiting (instead of in-memory)
2. Use external session store
3. Deploy multiple instances behind load balancer
4. Use CDN for static assets

### Vertical Scaling

Increase instance size if needed:
- More CPU for compute-intensive operations
- More memory for caching and in-memory operations

## Support

For deployment issues:
- Check documentation: README.md, SECURITY.md
- Review logs for error messages
- Contact support: support@receiptscan.ai
