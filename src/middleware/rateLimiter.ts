import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { AppError } from './errorHandler';

/**
 * Rate limiter for file upload endpoints
 * Limits to 10 uploads per minute per user
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each user to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP address
    return req.user?.uid || req.ip || 'anonymous';
  },
  handler: (_req, _res, _next) => {
    throw new AppError('Too many upload requests. Please try again later.', 429);
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks or if explicitly disabled
    return req.path.includes('/health');
  },
});
