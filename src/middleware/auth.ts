/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { AppError } from './errorHandler';
import logger from '../config/logger';
import { AuthService } from '../services/auth.service';
import { recordFailedAttempt, resetFailedAttempts } from './abuseDetection';
import { auditLogger, AuditAction } from '../services/audit.service';

let authService: AuthService | null = null;

const getAuthService = () => {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
};

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Log failed authentication attempt
      await auditLogger.logFromRequest(
        req,
        AuditAction.SECURITY_INVALID_TOKEN,
        false,
        undefined,
        undefined,
        'No authorization token provided'
      );
      throw new AppError('No authorization token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      await auditLogger.logFromRequest(
        req,
        AuditAction.SECURITY_INVALID_TOKEN,
        false,
        undefined,
        undefined,
        'Invalid authorization token format'
      );
      throw new AppError('Invalid authorization token format', 401);
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);

      // Get or create user profile
      const userProfile = await getAuthService().getOrCreateUserProfile(
        decodedToken.uid,
        decodedToken.email || ''
      );

      // Attach user context to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: userProfile.role,
        subscriptionTier: userProfile.subscriptionTier,
      };

      // Reset failed attempts on successful authentication
      resetFailedAttempts(req);

      logger.debug('User authenticated', {
        requestId: req.requestId,
        userId: req.user.uid,
        email: req.user.email,
      });

      next();
    } catch (error) {
      logger.error('Token verification failed', {
        requestId: req.requestId,
        error,
      });

      // Record failed attempt
      recordFailedAttempt(req, 'invalid_token');

      // Log to audit
      await auditLogger.logFromRequest(
        req,
        AuditAction.SECURITY_INVALID_TOKEN,
        false,
        undefined,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Invalid or expired token'
      );

      throw new AppError('Invalid or expired token', 401);
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return next();
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);

      const userProfile = await getAuthService().getOrCreateUserProfile(
        decodedToken.uid,
        decodedToken.email || ''
      );

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: userProfile.role,
        subscriptionTier: userProfile.subscriptionTier,
      };
    } catch (error) {
      logger.debug('Optional auth failed, continuing without authentication', {
        requestId: req.requestId,
        error,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
