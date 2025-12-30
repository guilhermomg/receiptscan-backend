const request = require('supertest');
const express = require('express');
const { securityHeaders, additionalSecurityHeaders } = require('../../src/middleware/security');

describe('Security Headers Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(securityHeaders);
    app.use(additionalSecurityHeaders);
    app.get('/test', (req, res) => res.json({ success: true }));
  });

  it('should add Helmet security headers', async () => {
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(200);
    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should add HSTS header', async () => {
    const response = await request(app).get('/test');
    
    expect(response.headers).toHaveProperty('strict-transport-security');
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
  });

  it('should add X-Frame-Options header', async () => {
    const response = await request(app).get('/test');
    
    expect(response.headers).toHaveProperty('x-frame-options');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should add X-XSS-Protection header', async () => {
    const response = await request(app).get('/test');
    
    expect(response.headers).toHaveProperty('x-xss-protection');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });

  it('should add Content-Security-Policy header', async () => {
    const response = await request(app).get('/test');
    
    expect(response.headers).toHaveProperty('content-security-policy');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('should add Permissions-Policy header', async () => {
    const response = await request(app).get('/test');
    
    expect(response.headers).toHaveProperty('permissions-policy');
  });

  it('should remove X-Powered-By header', async () => {
    const response = await request(app).get('/test');
    
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });
});
