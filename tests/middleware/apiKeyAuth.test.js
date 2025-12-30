const express = require('express');
const request = require('supertest');
const { apiKeyAuth, optionalApiKeyAuth } = require('../../src/middleware/apiKeyAuth');

describe('API Key Authentication Middleware', () => {
  let app;
  const validApiKey = 'test-api-key-123';
  const invalidApiKey = 'invalid-key';

  beforeEach(() => {
    // Set up environment for testing
    process.env.API_KEY_HEADER = 'X-API-Key';
    process.env.TRUSTED_API_KEYS = validApiKey;

    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.API_KEY_HEADER;
    delete process.env.TRUSTED_API_KEYS;
  });

  describe('apiKeyAuth', () => {
    beforeEach(() => {
      app.use(apiKeyAuth);
      app.get('/test', (req, res) => res.json({ success: true }));
    });

    it('should reject requests without API key', async () => {
      const response = await request(app).get('/test');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-API-Key', invalidApiKey);
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should accept requests with valid API key', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-API-Key', validApiKey);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should set apiKeyValid flag on request', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/test-flag', apiKeyAuth, (req, res) => {
        res.json({ apiKeyValid: req.apiKeyValid });
      });

      const response = await request(testApp)
        .get('/test-flag')
        .set('X-API-Key', validApiKey);
      
      expect(response.body.apiKeyValid).toBe(true);
    });
  });

  describe('optionalApiKeyAuth', () => {
    beforeEach(() => {
      app.use(optionalApiKeyAuth);
      app.get('/test', (req, res) => {
        res.json({ 
          success: true,
          apiKeyValid: req.apiKeyValid 
        });
      });
    });

    it('should allow requests without API key', async () => {
      const response = await request(app).get('/test');
      
      expect(response.status).toBe(200);
      expect(response.body.apiKeyValid).toBe(false);
    });

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-API-Key', invalidApiKey);
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should accept requests with valid API key', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-API-Key', validApiKey);
      
      expect(response.status).toBe(200);
      expect(response.body.apiKeyValid).toBe(true);
    });
  });

  describe('Custom API Key Header', () => {
    it('should support custom header name', async () => {
      process.env.API_KEY_HEADER = 'X-Custom-Key';
      
      const customApp = express();
      customApp.use(apiKeyAuth);
      customApp.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(customApp)
        .get('/test')
        .set('X-Custom-Key', validApiKey);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Multiple API Keys', () => {
    it('should support multiple trusted API keys', async () => {
      process.env.TRUSTED_API_KEYS = 'key1,key2,key3';
      
      const multiKeyApp = express();
      multiKeyApp.use(apiKeyAuth);
      multiKeyApp.get('/test', (req, res) => res.json({ success: true }));

      // Test each key
      const response1 = await request(multiKeyApp)
        .get('/test')
        .set('X-API-Key', 'key1');
      expect(response1.status).toBe(200);

      const response2 = await request(multiKeyApp)
        .get('/test')
        .set('X-API-Key', 'key2');
      expect(response2.status).toBe(200);

      const response3 = await request(multiKeyApp)
        .get('/test')
        .set('X-API-Key', 'key3');
      expect(response3.status).toBe(200);
    });
  });
});
