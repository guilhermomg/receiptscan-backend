/**
 * Receipt CRUD routes with comprehensive Swagger/OpenAPI documentation
 */

import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';
import { ExportController } from '../controllers/export.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth';
import { uploadRateLimiter, exportRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const receiptController = new ReceiptController();
const exportController = new ExportController();
const analyticsController = new AnalyticsController();

/**
 * @openapi
 * /receipts/export:
 *   get:
 *     tags:
 *       - Export
 *     summary: Export receipts in CSV or PDF format
 *     description: |
 *       Exports receipts to CSV or PDF file with optional filtering.
 *       Returns a download URL that expires in 24 hours.
 *
 *       **Rate Limit:** 5 exports per hour per user
 *
 *       **CSV Format:** Comma-separated values with headers, UTF-8 encoding
 *
 *       **PDF Format:** Professional formatted report with summary and details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *         description: Export format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO 8601)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: merchant
 *         schema:
 *           type: string
 *         description: Filter by merchant
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter
 *     responses:
 *       200:
 *         description: Export generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Export generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                       format: uri
 *                       description: Download URL (expires in 24 hours)
 *                     fileName:
 *                       type: string
 *                       example: receipts-export-1704067200000.csv
 *                     fileSize:
 *                       type: number
 *                       example: 2048
 *                     recordCount:
 *                       type: number
 *                       example: 25
 *                     expiresIn:
 *                       type: string
 *                       example: 24 hours
 *       400:
 *         description: Missing or invalid format parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded (5 exports per hour)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Export generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/export', authMiddleware, exportRateLimiter, exportController.exportReceipts);

/**
 * @openapi
 * /receipts/analytics:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get spending analytics and insights
 *     description: |
 *       Provides comprehensive spending analytics with category breakdown,
 *       monthly trends, and top merchants.
 *
 *       **Rate Limit:** General API limit (100 requests per minute per IP)
 *
 *       **Available Periods:**
 *       - `this_month` - Current month
 *       - `last_month` - Previous month
 *       - `ytd` - Year to date
 *       - `custom` - Custom date range (requires startDate and endDate)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [this_month, last_month, ytd, custom]
 *           default: this_month
 *         description: Time period for analytics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for custom period (required if period=custom)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for custom period (required if period=custom)
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         summary:
 *                           $ref: '#/components/schemas/AnalyticsSummary'
 *                         byCategory:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/CategoryAnalytics'
 *                         monthlyTrends:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/MonthlyTrend'
 *                         topMerchants:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TopMerchant'
 *       400:
 *         description: Invalid period or missing required dates for custom period
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/analytics', authMiddleware, analyticsController.getAnalytics);

/**
 * @openapi
 * /receipts/stats:
 *   get:
 *     tags:
 *       - Receipts
 *     summary: Get receipt statistics
 *     description: |
 *       Returns aggregated statistics with optional grouping by category or time period.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [category, month]
 *         description: Group statistics by category or month
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalAmount:
 *                           type: number
 *                           example: 5234.56
 *                         count:
 *                           type: number
 *                           example: 42
 *                         byCategory:
 *                           type: object
 *                           additionalProperties:
 *                             type: object
 *                             properties:
 *                               amount:
 *                                 type: number
 *                               count:
 *                                 type: number
 *                           nullable: true
 *                         byPeriod:
 *                           type: object
 *                           additionalProperties:
 *                             type: object
 *                             properties:
 *                               amount:
 *                                 type: number
 *                               count:
 *                                 type: number
 *                           nullable: true
 *             example:
 *               status: success
 *               data:
 *                 stats:
 *                   totalAmount: 5234.56
 *                   count: 42
 *                   byCategory:
 *                     "Food & Dining":
 *                       amount: 2100.00
 *                       count: 25
 *                     "Transportation":
 *                       amount: 850.00
 *                       count: 8
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
 */
router.get('/stats', authMiddleware, uploadRateLimiter, receiptController.getReceiptStats);

/**
 * @openapi
 * /receipts:
 *   post:
 *     tags:
 *       - Receipts
 *     summary: Create a new receipt
 *     description: |
 *       Creates a new receipt record in the system.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReceiptDto'
 *           examples:
 *             simple:
 *               summary: Simple receipt
 *               value:
 *                 merchant: Whole Foods Market
 *                 date: "2024-01-15T00:00:00.000Z"
 *                 total: 127.45
 *                 tax: 11.25
 *                 currency: USD
 *                 category: Food & Dining
 *                 tags: ["groceries", "organic"]
 *             detailed:
 *               summary: Receipt with line items
 *               value:
 *                 merchant: Whole Foods Market
 *                 date: "2024-01-15T00:00:00.000Z"
 *                 total: 127.45
 *                 tax: 11.25
 *                 currency: USD
 *                 category: Food & Dining
 *                 tags: ["groceries", "organic"]
 *                 lineItems:
 *                   - description: Organic Bananas
 *                     quantity: 2
 *                     unitPrice: 0.79
 *                     total: 1.58
 *                   - description: Greek Yogurt
 *                     quantity: 1
 *                     unitPrice: 5.99
 *                     total: 5.99
 *                 imageUrl: https://storage.googleapis.com/bucket/receipts/...
 *                 status: completed
 *     responses:
 *       201:
 *         description: Receipt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Receipt created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     receipt:
 *                       $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: Invalid request data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *   get:
 *     tags:
 *       - Receipts
 *     summary: List receipts with filtering and pagination
 *     description: |
 *       Retrieves a paginated list of receipts with advanced filtering, sorting, and search.
 *       Uses cursor-based pagination for efficient scrolling through large datasets.
 *
 *       **Rate Limit:** General API limit (100 requests per minute per IP)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO 8601)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *         example: Food & Dining
 *       - in: query
 *         name: merchant
 *         schema:
 *           type: string
 *         description: Filter by merchant name
 *         example: Whole Foods Market
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ReceiptStatus'
 *         description: Filter by processing status
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter
 *         example: groceries,organic
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across merchant names and tags
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: startAfter
 *         schema:
 *           type: string
 *         description: Cursor for pagination (document ID from previous response)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, total, merchant, createdAt, updatedAt]
 *           default: date
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Receipts retrieved successfully
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
 *                     receipts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Receipt'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authMiddleware, uploadRateLimiter, receiptController.createReceipt);
router.get('/', authMiddleware, receiptController.listReceipts);

/**
 * @openapi
 * /receipts/{id}:
 *   get:
 *     tags:
 *       - Receipts
 *     summary: Get a single receipt by ID
 *     description: |
 *       Retrieves a specific receipt by its ID.
 *
 *       **Rate Limit:** General API limit (100 requests per minute per IP)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Receipt ID
 *     responses:
 *       200:
 *         description: Receipt retrieved successfully
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
 *                     receipt:
 *                       $ref: '#/components/schemas/Receipt'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Receipt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Receipts
 *     summary: Update a receipt
 *     description: |
 *       Updates a receipt with partial data. Only provided fields will be updated.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Receipt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReceiptDto'
 *           examples:
 *             updateMerchant:
 *               summary: Update merchant name
 *               value:
 *                 merchant: Updated Merchant Name
 *             updateAmount:
 *               summary: Update total and tax
 *               value:
 *                 total: 150.00
 *                 tax: 13.50
 *             updateTags:
 *               summary: Update tags
 *               value:
 *                 tags: ["updated", "tags", "new"]
 *     responses:
 *       200:
 *         description: Receipt updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Receipt updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     receipt:
 *                       $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: Invalid update data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Receipt not found
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
 *   delete:
 *     tags:
 *       - Receipts
 *     summary: Delete a receipt (soft delete)
 *     description: |
 *       Soft deletes a receipt by setting the deletedAt timestamp.
 *       The receipt remains in the database but is excluded from queries.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Receipt ID
 *     responses:
 *       200:
 *         description: Receipt deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Receipt deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Receipt not found
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
router.get('/:id', authMiddleware, receiptController.getReceipt);
router.patch('/:id', authMiddleware, uploadRateLimiter, receiptController.updateReceipt);
router.delete('/:id', authMiddleware, uploadRateLimiter, receiptController.deleteReceipt);

export default router;
