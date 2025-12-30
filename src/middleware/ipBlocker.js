/**
 * IP-based abuse detection and blocking middleware
 * Tracks failed requests and blocks IPs that exceed thresholds
 */

// In-memory store for tracking IP abuse (in production, use Redis)
const ipAttempts = new Map();
const blockedIPs = new Set();

// Configuration
const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Track failed request from an IP
 */
const trackFailedAttempt = (ip) => {
  const now = Date.now();
  
  if (!ipAttempts.has(ip)) {
    ipAttempts.set(ip, []);
  }
  
  const attempts = ipAttempts.get(ip);
  
  // Remove attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < ATTEMPT_WINDOW_MS);
  recentAttempts.push(now);
  
  ipAttempts.set(ip, recentAttempts);
  
  // Check if IP should be blocked
  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    blockIP(ip);
    return true;
  }
  
  return false;
};

/**
 * Block an IP address
 */
const blockIP = (ip) => {
  blockedIPs.add(ip);
  console.warn(`[Security] IP blocked due to abuse: ${ip}`);
  
  // Automatically unblock after duration
  setTimeout(() => {
    unblockIP(ip);
  }, BLOCK_DURATION_MS);
};

/**
 * Unblock an IP address
 */
const unblockIP = (ip) => {
  blockedIPs.delete(ip);
  ipAttempts.delete(ip);
  console.info(`[Security] IP unblocked: ${ip}`);
};

/**
 * Check if IP is blocked
 */
const isIPBlocked = (ip) => {
  return blockedIPs.has(ip);
};

/**
 * Middleware to check if IP is blocked
 */
const checkIPBlock = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (isIPBlocked(ip)) {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'Your IP has been temporarily blocked due to suspicious activity. Please try again later.',
      blockedUntil: Date.now() + BLOCK_DURATION_MS
    });
  }
  
  next();
};

/**
 * Middleware to track failed requests
 * Use this after authentication or validation failures
 */
const trackFailure = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Track failures (4xx errors)
    if (res.statusCode >= 400 && res.statusCode < 500) {
      const ip = req.ip || req.connection.remoteAddress;
      const blocked = trackFailedAttempt(ip);
      
      if (blocked) {
        return res.status(403).json({
          error: 'Access forbidden',
          message: 'Your IP has been temporarily blocked due to suspicious activity.',
          blockedUntil: Date.now() + BLOCK_DURATION_MS
        });
      }
    }
    
    return originalJson(data);
  };
  
  next();
};

/**
 * Get abuse statistics
 */
const getAbuseStats = () => {
  return {
    blockedIPs: Array.from(blockedIPs),
    trackedIPs: ipAttempts.size,
    totalAttempts: Array.from(ipAttempts.values()).reduce((sum, attempts) => sum + attempts.length, 0)
  };
};

/**
 * Manual IP blocking/unblocking (for admin use)
 */
const manualBlockIP = (ip) => {
  blockIP(ip);
};

const manualUnblockIP = (ip) => {
  unblockIP(ip);
};

module.exports = {
  checkIPBlock,
  trackFailure,
  trackFailedAttempt,
  isIPBlocked,
  blockIP,
  unblockIP,
  getAbuseStats,
  manualBlockIP,
  manualUnblockIP
};
