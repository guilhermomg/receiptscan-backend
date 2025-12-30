const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/export/csv:
 *   get:
 *     tags:
 *       - Export
 *     summary: Export receipts as CSV
 *     description: |
 *       Exports receipts to CSV format with all fields.
 *       Supports filtering by date range and category.
 *       
 *       **Rate Limit:** 20 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, verified, flagged, archived, all]
 *           default: verified
 *         description: Filter by receipt status
 *       - in: query
 *         name: includeLineItems
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include line items in export
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="receipts_2024-01-01_2024-01-31.csv"
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: text/csv
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: |
 *                 Date,Merchant,Category,Amount,Tax,Total,Payment Method,Status,Notes
 *                 2024-01-15,Starbucks Coffee,Food & Dining,22.50,2.49,24.99,credit,verified,Team lunch with client
 *                 2024-01-16,Uber,Transportation,15.00,1.50,16.50,credit,verified,Airport ride
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/csv', (req, res) => {
  const csvData = `Date,Merchant,Category,Amount,Tax,Total,Payment Method,Status,Notes
2024-01-15,Starbucks Coffee,Food & Dining,22.50,2.49,24.99,credit,verified,Team lunch with client
2024-01-16,Uber,Transportation,15.00,1.50,16.50,credit,verified,Airport ride`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="receipts_export.csv"');
  res.status(200).send(csvData);
});

/**
 * @swagger
 * /api/export/pdf:
 *   get:
 *     tags:
 *       - Export
 *     summary: Export receipts as PDF
 *     description: |
 *       Exports receipts to PDF format with summary and details.
 *       Includes receipt images if available.
 *       
 *       **Rate Limit:** 10 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: includeImages
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include receipt images in PDF
 *       - in: query
 *         name: includeSummary
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include expense summary section
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="receipts_2024-01-01_2024-01-31.pdf"
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: application/pdf
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/pdf', (req, res) => {
  res.status(200).json({
    message: 'PDF export would be generated here',
    note: 'This is a mock response. In production, this would return a PDF file.',
    downloadUrl: 'https://storage.receiptscan.ai/exports/receipts_export.pdf'
  });
});

/**
 * @swagger
 * /api/export/excel:
 *   get:
 *     tags:
 *       - Export
 *     summary: Export receipts as Excel
 *     description: |
 *       Exports receipts to Excel format (.xlsx) with formatted sheets.
 *       Includes summary sheet and detailed receipts sheet.
 *       
 *       **Rate Limit:** 10 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: includeCharts
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include charts in Excel file
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="receipts_2024-01-01_2024-01-31.xlsx"
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/excel', (req, res) => {
  res.status(200).json({
    message: 'Excel export would be generated here',
    note: 'This is a mock response. In production, this would return an Excel file.',
    downloadUrl: 'https://storage.receiptscan.ai/exports/receipts_export.xlsx'
  });
});

/**
 * @swagger
 * /api/export/json:
 *   get:
 *     tags:
 *       - Export
 *     summary: Export receipts as JSON
 *     description: |
 *       Exports receipts in JSON format for API integration or backup.
 *       Includes all receipt data with full details.
 *       
 *       **Rate Limit:** 30 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: pretty
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Format JSON with indentation
 *     responses:
 *       200:
 *         description: JSON export generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exportDate:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-20T10:00:00Z
 *                 filters:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       example: 2024-01-01
 *                     endDate:
 *                       type: string
 *                       example: 2024-01-31
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalReceipts:
 *                       type: number
 *                       example: 45
 *                     totalAmount:
 *                       type: number
 *                       example: 1250.50
 *                     currency:
 *                       type: string
 *                       example: USD
 *                 receipts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Receipt'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/json', (req, res) => {
  res.status(200).json({
    exportDate: new Date().toISOString(),
    filters: {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      category: req.query.category || null
    },
    summary: {
      totalReceipts: 45,
      totalAmount: 1250.50,
      currency: 'USD'
    },
    receipts: [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        merchantName: 'Starbucks Coffee',
        date: '2024-01-15T14:30:00Z',
        totalAmount: 24.99,
        category: 'Food & Dining',
        status: 'verified'
      }
    ]
  });
});

/**
 * @swagger
 * /api/export/quickbooks:
 *   post:
 *     tags:
 *       - Export
 *     summary: Export to QuickBooks
 *     description: |
 *       Exports receipts to QuickBooks format (IIF).
 *       Requires QuickBooks integration to be configured.
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
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-01
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-31
 *               accountMapping:
 *                 type: object
 *                 description: Category to QuickBooks account mapping
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   "Food & Dining": "Meals and Entertainment"
 *                   "Transportation": "Auto and Travel"
 *     responses:
 *       200:
 *         description: QuickBooks export generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: QuickBooks export generated successfully
 *                 downloadUrl:
 *                   type: string
 *                   format: uri
 *                   example: https://storage.receiptscan.ai/exports/quickbooks_export.iif
 *                 recordsExported:
 *                   type: number
 *                   example: 45
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/quickbooks', (req, res) => {
  res.status(200).json({
    message: 'QuickBooks export generated successfully',
    downloadUrl: 'https://storage.receiptscan.ai/exports/quickbooks_export.iif',
    recordsExported: 45
  });
});

module.exports = router;
