import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { authMiddleware } from '../middleware/auth';
import { billingRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const billingController = new BillingController();

/**
 * @openapi
 * /billing/create-checkout:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Create Stripe checkout session
 *     description: |
 *       Creates a Stripe checkout session for Pro subscription signup.
 *       Redirects user to Stripe-hosted checkout page.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkoutUrl:
 *                       type: string
 *                       format: uri
 *                       description: Stripe checkout page URL
 *                       example: https://checkout.stripe.com/c/pay/cs_test_...
 *             example:
 *               status: success
 *               data:
 *                 checkoutUrl: https://checkout.stripe.com/c/pay/cs_test_...
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded (10 requests per minute)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to create checkout session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/create-checkout',
  authMiddleware,
  billingRateLimiter,
  billingController.createCheckout
);

/**
 * @openapi
 * /billing/create-portal:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Create Stripe customer portal session
 *     description: |
 *       Creates a Stripe customer portal session for subscription management.
 *       Allows users to update payment methods, view invoices, and cancel subscriptions.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Portal session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     portalUrl:
 *                       type: string
 *                       format: uri
 *                       description: Stripe customer portal URL
 *                       example: https://billing.stripe.com/p/session/test_...
 *             example:
 *               status: success
 *               data:
 *                 portalUrl: https://billing.stripe.com/p/session/test_...
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No Stripe customer found for user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded (10 requests per minute)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to create portal session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-portal', authMiddleware, billingRateLimiter, billingController.createPortal);

/**
 * @openapi
 * /billing/subscription:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get current user subscription
 *     description: |
 *       Retrieves the current user's subscription details and usage statistics.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *
 *       **Subscription Tiers:**
 *       - **Free:** $0/month, 10 receipts/month
 *       - **Pro:** $9/month, Unlimited receipts
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/SubscriptionInfo'
 *             examples:
 *               freeUser:
 *                 summary: Free tier user
 *                 value:
 *                   status: success
 *                   data:
 *                     subscription:
 *                       tier: free
 *                       status: null
 *                       currentPeriodEnd: null
 *                       receiptUsageThisMonth: 5
 *                       receiptLimit: 10
 *               proUser:
 *                 summary: Pro tier user
 *                 value:
 *                   status: success
 *                   data:
 *                     subscription:
 *                       tier: pro
 *                       status: active
 *                       currentPeriodEnd: "2024-02-15T00:00:00.000Z"
 *                       receiptUsageThisMonth: 25
 *                       receiptLimit: null
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded (10 requests per minute)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/subscription', authMiddleware, billingRateLimiter, billingController.getSubscription);

/**
 * @openapi
 * /billing/webhook:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Handle Stripe webhook events
 *     description: |
 *       Receives and processes Stripe webhook events for subscription lifecycle management.
 *       This endpoint is public but secured with Stripe webhook signature verification.
 *
 *       **Important:** Raw body parsing is required for signature verification.
 *
 *       **Handled Events:**
 *       - `checkout.session.completed` - Activates Pro subscription
 *       - `customer.subscription.updated` - Updates subscription status
 *       - `customer.subscription.deleted` - Downgrades to Free tier
 *       - `invoice.payment_succeeded` - Resets monthly usage
 *       - `invoice.payment_failed` - Marks subscription as past_due
 *
 *       **Webhook Setup:**
 *       1. Configure endpoint URL: `https://your-domain.com/api/v1/billing/webhook`
 *       2. Select events listed above
 *       3. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET env variable
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid signature or malformed payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to process webhook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/webhook', billingController.handleWebhook);

export default router;
