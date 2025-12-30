import { Router, Request, Response, NextFunction } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { ReceiptParsingController } from '../controllers/receiptParsing.controller';
import { authMiddleware } from '../middleware/auth';
import { uploadSingleFile } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { checkSubscriptionLimit } from '../middleware/subscriptionLimit';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const uploadController = new UploadController();
const parsingController = new ReceiptParsingController();

/**
 * Multer error handler middleware
 * Converts multer errors to AppError for consistent error handling
 */
const handleMulterError = (err: Error, _req: Request, _res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    if (err.message.includes('File too large')) {
      return next(new AppError('File size exceeds the maximum limit of 10MB', 400));
    }
    if (err.message.includes('Unexpected field')) {
      return next(new AppError('Invalid file field. Use "receipt" as the field name.', 400));
    }
  }
  next(err);
};

/**
 * POST /api/v1/receipts/upload
 * Upload a receipt file with rate limiting
 * Required: Authentication
 * Content-Type: multipart/form-data
 * Field name: receipt
 * Max file size: 10MB
 * Allowed types: images (jpeg, png, gif, etc.) and PDF
 * Rate limit: 10 uploads per minute per user
 * Subscription: Free tier limited to 10 receipts/month, Pro unlimited
 */
router.post(
  '/upload',
  authMiddleware,
  checkSubscriptionLimit,
  uploadRateLimiter,
  uploadSingleFile,
  handleMulterError,
  uploadController.uploadReceipt
);

/**
 * DELETE /api/v1/receipts/file
 * Delete a receipt file
 * Required: Authentication
 * Body: { filePath: string }
 * Rate limit: 10 requests per minute per user
 */
router.delete('/file', authMiddleware, uploadRateLimiter, uploadController.deleteReceiptFile);

/**
 * POST /api/v1/receipts/file-url
 * Generate a signed URL for an existing file
 * Required: Authentication
 * Body: { filePath: string }
 * Returns: { fileUrl: string, expiresIn: string }
 * Rate limit: 10 requests per minute per user
 */
router.post('/file-url', authMiddleware, uploadRateLimiter, uploadController.generateFileUrl);

/**
 * POST /api/v1/receipts/parse
 * Parse receipt from image URL using AI
 * Required: Authentication
 * Body: { imageUrl: string, receiptId?: string }
 * Returns: Structured receipt data with confidence scores
 * Rate limit: 10 requests per minute per user
 */
router.post('/parse', authMiddleware, uploadRateLimiter, parsingController.parseReceipt);

export default router;
