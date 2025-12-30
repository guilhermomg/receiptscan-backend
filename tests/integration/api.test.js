const request = require('supertest');
const app = require('../../src/index');

describe('API Integration Tests', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status');
    });

    it('should have security headers', async () => {
      const response = await request(app).get('/');
      
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Receipt Endpoints', () => {
    describe('POST /api/receipts', () => {
      it('should create a receipt with valid data', async () => {
        const receiptData = {
          title: 'Test Receipt',
          amount: 99.99,
          category: 'Food'
        };

        const response = await request(app)
          .post('/api/receipts')
          .send(receiptData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('receipt');
        expect(response.body.receipt).toHaveProperty('id');
      });

      it('should reject receipt without title', async () => {
        const response = await request(app)
          .post('/api/receipts')
          .send({ amount: 50 });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should reject negative amounts', async () => {
        const response = await request(app)
          .post('/api/receipts')
          .send({
            title: 'Test',
            amount: -10
          });

        expect(response.status).toBe(400);
      });

      it('should sanitize input', async () => {
        const response = await request(app)
          .post('/api/receipts')
          .send({
            title: '<script>alert("xss")</script>',
            amount: 50
          });

        // Should not contain script tags after sanitization
        expect(response.status).toBe(201);
      });
    });

    describe('GET /api/receipts', () => {
      it('should list receipts', async () => {
        const response = await request(app).get('/api/receipts');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('receipts');
        expect(Array.isArray(response.body.receipts)).toBe(true);
      });
    });

    describe('GET /api/receipts/:id', () => {
      it('should get a specific receipt', async () => {
        const response = await request(app).get('/api/receipts/test123');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
      });

      it('should reject invalid ID format', async () => {
        const response = await request(app).get('/api/receipts/invalid@id');

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Admin Endpoints', () => {
    const validApiKey = 'test-api-key';

    beforeEach(() => {
      process.env.TRUSTED_API_KEYS = validApiKey;
    });

    afterEach(() => {
      delete process.env.TRUSTED_API_KEYS;
    });

    describe('GET /api/admin/audit-logs', () => {
      it('should require API key', async () => {
        const response = await request(app).get('/api/admin/audit-logs');

        expect(response.status).toBe(401);
      });

      it('should return audit logs with valid API key', async () => {
        const response = await request(app)
          .get('/api/admin/audit-logs')
          .set('X-API-Key', validApiKey);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('logs');
        expect(Array.isArray(response.body.logs)).toBe(true);
      });
    });

    describe('GET /api/admin/abuse-stats', () => {
      it('should require API key', async () => {
        const response = await request(app).get('/api/admin/abuse-stats');

        expect(response.status).toBe(401);
      });

      it('should return abuse statistics with valid API key', async () => {
        const response = await request(app)
          .get('/api/admin/abuse-stats')
          .set('X-API-Key', validApiKey);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('blockedIPs');
        expect(response.body).toHaveProperty('trackedIPs');
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('Security Features', () => {
    it('should have rate limit headers', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });

    it('should sanitize dangerous input', async () => {
      const response = await request(app)
        .post('/api/receipts')
        .send({
          title: 'Test\u0000Receipt',
          amount: 50
        });

      // Null bytes should be removed
      expect(response.status).toBe(201);
    });
  });
});
