import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { AppError } from './errorHandler';
import logger from '../config/logger';
import { recordFailedAttempt } from './abuseDetection';
import { auditLogger, AuditAction } from '../services/audit.service';

/**
 * General API rate limiter
 * Limits to 100 requests per minute per IP for all general endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use default key generator (handles IPv6 correctly)
  handler: (req, _res, _next) => {
    logger.warn('General rate limit exceeded', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId,
    });

    // Record failed attempt for abuse detection
    recordFailedAttempt(req, 'rate_limit_exceeded');

    // Log to audit
    auditLogger.logFromRequest(req, AuditAction.SECURITY_RATE_LIMIT_EXCEEDED, false, undefined, {
      limit: 100,
      window: '1 minute',
    });

    throw new AppError('Too many requests. Please try again later.', 429);
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks and webhook endpoints
    return req.path.includes('/health') || req.path.includes('/webhook');
  },
});

/**
 * Rate limiter for file upload endpoints
 * Limits to 10 uploads per minute per user (or IP if not authenticated)
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, prefix to avoid collision with IP addresses
    // Otherwise use default IP handling by returning undefined
    return req.user?.uid ? `user:${req.user.uid}` : (undefined as any);
  },
  handler: (req, _res, _next) => {
    logger.warn('Upload rate limit exceeded', {
      userId: req.user?.uid,
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId,
    });

    // Record failed attempt
    recordFailedAttempt(req, 'upload_rate_limit_exceeded');

    // Log to audit
    auditLogger.logFromRequest(req, AuditAction.SECURITY_RATE_LIMIT_EXCEEDED, false, undefined, {
      limit: 10,
      window: '1 minute',
      type: 'upload',
    });

    throw new AppError('Too many upload requests. Please try again later.', 429);
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks or if explicitly disabled
    return req.path.includes('/health');
  },
});

/**
 * Rate limiter for export endpoints
 * Limits to 5 exports per hour per user (or IP if not authenticated)
 */
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each user to 5 requests per hour
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, prefix to avoid collision with IP addresses
    // Otherwise use default IP handling by returning undefined
    return req.user?.uid ? `user:${req.user.uid}` : (undefined as any);
  },
  handler: (req, _res, _next) => {
    logger.warn('Export rate limit exceeded', {
      userId: req.user?.uid,
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId,
    });

    // Record failed attempt
    recordFailedAttempt(req, 'export_rate_limit_exceeded');

    // Log to audit
    auditLogger.logFromRequest(req, AuditAction.SECURITY_RATE_LIMIT_EXCEEDED, false, undefined, {
      limit: 5,
      window: '1 hour',
      type: 'export',
    });

    throw new AppError('Too many export requests. Please try again later.', 429);
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path.includes('/health');
  },
});

/**
 * Rate limiter for billing endpoints
 * Limits to 10 billing requests per minute per user (or IP if not authenticated)
 * Prevents abuse of checkout and portal creation
 */
export const billingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 requests per minute
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, prefix to avoid collision with IP addresses
    // Otherwise use default IP handling by returning undefined
    return req.user?.uid ? `user:${req.user.uid}` : (undefined as any);
  },
  handler: (req, _res, _next) => {
    logger.warn('Billing rate limit exceeded', {
      userId: req.user?.uid,
      ip: req.ip,
      method: req.method,
      url: req.url,
      requestId: req.requestId,
    });

    // Record failed attempt
    recordFailedAttempt(req, 'billing_rate_limit_exceeded');

    // Log to audit
    auditLogger.logFromRequest(req, AuditAction.SECURITY_RATE_LIMIT_EXCEEDED, false, undefined, {
      limit: 10,
      window: '1 minute',
      type: 'billing',
    });

    throw new AppError('Too many billing requests. Please try again later.', 429);
  },
});
