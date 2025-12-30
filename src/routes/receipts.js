const express = require('express');
const router = express.Router();
const { uploadLimiter } = require('../middleware/rateLimiter');
const { 
  receiptValidationRules, 
  idValidationRules, 
  handleValidationErrors 
} = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { optionalApiKeyAuth } = require('../middleware/apiKeyAuth');

/**
 * GET /api/receipts
 * List all receipts (with optional API key)
 */
router.get('/', 
  optionalApiKeyAuth,
  (req, res) => {
    // Mock response - replace with actual database query
    res.json({
      receipts: [],
      total: 0,
      page: 1,
      limit: 10
    });
  }
);

/**
 * GET /api/receipts/:id
 * Get a specific receipt
 */
router.get('/:id',
  idValidationRules(),
  handleValidationErrors,
  (req, res) => {
    // Mock response - replace with actual database query
    res.json({
      id: req.params.id,
      title: 'Sample Receipt',
      amount: 99.99,
      date: new Date().toISOString(),
      category: 'Food'
    });
  }
);

/**
 * POST /api/receipts
 * Create a new receipt (with audit logging)
 */
router.post('/',
  auditLog('create_receipt'),
  receiptValidationRules(),
  handleValidationErrors,
  (req, res) => {
    // Mock response - replace with actual database insertion
    const receipt = {
      id: 'receipt_' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      message: 'Receipt created successfully',
      receipt
    });
  }
);

/**
 * POST /api/receipts/upload
 * Upload receipt image (with strict rate limiting)
 */
router.post('/upload',
  uploadLimiter,
  auditLog('upload_receipt'),
  (req, res) => {
    // Mock response - replace with actual file upload logic
    res.status(201).json({
      message: 'Receipt uploaded successfully',
      fileId: 'file_' + Date.now(),
      url: 'https://storage.example.com/receipts/file.jpg'
    });
  }
);

/**
 * PUT /api/receipts/:id
 * Update a receipt
 */
router.put('/:id',
  idValidationRules(),
  receiptValidationRules(),
  handleValidationErrors,
  auditLog('update_receipt'),
  (req, res) => {
    // Mock response - replace with actual database update
    res.json({
      message: 'Receipt updated successfully',
      receipt: {
        id: req.params.id,
        ...req.body,
        updatedAt: new Date().toISOString()
      }
    });
  }
);

/**
 * DELETE /api/receipts/:id
 * Delete a receipt (with audit logging)
 */
router.delete('/:id',
  idValidationRules(),
  handleValidationErrors,
  auditLog('delete_receipt'),
  (req, res) => {
    // Mock response - replace with actual database deletion
    res.json({
      message: 'Receipt deleted successfully',
      id: req.params.id
    });
  }
);

module.exports = router;
