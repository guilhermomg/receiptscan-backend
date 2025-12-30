/**
 * Receipt CRUD routes
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
 * GET /api/v1/receipts/export
 * Export receipts in CSV or PDF format
 * Required: Authentication
 * Query params:
 * - format: 'csv' | 'pdf' (required) - Export format
 * - startDate: Date (optional) - Filter by start date
 * - endDate: Date (optional) - Filter by end date
 * - category: string (optional) - Filter by category
 * - merchant: string (optional) - Filter by merchant
 * - tags: string (optional) - Comma-separated tags to filter
 * Rate limit: 5 exports per hour per user
 * Returns: Download URL for the generated file (expires in 24 hours)
 */
router.get('/export', authMiddleware, exportRateLimiter, exportController.exportReceipts);

/**
 * GET /api/v1/receipts/analytics
 * Get spending analytics and insights
 * Required: Authentication
 * Query params:
 * - period: 'this_month' | 'last_month' | 'ytd' | 'custom' (default: 'this_month')
 * - startDate: Date (required for custom period) - Start date for custom period
 * - endDate: Date (required for custom period) - End date for custom period
 * Returns: Analytics data with summary, category breakdown, monthly trends, and top merchants
 */
router.get('/analytics', authMiddleware, analyticsController.getAnalytics);

/**
 * GET /api/v1/receipts/stats
 * Get receipt statistics with optional grouping by category or period
 * Query params:
 * - startDate: Date (optional) - Start date for filtering
 * - endDate: Date (optional) - End date for filtering
 * - groupBy: 'category' | 'month' (optional) - Group statistics by category or month
 * Returns: { totalAmount, count, byCategory?, byPeriod? }
 */
router.get('/stats', authMiddleware, uploadRateLimiter, receiptController.getReceiptStats);

/**
 * POST /api/v1/receipts
 * Create a new receipt
 * Required: Authentication
 * Body: CreateReceiptDto
 * Returns: Created receipt with 201 status
 */
router.post('/', authMiddleware, uploadRateLimiter, receiptController.createReceipt);

/**
 * GET /api/v1/receipts
 * List receipts with filtering, sorting, and cursor-based pagination
 * Required: Authentication
 * Query params:
 * - startDate: Date (optional) - Filter by start date
 * - endDate: Date (optional) - Filter by end date
 * - category: string (optional) - Filter by category
 * - merchant: string (optional) - Filter by merchant
 * - status: ReceiptStatus (optional) - Filter by status
 * - tags: string (optional) - Comma-separated tags to filter
 * - search: string (optional) - Search across merchant and tags
 * - limit: number (optional, default: 20, max: 100) - Items per page
 * - startAfter: string (optional) - Cursor for pagination (document ID)
 * - sortBy: 'date' | 'total' | 'merchant' | 'createdAt' | 'updatedAt' (default: 'date')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * Returns: Paginated list of receipts
 */
router.get('/', authMiddleware, receiptController.listReceipts);

/**
 * GET /api/v1/receipts/:id
 * Get a single receipt by ID
 * Required: Authentication
 * Returns: Receipt data or 404 if not found
 */
router.get('/:id', authMiddleware, receiptController.getReceipt);

/**
 * PATCH /api/v1/receipts/:id
 * Update a receipt
 * Required: Authentication
 * Body: UpdateReceiptDto (partial fields)
 * Returns: Updated receipt
 */
router.patch('/:id', authMiddleware, uploadRateLimiter, receiptController.updateReceipt);

/**
 * DELETE /api/v1/receipts/:id
 * Soft delete a receipt (sets deletedAt timestamp)
 * Required: Authentication
 * Returns: Success message
 */
router.delete('/:id', authMiddleware, uploadRateLimiter, receiptController.deleteReceipt);

export default router;
