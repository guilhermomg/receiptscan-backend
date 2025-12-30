/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { UserRole, SubscriptionTier } from '../models/user.model';
import { AppError } from './errorHandler';
import logger from '../config/logger';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.error('RBAC check failed: User not authenticated', {
        requestId: req.requestId,
      });
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('RBAC check failed: Insufficient permissions', {
        requestId: req.requestId,
        userId: req.user.uid,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requireSubscription = (...allowedTiers: SubscriptionTier[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.error('Subscription check failed: User not authenticated', {
        requestId: req.requestId,
      });
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      logger.warn('Subscription check failed: Insufficient subscription tier', {
        requestId: req.requestId,
        userId: req.user.uid,
        userTier: req.user.subscriptionTier,
        requiredTiers: allowedTiers,
      });
      return next(new AppError('This feature requires a higher subscription tier', 403));
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
