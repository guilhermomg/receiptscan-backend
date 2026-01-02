/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Check if a string is a valid URL
 */
const isValidUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    // Only allow http/https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitizes a value by removing potentially dangerous characters
 * Prevents XSS, SQL/NoSQL injection, and command injection attempts
 * Note: This is a basic defense layer. Primary protections are:
 * - Parameterized queries (Firestore handles this)
 * - Zod schema validation at controller level
 */
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    // Skip sanitization for valid URLs to preserve query parameters
    if (isValidUrl(value)) {
      return value;
    }

    // Remove null bytes
    let sanitized = value.replace(/\0/g, '');

    // Remove common SQL injection patterns
    sanitized = sanitized.replace(
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      ''
    );

    // Remove NoSQL injection patterns (MongoDB operators)
    sanitized = sanitized
      .replace(/\$\{/g, '')
      .replace(/\$where/gi, '')
      .replace(/\$ne\b/gi, '');

    // Remove script tags and event handlers (XSS prevention)
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove command injection attempts
    sanitized = sanitized.replace(/[;|&`$()]/g, '');

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
};

/**
 * Request sanitization middleware
 * Sanitizes request body, query parameters, and path parameters
 * to prevent injection attacks
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body) as typeof req.body;
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = sanitizeValue(req.query) as Record<string, unknown>;
      // Cannot directly assign to req.query as it's read-only
      // Instead, update properties in place
      for (const key in req.query) {
        if (key in sanitizedQuery) {
          (req.query as Record<string, unknown>)[key] = sanitizedQuery[key];
        }
      }
    }

    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params) as typeof req.params;
    }

    logger.debug('Request sanitized', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
    });

    next();
  } catch (error) {
    logger.error('Error during request sanitization', {
      requestId: req.requestId,
      error,
    });
    next(error);
  }
};

/**
 * Validates that a value does not contain dangerous patterns
 * Returns true if validation passes, false otherwise
 */
export const validateNoInjection = (value: string): boolean => {
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(;|--|\/\*|\*\/|xp_|sp_)/i,
  ];

  // Check for NoSQL injection patterns
  const noSqlPatterns = [/\$where/i, /\$ne/i, /\$gt/i, /\$lt/i, /\$regex/i];

  // Check for command injection patterns
  const commandPatterns = [/[;|&`$()<>]/];

  // Check for XSS patterns
  const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i];

  const allPatterns = [...sqlPatterns, ...noSqlPatterns, ...commandPatterns, ...xssPatterns];

  return !allPatterns.some((pattern) => pattern.test(value));
};
