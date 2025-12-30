/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billing.service';
import { AppError } from './errorHandler';
import logger from '../config/logger';

let billingService: BillingService | null = null;

const getBillingService = () => {
  if (!billingService) {
    billingService = new BillingService();
  }
  return billingService;
};

/**
 * Middleware to check subscription limits before allowing receipt upload
 */
export const checkSubscriptionLimit = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      logger.error('Subscription limit check failed: User not authenticated', {
        requestId: req.requestId,
      });
      return next(new AppError('Authentication required', 401));
    }

    const { uid } = req.user;

    // Check if user can upload receipt
    const { allowed, reason } = await getBillingService().canUploadReceipt(uid);

    if (!allowed) {
      logger.warn('Subscription limit exceeded', {
        requestId: req.requestId,
        userId: uid,
        reason,
      });
      return next(new AppError(reason || 'Subscription limit reached', 403));
    }

    next();
  } catch (error) {
    logger.error('Error in subscription limit check', {
      requestId: req.requestId,
      error,
    });
    next(error);
  }
};
