const { auditLog, getAuditLogs, pruneAuditLogs } = require('../../src/middleware/auditLog');
const express = require('express');
const request = require('supertest');

describe('Audit Log Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('auditLog', () => {
    it('should log operations', async () => {
      app.post('/test',
        auditLog('test_operation'),
        (req, res) => res.json({ success: true })
      );

      await request(app)
        .post('/test')
        .send({ data: 'test' });

      const logs = getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const lastLog = logs[0];
      expect(lastLog.operation).toBe('test_operation');
      expect(lastLog.method).toBe('POST');
      expect(lastLog.path).toBe('/test');
    });

    it('should capture request body', async () => {
      app.post('/test',
        auditLog('test_operation'),
        (req, res) => res.json({ success: true })
      );

      await request(app)
        .post('/test')
        .send({ username: 'john', action: 'create' });

      const logs = getAuditLogs();
      const lastLog = logs[0];
      
      expect(lastLog.requestBody).toHaveProperty('username', 'john');
      expect(lastLog.requestBody).toHaveProperty('action', 'create');
    });

    it('should redact sensitive fields', async () => {
      app.post('/test',
        auditLog('test_operation'),
        (req, res) => res.json({ success: true })
      );

      await request(app)
        .post('/test')
        .send({ 
          username: 'john',
          password: 'secret123',
          apiKey: 'key123'
        });

      const logs = getAuditLogs();
      const lastLog = logs[0];
      
      expect(lastLog.requestBody.password).toBe('***REDACTED***');
      expect(lastLog.requestBody.apiKey).toBe('***REDACTED***');
      expect(lastLog.requestBody.username).toBe('john');
    });

    it('should capture response status', async () => {
      app.post('/test',
        auditLog('test_operation'),
        (req, res) => res.status(201).json({ success: true })
      );

      await request(app).post('/test');

      const logs = getAuditLogs();
      const lastLog = logs[0];
      
      expect(lastLog.statusCode).toBe(201);
      expect(lastLog.success).toBe(true);
    });

    it('should track response time', async () => {
      app.post('/test',
        auditLog('test_operation'),
        (req, res) => {
          setTimeout(() => res.json({ success: true }), 10);
        }
      );

      await request(app).post('/test');

      const logs = getAuditLogs();
      const lastLog = logs[0];
      
      expect(lastLog).toHaveProperty('responseTime');
      expect(lastLog.responseTime).toBeGreaterThan(0);
    });
  });

  describe('getAuditLogs', () => {
    beforeEach(async () => {
      app.post('/test',
        auditLog('test_operation'),
        (req, res) => res.json({ success: true })
      );

      // Create some test logs
      await request(app).post('/test').send({ id: 1 });
      await request(app).post('/test').send({ id: 2 });
    });

    it('should retrieve all logs without filters', () => {
      const logs = getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should filter logs by operation', () => {
      const logs = getAuditLogs({ operation: 'test_operation' });
      expect(logs.every(log => log.operation === 'test_operation')).toBe(true);
    });

    it('should sort logs by timestamp descending', () => {
      const logs = getAuditLogs();
      
      if (logs.length > 1) {
        for (let i = 0; i < logs.length - 1; i++) {
          const currentTime = new Date(logs[i].timestamp).getTime();
          const nextTime = new Date(logs[i + 1].timestamp).getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      }
    });
  });

  describe('pruneAuditLogs', () => {
    it('should not throw error when called', () => {
      expect(() => pruneAuditLogs()).not.toThrow();
    });
  });
});
