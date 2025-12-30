const { v4: uuidv4 } = require('uuid');

// In-memory store for audit logs (in production, use a database or logging service)
const auditLogs = [];

/**
 * Audit logging middleware for sensitive operations
 * Logs: user actions, IP addresses, timestamps, and operation details
 */
const auditLog = (operation) => {
  return (req, res, next) => {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      operation,
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.uid || 'anonymous',
      requestBody: sanitizeForLogging(req.body),
      query: req.query
    };

    // Store the original res.json to capture response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      logEntry.statusCode = res.statusCode;
      logEntry.success = res.statusCode >= 200 && res.statusCode < 300;
      logEntry.responseTime = Date.now() - req._startTime;
      
      // Store audit log
      auditLogs.push(logEntry);
      
      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Audit Log]', JSON.stringify(logEntry, null, 2));
      }
      
      // In production, send to logging service (e.g., Cloud Logging, Elasticsearch)
      if (process.env.AUDIT_LOG_ENABLED === 'true') {
        // TODO: Implement persistent logging
        // sendToLoggingService(logEntry);
      }
      
      return originalJson(data);
    };

    // Track request start time
    req._startTime = Date.now();
    
    next();
  };
};

/**
 * Sanitize sensitive data before logging
 */
function sanitizeForLogging(data) {
  if (!data) return data;
  
  const sanitized = JSON.parse(JSON.stringify(data));
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn'];
  
  const redact = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        redact(obj[key]);
      }
    }
    
    return obj;
  };
  
  return redact(sanitized);
}

/**
 * Get audit logs (for admin/monitoring purposes)
 */
const getAuditLogs = (filters = {}) => {
  let logs = [...auditLogs];
  
  if (filters.operation) {
    logs = logs.filter(log => log.operation === filters.operation);
  }
  
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  
  if (filters.startDate) {
    logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Clear old audit logs (keep last 10000 entries)
 */
const pruneAuditLogs = () => {
  if (auditLogs.length > 10000) {
    auditLogs.splice(0, auditLogs.length - 10000);
  }
};

// Prune logs every hour
setInterval(pruneAuditLogs, 60 * 60 * 1000);

module.exports = {
  auditLog,
  getAuditLogs,
  pruneAuditLogs
};
