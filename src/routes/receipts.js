const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/receipts:
 *   get:
 *     tags:
 *       - Receipts
 *     summary: List all receipts
 *     description: |
 *       Retrieves a paginated list of receipts for the authenticated user.
 *       Supports filtering by date range, category, merchant, and status.
 *       
 *       **Rate Limit:** 100 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter receipts from this date (YYYY-MM-DD)
 *         example: 2024-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter receipts until this date (YYYY-MM-DD)
 *         example: 2024-01-31
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name
 *         example: Food & Dining
 *       - in: query
 *         name: merchant
 *         schema:
 *           type: string
 *         description: Filter by merchant name (partial match)
 *         example: Starbucks
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, verified, flagged, archived]
 *         description: Filter by receipt status
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum receipt amount
 *         example: 10.00
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum receipt amount
 *         example: 100.00
 *     responses:
 *       200:
 *         description: Receipts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Receipt'
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
 *                       example: 45
 *                     pages:
 *                       type: number
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  res.status(200).json({
    data: [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        merchantName: 'Starbucks Coffee',
        merchantAddress: '123 Main St, Seattle, WA 98101',
        date: '2024-01-15T14:30:00Z',
        totalAmount: 24.99,
        subtotal: 22.50,
        tax: 2.49,
        currency: 'USD',
        category: 'Food & Dining',
        paymentMethod: 'credit',
        lineItems: [
          {
            id: '770e8400-e29b-41d4-a716-446655440002',
            description: 'Grande Latte',
            quantity: 2,
            unitPrice: 5.50,
            totalPrice: 11.00,
            category: 'Beverages'
          },
          {
            id: '770e8400-e29b-41d4-a716-446655440003',
            description: 'Croissant',
            quantity: 1,
            unitPrice: 3.50,
            totalPrice: 3.50,
            category: 'Food'
          }
        ],
        imageUrl: 'https://storage.receiptscan.ai/receipts/660e8400.jpg',
        ocrConfidence: 0.95,
        tags: ['business', 'client-meeting'],
        notes: 'Team lunch with client',
        status: 'verified',
        createdAt: '2024-01-15T15:00:00Z',
        updatedAt: '2024-01-15T15:30:00Z'
      }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 45,
      pages: 3
    }
  });
});

/**
 * @swagger
 * /api/receipts:
 *   post:
 *     tags:
 *       - Receipts
 *     summary: Create a new receipt
 *     description: |
 *       Creates a new receipt record. Can be used for manual entry or after OCR processing.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - merchantName
 *               - totalAmount
 *               - date
 *             properties:
 *               merchantName:
 *                 type: string
 *                 example: Starbucks Coffee
 *               merchantAddress:
 *                 type: string
 *                 example: 123 Main St, Seattle, WA 98101
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-15T14:30:00Z
 *               totalAmount:
 *                 type: number
 *                 format: float
 *                 example: 24.99
 *               subtotal:
 *                 type: number
 *                 format: float
 *                 example: 22.50
 *               tax:
 *                 type: number
 *                 format: float
 *                 example: 2.49
 *               currency:
 *                 type: string
 *                 example: USD
 *               category:
 *                 type: string
 *                 example: Food & Dining
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, credit, debit, digital]
 *                 example: credit
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - unitPrice
 *                     - totalPrice
 *                   properties:
 *                     description:
 *                       type: string
 *                       example: Grande Latte
 *                     quantity:
 *                       type: number
 *                       example: 2
 *                     unitPrice:
 *                       type: number
 *                       example: 5.50
 *                     totalPrice:
 *                       type: number
 *                       example: 11.00
 *                     category:
 *                       type: string
 *                       example: Beverages
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://storage.receiptscan.ai/receipts/660e8400.jpg
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [business, client-meeting]
 *               notes:
 *                 type: string
 *                 example: Team lunch with client
 *     responses:
 *       201:
 *         description: Receipt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Receipt created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Receipt'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', (req, res) => {
  const receiptData = req.body;
  
  res.status(201).json({
    message: 'Receipt created successfully',
    data: {
      id: '660e8400-e29b-41d4-a716-446655440001',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      ...receiptData,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/receipts/{id}:
 *   get:
 *     tags:
 *       - Receipts
 *     summary: Get receipt by ID
 *     description: |
 *       Retrieves detailed information about a specific receipt.
 *       
 *       **Rate Limit:** 100 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Receipt ID
 *         example: 660e8400-e29b-41d4-a716-446655440001
 *     responses:
 *       200:
 *         description: Receipt retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Receipt'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.status(200).json({
    data: {
      id: id,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      merchantName: 'Starbucks Coffee',
      merchantAddress: '123 Main St, Seattle, WA 98101',
      date: '2024-01-15T14:30:00Z',
      totalAmount: 24.99,
      subtotal: 22.50,
      tax: 2.49,
      currency: 'USD',
      category: 'Food & Dining',
      paymentMethod: 'credit',
      lineItems: [
        {
          id: '770e8400-e29b-41d4-a716-446655440002',
          description: 'Grande Latte',
          quantity: 2,
          unitPrice: 5.50,
          totalPrice: 11.00,
          category: 'Beverages'
        }
      ],
      imageUrl: 'https://storage.receiptscan.ai/receipts/660e8400.jpg',
      ocrConfidence: 0.95,
      tags: ['business', 'client-meeting'],
      notes: 'Team lunch with client',
      status: 'verified',
      createdAt: '2024-01-15T15:00:00Z',
      updatedAt: '2024-01-15T15:30:00Z'
    }
  });
});

/**
 * @swagger
 * /api/receipts/{id}:
 *   put:
 *     tags:
 *       - Receipts
 *     summary: Update receipt
 *     description: |
 *       Updates an existing receipt. All fields are optional.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Receipt ID
 *         example: 660e8400-e29b-41d4-a716-446655440001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchantName:
 *                 type: string
 *                 example: Starbucks Coffee
 *               totalAmount:
 *                 type: number
 *                 example: 24.99
 *               category:
 *                 type: string
 *                 example: Food & Dining
 *               status:
 *                 type: string
 *                 enum: [draft, verified, flagged, archived]
 *                 example: verified
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [business, updated]
 *               notes:
 *                 type: string
 *                 example: Updated notes
 *     responses:
 *       200:
 *         description: Receipt updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Receipt updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Receipt'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.status(200).json({
    message: 'Receipt updated successfully',
    data: {
      id: id,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      merchantName: 'Starbucks Coffee',
      merchantAddress: '123 Main St, Seattle, WA 98101',
      date: '2024-01-15T14:30:00Z',
      totalAmount: 24.99,
      subtotal: 22.50,
      tax: 2.49,
      currency: 'USD',
      category: updates.category || 'Food & Dining',
      paymentMethod: 'credit',
      status: updates.status || 'verified',
      tags: updates.tags || ['business', 'client-meeting'],
      notes: updates.notes || 'Team lunch with client',
      createdAt: '2024-01-15T15:00:00Z',
      updatedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/receipts/{id}:
 *   delete:
 *     tags:
 *       - Receipts
 *     summary: Delete receipt
 *     description: |
 *       Permanently deletes a receipt and all associated data.
 *       This action cannot be undone.
 *       
 *       **Rate Limit:** 30 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Receipt ID
 *         example: 660e8400-e29b-41d4-a716-446655440001
 *     responses:
 *       200:
 *         description: Receipt deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Receipt deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', (req, res) => {
  res.status(200).json({
    message: 'Receipt deleted successfully'
  });
});

module.exports = router;
