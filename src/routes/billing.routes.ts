import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { authMiddleware } from '../middleware/auth';
import { billingRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const billingController = new BillingController();

/**
 * @route POST /api/v1/billing/create-checkout
 * @desc Create Stripe checkout session for subscription
 * @access Private
 */
router.post(
  '/create-checkout',
  authMiddleware,
  billingRateLimiter,
  billingController.createCheckout
);

/**
 * @route POST /api/v1/billing/create-portal
 * @desc Create Stripe customer portal session
 * @access Private
 */
router.post('/create-portal', authMiddleware, billingRateLimiter, billingController.createPortal);

/**
 * @route GET /api/v1/billing/subscription
 * @desc Get current user subscription
 * @access Private
 */
router.get('/subscription', authMiddleware, billingRateLimiter, billingController.getSubscription);

/**
 * @route POST /api/v1/billing/webhook
 * @desc Handle Stripe webhook events
 * @access Public (verified by Stripe signature)
 * @note Raw body parsing is handled in app.ts for this endpoint
 */
router.post('/webhook', billingController.handleWebhook);

export default router;
