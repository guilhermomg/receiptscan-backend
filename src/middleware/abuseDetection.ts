/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import logger from '../config/logger';
import { auditLogger, AuditAction } from '../services/audit.service';

/**
 * In-memory store for tracking IP abuse
 * In production, consider using Redis for distributed tracking
 */
interface IPTracker {
  failedAttempts: number;
  firstFailureTime: number;
  blockedUntil?: number;
}

const ipTracking = new Map<string, IPTracker>();

// Configuration
const MAX_FAILED_ATTEMPTS = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const INITIAL_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get client IP address from request
 */
const getClientIP = (req: Request): string => {
  // Check X-Forwarded-For header (when behind proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Fallback to req.ip
  return req.ip || 'unknown';
};

/**
 * Calculate block duration with exponential backoff
 */
const calculateBlockDuration = (failedAttempts: number): number => {
  const duration = INITIAL_BLOCK_DURATION_MS * Math.pow(2, failedAttempts - MAX_FAILED_ATTEMPTS);
  return Math.min(duration, MAX_BLOCK_DURATION_MS);
};

/**
 * Clean up old entries from IP tracking (runs periodically)
 */
const cleanupOldEntries = () => {
  const now = Date.now();
  for (const [ip, tracker] of ipTracking.entries()) {
    // Remove unblocked IPs that haven't had failures in the window
    if (!tracker.blockedUntil && now - tracker.firstFailureTime > FAILURE_WINDOW_MS * 2) {
      ipTracking.delete(ip);
    }
    // Remove IPs that have been unblocked for a while
    if (tracker.blockedUntil && now > tracker.blockedUntil + FAILURE_WINDOW_MS) {
      ipTracking.delete(ip);
    }
  }
};

// Clean up every hour
setInterval(cleanupOldEntries, 60 * 60 * 1000);

/**
 * Record a failed attempt for an IP
 */
export const recordFailedAttempt = (req: Request, reason: string): void => {
  const ip = getClientIP(req);
  const now = Date.now();

  let tracker = ipTracking.get(ip);

  if (!tracker) {
    tracker = {
      failedAttempts: 1,
      firstFailureTime: now,
    };
  } else {
    // Reset counter if outside the failure window
    if (now - tracker.firstFailureTime > FAILURE_WINDOW_MS) {
      tracker.failedAttempts = 1;
      tracker.firstFailureTime = now;
      delete tracker.blockedUntil;
    } else {
      tracker.failedAttempts++;
    }
  }

  ipTracking.set(ip, tracker);

  // Block IP if threshold exceeded
  if (tracker.failedAttempts >= MAX_FAILED_ATTEMPTS && !tracker.blockedUntil) {
    const blockDuration = calculateBlockDuration(tracker.failedAttempts);
    tracker.blockedUntil = now + blockDuration;

    logger.warn('IP blocked due to repeated failures', {
      ip,
      failedAttempts: tracker.failedAttempts,
      blockDurationMs: blockDuration,
      reason,
    });

    // Log to audit
    auditLogger.log({
      action: AuditAction.SECURITY_IP_BLOCKED,
      ip,
      success: false,
      metadata: {
        failedAttempts: tracker.failedAttempts,
        blockDurationMs: blockDuration,
        reason,
      },
    });
  }

  logger.debug('Failed attempt recorded', {
    ip,
    failedAttempts: tracker.failedAttempts,
    reason,
  });
};

/**
 * Check if IP is currently blocked
 */
export const isIPBlocked = (req: Request): boolean => {
  const ip = getClientIP(req);
  const tracker = ipTracking.get(ip);

  if (!tracker || !tracker.blockedUntil) {
    return false;
  }

  const now = Date.now();

  // Check if block has expired
  if (now > tracker.blockedUntil) {
    // Unblock IP but keep tracker for future monitoring
    delete tracker.blockedUntil;
    ipTracking.set(ip, tracker);
    return false;
  }

  return true;
};

/**
 * Middleware to check if IP is blocked
 */
export const checkIPBlocked = (req: Request, _res: Response, next: NextFunction) => {
  if (isIPBlocked(req)) {
    const ip = getClientIP(req);

    logger.warn('Blocked IP attempted access', {
      ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId,
    });

    throw new AppError(
      'Too many failed attempts. Your IP has been temporarily blocked. Please try again later.',
      403
    );
  }

  next();
};

/**
 * Reset failed attempts for an IP (on successful authentication)
 */
export const resetFailedAttempts = (req: Request): void => {
  const ip = getClientIP(req);
  ipTracking.delete(ip);

  logger.debug('Failed attempts reset', { ip });
};

/**
 * Get IP tracking statistics (for monitoring/admin)
 */
export const getIPTrackingStats = (): {
  totalTracked: number;
  blocked: number;
  tracking: { ip: string; failedAttempts: number; blocked: boolean }[];
} => {
  const now = Date.now();
  const stats = {
    totalTracked: ipTracking.size,
    blocked: 0,
    tracking: [] as { ip: string; failedAttempts: number; blocked: boolean }[],
  };

  for (const [ip, tracker] of ipTracking.entries()) {
    const blocked = !!tracker.blockedUntil && now < tracker.blockedUntil;
    if (blocked) {
      stats.blocked++;
    }
    stats.tracking.push({
      ip,
      failedAttempts: tracker.failedAttempts,
      blocked,
    });
  }

  return stats;
};
