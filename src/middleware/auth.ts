import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { AppError } from './errorHandler';
import logger from '../config/logger';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authorization token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      throw new AppError('Invalid authorization token format', 401);
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);

      // Get or create user profile
      const userProfile = await authService.getOrCreateUserProfile(
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

      const userProfile = await authService.getOrCreateUserProfile(
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
