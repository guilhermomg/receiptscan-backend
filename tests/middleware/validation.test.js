const express = require('express');
const request = require('supertest');
const {
  sanitizeInputs,
  sanitizeRequest,
  handleValidationErrors,
  receiptValidationRules,
  userValidationRules,
  idValidationRules
} = require('../../src/middleware/validation');

describe('Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(sanitizeInputs);
    app.use(sanitizeRequest);
  });

  describe('sanitizeInputs', () => {
    it('should sanitize MongoDB injection attempts', async () => {
      app.post('/test', (req, res) => res.json(req.body));

      const response = await request(app)
        .post('/test')
        .send({ username: { $gt: '' }, password: 'test' });

      // MongoDB operators should be replaced
      expect(response.body.username).not.toHaveProperty('$gt');
    });

    it('should allow clean inputs', async () => {
      app.post('/test', (req, res) => res.json(req.body));

      const response = await request(app)
        .post('/test')
        .send({ username: 'john', password: 'secret' });

      expect(response.body).toEqual({ username: 'john', password: 'secret' });
    });
  });

  describe('sanitizeRequest', () => {
    it('should remove null bytes from strings', async () => {
      app.post('/test', (req, res) => res.json(req.body));

      const response = await request(app)
        .post('/test')
        .send({ data: 'test\u0000string' });

      expect(response.body.data).not.toContain('\u0000');
    });

    it('should trim whitespace', async () => {
      app.post('/test', (req, res) => res.json(req.body));

      const response = await request(app)
        .post('/test')
        .send({ data: '  test  ' });

      expect(response.body.data).toBe('test');
    });

    it('should handle nested objects', async () => {
      app.post('/test', (req, res) => res.json(req.body));

      const response = await request(app)
        .post('/test')
        .send({ 
          user: { 
            name: '  John  ',
            email: '  test@example.com  ' 
          } 
        });

      expect(response.body.user.name).toBe('John');
      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('receiptValidationRules', () => {
    beforeEach(() => {
      app.post('/receipt', 
        receiptValidationRules(),
        handleValidationErrors,
        (req, res) => res.json({ success: true })
      );
    });

    it('should accept valid receipt data', async () => {
      const response = await request(app)
        .post('/receipt')
        .send({
          title: 'Grocery Shopping',
          amount: 50.99,
          date: '2024-01-15T10:00:00Z',
          category: 'Food'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject receipt without title', async () => {
      const response = await request(app)
        .post('/receipt')
        .send({
          amount: 50.99
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject negative amounts', async () => {
      const response = await request(app)
        .post('/receipt')
        .send({
          title: 'Test',
          amount: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject title exceeding max length', async () => {
      const response = await request(app)
        .post('/receipt')
        .send({
          title: 'a'.repeat(201),
          amount: 50
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('userValidationRules', () => {
    beforeEach(() => {
      app.post('/user',
        userValidationRules(),
        handleValidationErrors,
        (req, res) => res.json({ success: true })
      );
    });

    it('should accept valid email', async () => {
      const response = await request(app)
        .post('/user')
        .send({
          email: 'test@example.com',
          name: 'John Doe'
        });

      expect(response.status).toBe(200);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/user')
        .send({
          email: 'invalid-email',
          name: 'John Doe'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should normalize email', async () => {
      app.post('/user-echo',
        userValidationRules(),
        handleValidationErrors,
        (req, res) => res.json(req.body)
      );

      const response = await request(app)
        .post('/user-echo')
        .send({
          email: 'Test@Example.Com'
        });

      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('idValidationRules', () => {
    beforeEach(() => {
      app.get('/item/:id',
        idValidationRules(),
        handleValidationErrors,
        (req, res) => res.json({ id: req.params.id })
      );
    });

    it('should accept valid alphanumeric ID', async () => {
      const response = await request(app).get('/item/abc123');
      expect(response.status).toBe(200);
    });

    it('should accept ID with hyphens and underscores', async () => {
      const response = await request(app).get('/item/abc-123_xyz');
      expect(response.status).toBe(200);
    });

    it('should reject ID with special characters', async () => {
      const response = await request(app).get('/item/abc@123');
      expect(response.status).toBe(400);
    });
  });
});
