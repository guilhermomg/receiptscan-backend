const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/billing/plans:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get all subscription plans
 *     description: |
 *       Retrieves all available subscription plans with pricing and features.
 *       No authentication required.
 *       
 *       **Rate Limit:** 100 requests per minute
 *     security: []
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 *             example:
 *               data:
 *                 - id: free
 *                   name: Free
 *                   description: Perfect for individuals
 *                   price: 0
 *                   currency: USD
 *                   features:
 *                     - 10 receipts/month
 *                     - Basic OCR
 *                     - Email support
 *                   limits:
 *                     receiptsPerMonth: 10
 *                     storageGB: 1
 *                 - id: pro_monthly
 *                   name: Professional
 *                   description: Perfect for small businesses
 *                   price: 19.99
 *                   currency: USD
 *                   features:
 *                     - 100 receipts/month
 *                     - AI-powered OCR
 *                     - Export to CSV/PDF
 *                     - Email support
 *                   limits:
 *                     receiptsPerMonth: 100
 *                     storageGB: 10
 *                 - id: business_monthly
 *                   name: Business
 *                   description: For growing businesses
 *                   price: 49.99
 *                   currency: USD
 *                   features:
 *                     - Unlimited receipts
 *                     - Advanced AI OCR
 *                     - Multi-user access
 *                     - Priority support
 *                     - API access
 *                   limits:
 *                     receiptsPerMonth: -1
 *                     storageGB: 50
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/plans', (req, res) => {
  res.status(200).json({
    data: [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for individuals',
        price: 0,
        currency: 'USD',
        features: [
          '10 receipts/month',
          'Basic OCR',
          'Email support'
        ],
        limits: {
          receiptsPerMonth: 10,
          storageGB: 1
        }
      },
      {
        id: 'pro_monthly',
        name: 'Professional',
        description: 'Perfect for small businesses',
        price: 19.99,
        currency: 'USD',
        features: [
          '100 receipts/month',
          'AI-powered OCR',
          'Export to CSV/PDF',
          'Email support'
        ],
        limits: {
          receiptsPerMonth: 100,
          storageGB: 10
        }
      },
      {
        id: 'business_monthly',
        name: 'Business',
        description: 'For growing businesses',
        price: 49.99,
        currency: 'USD',
        features: [
          'Unlimited receipts',
          'Advanced AI OCR',
          'Multi-user access',
          'Priority support',
          'API access'
        ],
        limits: {
          receiptsPerMonth: -1,
          storageGB: 50
        }
      }
    ]
  });
});

/**
 * @swagger
 * /api/billing/subscription:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get current subscription
 *     description: |
 *       Retrieves the current user's subscription details.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No active subscription found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: No active subscription found
 *               code: BILLING_001
 *               status: 404
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/subscription', (req, res) => {
  res.status(200).json({
    data: {
      id: '990e8400-e29b-41d4-a716-446655440004',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      planId: 'pro_monthly',
      planName: 'Professional',
      status: 'active',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-02-01T00:00:00Z',
      price: 19.99,
      currency: 'USD',
      autoRenew: true,
      usage: {
        receiptsThisMonth: 45,
        receiptsLimit: 100,
        storageUsedGB: 3.2,
        storageLimit: 10
      }
    }
  });
});

/**
 * @swagger
 * /api/billing/subscribe:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Subscribe to a plan
 *     description: |
 *       Creates a new subscription or upgrades/downgrades existing subscription.
 *       Requires valid payment method.
 *       
 *       **Rate Limit:** 10 requests per minute
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: Plan identifier
 *                 example: pro_monthly
 *               paymentMethodId:
 *                 type: string
 *                 description: Payment method ID (from payment processor)
 *                 example: pm_1234567890abcdef
 *               promoCode:
 *                 type: string
 *                 description: Optional promotional code
 *                 example: SAVE20
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subscription created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Invalid plan or payment method
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidPlan:
 *                 value:
 *                   error: Invalid plan ID
 *                   code: BILLING_002
 *                   status: 400
 *               paymentFailed:
 *                 value:
 *                   error: Payment method declined
 *                   code: BILLING_003
 *                   status: 400
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/subscribe', (req, res) => {
  const { planId } = req.body;
  
  res.status(201).json({
    message: 'Subscription created successfully',
    data: {
      id: '990e8400-e29b-41d4-a716-446655440004',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      planId: planId,
      planName: 'Professional',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      price: 19.99,
      currency: 'USD',
      autoRenew: true
    }
  });
});

/**
 * @swagger
 * /api/billing/subscription/cancel:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Cancel subscription
 *     description: |
 *       Cancels the current subscription. Access remains until end of billing period.
 *       
 *       **Rate Limit:** 10 requests per minute
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional cancellation reason
 *                 example: No longer needed
 *               feedback:
 *                 type: string
 *                 description: Optional feedback
 *                 example: Great service, but switching to another solution
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subscription cancelled successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptionId:
 *                       type: string
 *                       format: uuid
 *                       example: 990e8400-e29b-41d4-a716-446655440004
 *                     status:
 *                       type: string
 *                       example: cancelled
 *                     accessUntil:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-02-01T00:00:00Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No active subscription to cancel
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: No active subscription found
 *               code: BILLING_001
 *               status: 404
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/subscription/cancel', (req, res) => {
  res.status(200).json({
    message: 'Subscription cancelled successfully',
    data: {
      subscriptionId: '990e8400-e29b-41d4-a716-446655440004',
      status: 'cancelled',
      accessUntil: '2024-02-01T00:00:00Z'
    }
  });
});

/**
 * @swagger
 * /api/billing/invoices:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get billing history
 *     description: |
 *       Retrieves paginated list of invoices for the authenticated user.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: inv_2024010001
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-01T00:00:00Z
 *                       amount:
 *                         type: number
 *                         example: 19.99
 *                       currency:
 *                         type: string
 *                         example: USD
 *                       status:
 *                         type: string
 *                         enum: [paid, pending, failed]
 *                         example: paid
 *                       planName:
 *                         type: string
 *                         example: Professional
 *                       pdfUrl:
 *                         type: string
 *                         format: uri
 *                         example: https://storage.receiptscan.ai/invoices/inv_2024010001.pdf
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                       example: 1
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     total:
 *                       type: number
 *                       example: 12
 *                     pages:
 *                       type: number
 *                       example: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/invoices', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  res.status(200).json({
    data: [
      {
        id: 'inv_2024010001',
        date: '2024-01-01T00:00:00Z',
        amount: 19.99,
        currency: 'USD',
        status: 'paid',
        planName: 'Professional',
        pdfUrl: 'https://storage.receiptscan.ai/invoices/inv_2024010001.pdf'
      }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 12,
      pages: 1
    }
  });
});

module.exports = router;
