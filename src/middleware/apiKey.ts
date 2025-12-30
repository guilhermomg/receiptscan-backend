/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { getFirestore } from '../config/firebase';
import { AppError } from './errorHandler';
import logger from '../config/logger';
import crypto from 'crypto';

export interface APIKey {
  id?: string;
  key: string;
  hashedKey: string;
  name: string;
  userId: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  active: boolean;
  scopes: string[]; // e.g., ['receipts:read', 'receipts:write']
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

/**
 * Hash an API key for secure storage
 */
export const hashAPIKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Generate a new API key
 */
export const generateAPIKey = (): string => {
  // Generate a cryptographically secure random key
  // Format: rsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (receiptscan key)
  const randomBytes = crypto.randomBytes(24);
  return `rsk_${process.env.NODE_ENV === 'production' ? 'live' : 'test'}_${randomBytes.toString('hex')}`;
};

/**
 * Validate API key format
 */
const isValidAPIKeyFormat = (key: string): boolean => {
  // Check format: rsk_[live|test]_[64 hex characters]
  return /^rsk_(live|test)_[a-f0-9]{48}$/.test(key);
};

/**
 * API Key authentication middleware
 * Validates API key from X-API-Key header
 */
export const apiKeyAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('API key is required. Provide it in the X-API-Key header.', 401);
    }

    // Validate format
    if (!isValidAPIKeyFormat(apiKey)) {
      throw new AppError('Invalid API key format', 401);
    }

    // Hash the provided key
    const hashedKey = hashAPIKey(apiKey);

    // Query Firestore for the API key
    const db = getFirestore();
    const snapshot = await db
      .collection('apiKeys')
      .where('hashedKey', '==', hashedKey)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.warn('Invalid API key attempt', {
        requestId: req.requestId,
        ip: req.ip,
      });
      throw new AppError('Invalid or inactive API key', 401);
    }

    const apiKeyDoc = snapshot.docs[0];
    const apiKeyData = apiKeyDoc.data() as APIKey;

    // Check expiration
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      logger.warn('Expired API key used', {
        requestId: req.requestId,
        apiKeyId: apiKeyDoc.id,
        userId: apiKeyData.userId,
      });
      throw new AppError('API key has expired', 401);
    }

    // Update last used timestamp (async, don't wait)
    db.collection('apiKeys')
      .doc(apiKeyDoc.id)
      .update({ lastUsedAt: new Date() })
      .catch((error) => {
        logger.error('Failed to update API key last used timestamp', { error });
      });

    // Attach API key info to request
    req.apiKey = {
      id: apiKeyDoc.id,
      userId: apiKeyData.userId,
      scopes: apiKeyData.scopes,
      name: apiKeyData.name,
    };

    logger.debug('API key authenticated', {
      requestId: req.requestId,
      apiKeyId: apiKeyDoc.id,
      userId: apiKeyData.userId,
      scopes: apiKeyData.scopes,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if API key has required scope
 */
export const requireScope = (requiredScope: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      throw new AppError('API key authentication required', 401);
    }

    if (!req.apiKey.scopes.includes(requiredScope) && !req.apiKey.scopes.includes('*')) {
      logger.warn('API key missing required scope', {
        requestId: req.requestId,
        apiKeyId: req.apiKey.id,
        requiredScope,
        availableScopes: req.apiKey.scopes,
      });
      throw new AppError(`API key does not have required scope: ${requiredScope}`, 403);
    }

    next();
  };
};

/**
 * Combined middleware: supports both Firebase Auth and API Key
 */
export const flexibleAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Check for API key first
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    return apiKeyAuth(req, res, next);
  }

  // Fall back to Firebase Auth
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Use existing auth middleware
    const { authMiddleware } = await import('./auth');
    return authMiddleware(req, res, next);
  }

  throw new AppError('Authentication required. Provide either Bearer token or X-API-Key', 401);
};
