const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { auditLog, getAuditLogs } = require('../middleware/auditLog');
const { getAbuseStats, manualBlockIP, manualUnblockIP } = require('../middleware/ipBlocker');

/**
 * GET /api/admin/audit-logs
 * Get audit logs (admin only)
 */
router.get('/audit-logs',
  apiKeyAuth,
  (req, res) => {
    const filters = {
      operation: req.query.operation,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const logs = getAuditLogs(filters);
    
    res.json({
      total: logs.length,
      logs: logs.slice(0, 100) // Limit to 100 most recent
    });
  }
);

/**
 * GET /api/admin/abuse-stats
 * Get IP abuse statistics (admin only)
 */
router.get('/abuse-stats',
  apiKeyAuth,
  (req, res) => {
    const stats = getAbuseStats();
    res.json(stats);
  }
);

/**
 * POST /api/admin/block-ip
 * Manually block an IP address (admin only)
 */
router.post('/block-ip',
  apiKeyAuth,
  auditLog('manual_ip_block'),
  (req, res) => {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'IP address is required'
      });
    }
    
    manualBlockIP(ip);
    
    res.json({
      message: 'IP address blocked successfully',
      ip
    });
  }
);

/**
 * POST /api/admin/unblock-ip
 * Manually unblock an IP address (admin only)
 */
router.post('/unblock-ip',
  apiKeyAuth,
  auditLog('manual_ip_unblock'),
  (req, res) => {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'IP address is required'
      });
    }
    
    manualUnblockIP(ip);
    
    res.json({
      message: 'IP address unblocked successfully',
      ip
    });
  }
);

module.exports = router;
