/**
 * Receipt CRUD routes
 */

import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';
import { authMiddleware } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const receiptController = new ReceiptController();

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
