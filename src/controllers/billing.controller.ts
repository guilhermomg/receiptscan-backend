import { Request, Response } from 'express';
import { BillingService } from '../services/billing.service';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { auditLogger, AuditAction } from '../services/audit.service';

export class BillingController {
  private billingService: BillingService;

  constructor() {
    this.billingService = new BillingService();
  }

  /**
   * Create Stripe checkout session
   * POST /api/v1/billing/create-checkout
   */
  public createCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { uid, email } = req.user;

      logger.info('Creating checkout session', {
        requestId: req.requestId,
        userId: uid,
      });

      const checkoutUrl = await this.billingService.createCheckoutSession(uid, email);

      // Audit log
      await auditLogger.logFromRequest(req, AuditAction.BILLING_CHECKOUT_CREATE, true, {
        type: 'checkout',
        id: uid,
      });

      res.status(200).json({
        status: 'success',
        data: {
          checkoutUrl,
        },
      });
    } catch (error) {
      logger.error('Error in createCheckout', {
        requestId: req.requestId,
        error,
      });
      throw error;
    }
  };

  /**
   * Create Stripe customer portal session
   * POST /api/v1/billing/create-portal
   */
  public createPortal = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { uid } = req.user;

      logger.info('Creating portal session', {
        requestId: req.requestId,
        userId: uid,
      });

      const portalUrl = await this.billingService.createPortalSession(uid);

      // Audit log
      await auditLogger.logFromRequest(req, AuditAction.BILLING_PORTAL_CREATE, true, {
        type: 'portal',
        id: uid,
      });

      res.status(200).json({
        status: 'success',
        data: {
          portalUrl,
        },
      });
    } catch (error) {
      logger.error('Error in createPortal', {
        requestId: req.requestId,
        error,
      });
      throw error;
    }
  };

  /**
   * Get current subscription
   * GET /api/v1/billing/subscription
   */
  public getSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { uid } = req.user;

      logger.info('Getting subscription', {
        requestId: req.requestId,
        userId: uid,
      });

      const subscription = await this.billingService.getSubscription(uid);

      res.status(200).json({
        status: 'success',
        data: {
          subscription,
        },
      });
    } catch (error) {
      logger.error('Error in getSubscription', {
        requestId: req.requestId,
        error,
      });
      throw error;
    }
  };

  /**
   * Handle Stripe webhooks
   * POST /api/v1/billing/webhook
   */
  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        throw new AppError('Missing Stripe signature', 400);
      }

      logger.info('Processing webhook', {
        requestId: req.requestId,
      });

      // req.body should be raw buffer for webhook signature verification
      const result = await this.billingService.handleWebhook(req.body, signature);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in handleWebhook', {
        requestId: req.requestId,
        error,
      });
      throw error;
    }
  };
}
