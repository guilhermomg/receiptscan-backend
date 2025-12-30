const request = require('supertest');
const express = require('express');
const { generalLimiter, uploadLimiter, authLimiter } = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('generalLimiter', () => {
    it('should allow requests within rate limit', async () => {
      app.use(generalLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include rate limit headers', async () => {
      app.use(generalLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should block requests exceeding rate limit', async () => {
      // Create a limiter with very low limit for testing
      const testLimiter = require('express-rate-limit')({
        windowMs: 60000,
        max: 2
      });

      app.use(testLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // First request should succeed
      await request(app).get('/test').expect(200);
      
      // Second request should succeed
      await request(app).get('/test').expect(200);
      
      // Third request should be rate limited
      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
    }, 10000);
  });

  describe('uploadLimiter', () => {
    it('should have stricter limits than general limiter', async () => {
      app.use(uploadLimiter);
      app.post('/upload', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/upload');
      expect(response.status).toBe(200);
      
      // Upload limiter should have lower limit
      const limitHeader = response.headers['ratelimit-limit'];
      expect(parseInt(limitHeader)).toBeLessThanOrEqual(10);
    });
  });

  describe('authLimiter', () => {
    it('should allow authentication requests', async () => {
      app.use(authLimiter);
      app.post('/auth', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/auth');
      expect(response.status).toBe(200);
    });

    it('should have strict limits for auth endpoints', async () => {
      app.use(authLimiter);
      app.post('/auth', (req, res) => res.json({ success: true }));

      const response = await request(app).post('/auth');
      const limitHeader = response.headers['ratelimit-limit'];
      expect(parseInt(limitHeader)).toBeLessThanOrEqual(5);
    });
  });
});
