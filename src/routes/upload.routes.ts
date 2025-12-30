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
 * @openapi
 * /receipts/upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload a receipt file
 *     description: |
 *       Uploads a receipt image or PDF file to Firebase Cloud Storage.
 *       Returns a signed URL that expires in 1 hour.
 *
 *       **Rate Limit:** 10 uploads per minute per user
 *
 *       **Subscription Limits:**
 *       - Free tier: 10 receipts/month
 *       - Pro tier: Unlimited
 *
 *       **File Requirements:**
 *       - Max file size: 10MB
 *       - Allowed types: JPEG, PNG, GIF, WebP, BMP, TIFF, PDF
 *       - Field name: `receipt`
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - receipt
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *                 description: Receipt image or PDF file
 *     responses:
 *       201:
 *         description: File uploaded successfully
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
 *                   example: File uploaded successfully
 *                 data:
 *                   $ref: '#/components/schemas/UploadResponse'
 *             example:
 *               status: success
 *               message: File uploaded successfully
 *               data:
 *                 receiptId: 550e8400-e29b-41d4-a716-446655440000
 *                 fileName: receipt.jpg
 *                 filePath: receipts/user-123/receipt-456/1704067200000-receipt.jpg
 *                 fileUrl: https://storage.googleapis.com/bucket/receipts/...
 *                 fileSize: 1024000
 *                 mimeType: image/jpeg
 *                 uploadedAt: "2024-01-01T12:00:00.000Z"
 *       400:
 *         description: Invalid file (wrong type, too large, or no file provided)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noFile:
 *                 summary: No file provided
 *                 value:
 *                   status: error
 *                   message: No file uploaded
 *               fileTooLarge:
 *                 summary: File too large
 *                 value:
 *                   status: error
 *                   message: File size exceeds the maximum limit of 10MB
 *               invalidType:
 *                 summary: Invalid file type
 *                 value:
 *                   status: error
 *                   message: Invalid file type
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Subscription limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Monthly receipt limit exceeded. Upgrade to Pro for unlimited receipts.
 *       429:
 *         description: Rate limit exceeded (10 uploads per minute)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error during upload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * @openapi
 * /receipts/file:
 *   delete:
 *     tags:
 *       - Upload
 *     summary: Delete a receipt file
 *     description: |
 *       Deletes a receipt file from Firebase Cloud Storage.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filePath
 *             properties:
 *               filePath:
 *                 type: string
 *                 description: File path in storage
 *                 example: receipts/user-123/receipt-456/1704067200000-receipt.jpg
 *     responses:
 *       200:
 *         description: File deleted successfully
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
 *                   example: File deleted successfully
 *       400:
 *         description: Missing or invalid file path
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
 *         description: File not found
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
router.delete('/file', authMiddleware, uploadRateLimiter, uploadController.deleteReceiptFile);

/**
 * @openapi
 * /receipts/file-url:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Generate a signed URL for an existing file
 *     description: |
 *       Generates a new signed URL for an existing file in storage.
 *       The URL expires in 1 hour.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filePath
 *             properties:
 *               filePath:
 *                 type: string
 *                 description: File path in storage
 *                 example: receipts/user-123/receipt-456/1704067200000-receipt.jpg
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
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
 *                     fileUrl:
 *                       type: string
 *                       format: uri
 *                       description: Signed URL with 1 hour expiration
 *                     expiresIn:
 *                       type: string
 *                       example: 1 hour
 *       400:
 *         description: Missing or invalid file path
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
 *         description: File not found
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
router.post('/file-url', authMiddleware, uploadRateLimiter, uploadController.generateFileUrl);

/**
 * @openapi
 * /receipts/parse:
 *   post:
 *     tags:
 *       - Receipt Parsing
 *     summary: Parse receipt from image URL using AI
 *     description: |
 *       Extracts structured data from a receipt image using OpenAI GPT-4 Vision.
 *       Returns parsed data with confidence scores for each field.
 *
 *       **Rate Limit:** 10 requests per minute per user
 *
 *       **Confidence Levels:**
 *       - **High** (>0.8): Highly accurate, safe to use
 *       - **Medium** (0.5-0.8): May need review
 *       - **Low** (<0.5): Should be verified manually
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL of the receipt image (signed URL from upload endpoint)
 *                 example: https://storage.googleapis.com/bucket/receipts/...
 *               receiptId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional receipt ID if updating existing receipt
 *     responses:
 *       200:
 *         description: Receipt parsed successfully
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
 *                   example: Receipt parsed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     parsed:
 *                       $ref: '#/components/schemas/ParsedReceipt'
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         source:
 *                           type: string
 *                           enum: [openai, google-vision, failed]
 *                           example: openai
 *                         processingTime:
 *                           type: number
 *                           description: Processing time in milliseconds
 *                           example: 2345
 *                         fallbackUsed:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Invalid image URL or missing required fields
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
 *       500:
 *         description: Parsing failed or OpenAI service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/parse', authMiddleware, uploadRateLimiter, parsingController.parseReceipt);

export default router;
