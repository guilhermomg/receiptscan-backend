const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/upload/receipt:
 *   post:
 *     tags:
 *       - File Upload
 *     summary: Upload receipt image
 *     description: |
 *       Uploads a receipt image file and optionally triggers AI-powered OCR processing.
 *       Supports JPG, PNG, PDF formats up to 10MB.
 *       
 *       **Rate Limit:** 20 requests per minute
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Receipt image file (JPG, PNG, or PDF, max 10MB)
 *               processOCR:
 *                 type: boolean
 *                 default: true
 *                 description: Automatically process with OCR
 *               category:
 *                 type: string
 *                 description: Optional category hint for OCR
 *                 example: Food & Dining
 *           encoding:
 *             file:
 *               contentType: image/jpeg, image/png, application/pdf
 *     responses:
 *       201:
 *         description: Receipt uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Receipt uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     receiptId:
 *                       type: string
 *                       format: uuid
 *                       example: 660e8400-e29b-41d4-a716-446655440001
 *                     fileUrl:
 *                       type: string
 *                       format: uri
 *                       example: https://storage.receiptscan.ai/receipts/660e8400.jpg
 *                     fileName:
 *                       type: string
 *                       example: receipt_2024-01-15_143000.jpg
 *                     fileSize:
 *                       type: number
 *                       description: File size in bytes
 *                       example: 245678
 *                     mimeType:
 *                       type: string
 *                       example: image/jpeg
 *                     ocrStatus:
 *                       type: string
 *                       enum: [processing, completed, failed]
 *                       example: processing
 *                     extractedData:
 *                       type: object
 *                       description: Extracted data from OCR (if completed)
 *                       properties:
 *                         merchantName:
 *                           type: string
 *                           example: Starbucks Coffee
 *                         totalAmount:
 *                           type: number
 *                           example: 24.99
 *                         date:
 *                           type: string
 *                           format: date-time
 *                           example: 2024-01-15T14:30:00Z
 *                         confidence:
 *                           type: number
 *                           format: float
 *                           example: 0.95
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-15T15:00:00Z
 *       400:
 *         description: Invalid file or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidFormat:
 *                 value:
 *                   error: Invalid file format
 *                   code: UPLOAD_001
 *                   status: 400
 *                   details:
 *                     supportedFormats: [image/jpeg, image/png, application/pdf]
 *               fileTooLarge:
 *                 value:
 *                   error: File size exceeds maximum limit
 *                   code: UPLOAD_002
 *                   status: 400
 *                   details:
 *                     maxSize: 10485760
 *                     receivedSize: 15728640
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: File too large
 *               code: UPLOAD_003
 *               status: 413
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/receipt', (req, res) => {
  res.status(201).json({
    message: 'Receipt uploaded successfully',
    data: {
      receiptId: '660e8400-e29b-41d4-a716-446655440001',
      fileUrl: 'https://storage.receiptscan.ai/receipts/660e8400.jpg',
      fileName: 'receipt_2024-01-15_143000.jpg',
      fileSize: 245678,
      mimeType: 'image/jpeg',
      ocrStatus: 'processing',
      extractedData: {
        merchantName: 'Starbucks Coffee',
        totalAmount: 24.99,
        date: '2024-01-15T14:30:00Z',
        confidence: 0.95
      },
      uploadedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/upload/receipts/batch:
 *   post:
 *     tags:
 *       - File Upload
 *     summary: Batch upload multiple receipts
 *     description: |
 *       Uploads multiple receipt images in a single request.
 *       Maximum 10 files per request, each up to 10MB.
 *       
 *       **Rate Limit:** 10 requests per minute
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple receipt image files (max 10)
 *               processOCR:
 *                 type: boolean
 *                 default: true
 *                 description: Automatically process all with OCR
 *     responses:
 *       201:
 *         description: Receipts uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Batch upload completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           receiptId:
 *                             type: string
 *                             format: uuid
 *                           fileName:
 *                             type: string
 *                           fileUrl:
 *                             type: string
 *                             format: uri
 *                           ocrStatus:
 *                             type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileName:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 5
 *                         successful:
 *                           type: number
 *                           example: 4
 *                         failed:
 *                           type: number
 *                           example: 1
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/receipts/batch', (req, res) => {
  res.status(201).json({
    message: 'Batch upload completed',
    data: {
      successful: [
        {
          receiptId: '660e8400-e29b-41d4-a716-446655440001',
          fileName: 'receipt1.jpg',
          fileUrl: 'https://storage.receiptscan.ai/receipts/660e8400.jpg',
          ocrStatus: 'processing'
        },
        {
          receiptId: '660e8400-e29b-41d4-a716-446655440002',
          fileName: 'receipt2.jpg',
          fileUrl: 'https://storage.receiptscan.ai/receipts/660e8401.jpg',
          ocrStatus: 'processing'
        }
      ],
      failed: [],
      summary: {
        total: 2,
        successful: 2,
        failed: 0
      }
    }
  });
});

/**
 * @swagger
 * /api/upload/receipts/{id}/attachment:
 *   post:
 *     tags:
 *       - File Upload
 *     summary: Add attachment to existing receipt
 *     description: |
 *       Adds an additional file attachment to an existing receipt.
 *       Useful for adding supporting documents.
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Attachment file
 *               description:
 *                 type: string
 *                 description: Optional description of the attachment
 *                 example: Signed copy of receipt
 *     responses:
 *       201:
 *         description: Attachment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attachment added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     attachmentId:
 *                       type: string
 *                       format: uuid
 *                       example: 770e8400-e29b-41d4-a716-446655440010
 *                     receiptId:
 *                       type: string
 *                       format: uuid
 *                       example: 660e8400-e29b-41d4-a716-446655440001
 *                     fileUrl:
 *                       type: string
 *                       format: uri
 *                       example: https://storage.receiptscan.ai/attachments/770e8400.pdf
 *                     fileName:
 *                       type: string
 *                       example: receipt_attachment.pdf
 *                     description:
 *                       type: string
 *                       example: Signed copy of receipt
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-15T16:00:00Z
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
router.post('/receipts/:id/attachment', (req, res) => {
  const { id } = req.params;
  
  res.status(201).json({
    message: 'Attachment added successfully',
    data: {
      attachmentId: '770e8400-e29b-41d4-a716-446655440010',
      receiptId: id,
      fileUrl: 'https://storage.receiptscan.ai/attachments/770e8400.pdf',
      fileName: 'receipt_attachment.pdf',
      description: 'Signed copy of receipt',
      uploadedAt: new Date().toISOString()
    }
  });
});

module.exports = router;
