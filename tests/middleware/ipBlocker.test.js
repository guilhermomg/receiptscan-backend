const express = require('express');
const request = require('supertest');
const {
  checkIPBlock,
  trackFailure,
  trackFailedAttempt,
  isIPBlocked,
  blockIP,
  unblockIP,
  getAbuseStats
} = require('../../src/middleware/ipBlocker');

describe('IP Blocker Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Clear any existing blocks
    const stats = getAbuseStats();
    stats.blockedIPs.forEach(ip => unblockIP(ip));
  });

  describe('checkIPBlock', () => {
    it('should allow non-blocked IPs', async () => {
      app.use(checkIPBlock);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });

    it('should block manually blocked IPs', async () => {
      // Supertest uses ::ffff:127.0.0.1 format
      const testIP = '::ffff:127.0.0.1';
      blockIP(testIP);

      app.use(checkIPBlock);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access forbidden');

      // Cleanup
      unblockIP(testIP);
    });
  });

  describe('trackFailure', () => {
    it('should track failed requests', async () => {
      app.use(trackFailure);
      app.get('/test', (req, res) => res.status(401).json({ error: 'Unauthorized' }));

      await request(app).get('/test');

      const stats = getAbuseStats();
      expect(stats.totalAttempts).toBeGreaterThan(0);
    });

    it('should not track successful requests', async () => {
      const initialStats = getAbuseStats();
      const initialAttempts = initialStats.totalAttempts;

      app.use(trackFailure);
      app.get('/test', (req, res) => res.json({ success: true }));

      await request(app).get('/test');

      const finalStats = getAbuseStats();
      // Successful requests shouldn't increase attempt count significantly
      expect(finalStats.totalAttempts).toBe(initialAttempts);
    });
  });

  describe('trackFailedAttempt', () => {
    it('should track attempts for an IP', () => {
      const testIP = '192.168.1.100';
      
      trackFailedAttempt(testIP);
      
      const stats = getAbuseStats();
      expect(stats.trackedIPs).toBeGreaterThan(0);
    });

    it('should block IP after max attempts', () => {
      const testIP = '192.168.1.101';
      
      // Track multiple failed attempts
      for (let i = 0; i < 11; i++) {
        trackFailedAttempt(testIP);
      }
      
      expect(isIPBlocked(testIP)).toBe(true);
      
      // Cleanup
      unblockIP(testIP);
    });
  });

  describe('blockIP and unblockIP', () => {
    it('should block an IP', () => {
      const testIP = '192.168.1.102';
      
      blockIP(testIP);
      expect(isIPBlocked(testIP)).toBe(true);
      
      unblockIP(testIP);
    });

    it('should unblock an IP', () => {
      const testIP = '192.168.1.103';
      
      blockIP(testIP);
      expect(isIPBlocked(testIP)).toBe(true);
      
      unblockIP(testIP);
      expect(isIPBlocked(testIP)).toBe(false);
    });
  });

  describe('isIPBlocked', () => {
    it('should return false for non-blocked IP', () => {
      expect(isIPBlocked('192.168.1.200')).toBe(false);
    });

    it('should return true for blocked IP', () => {
      const testIP = '192.168.1.104';
      
      blockIP(testIP);
      expect(isIPBlocked(testIP)).toBe(true);
      
      unblockIP(testIP);
    });
  });

  describe('getAbuseStats', () => {
    it('should return statistics object', () => {
      const stats = getAbuseStats();
      
      expect(stats).toHaveProperty('blockedIPs');
      expect(stats).toHaveProperty('trackedIPs');
      expect(stats).toHaveProperty('totalAttempts');
      expect(Array.isArray(stats.blockedIPs)).toBe(true);
      expect(typeof stats.trackedIPs).toBe('number');
      expect(typeof stats.totalAttempts).toBe('number');
    });
  });
});
