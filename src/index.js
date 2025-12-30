require('dotenv').config();
const express = require('express');
const morgan = require('morgan');

// Import middleware
const { securityHeaders, additionalSecurityHeaders } = require('./middleware/security');
const { configureCors } = require('./middleware/corsConfig');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeInputs, sanitizeRequest } = require('./middleware/validation');
const { checkIPBlock, trackFailure } = require('./middleware/ipBlocker');

// Import routes
const receiptRoutes = require('./routes/receipts');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - important for rate limiting and IP tracking behind proxies/load balancers
app.set('trust proxy', 1);

// Security headers (Helmet.js)
app.use(securityHeaders);
app.use(additionalSecurityHeaders);

// CORS configuration
app.use(configureCors());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing with size limits to prevent payload attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// IP-based abuse detection
app.use(checkIPBlock);

// Input sanitization
app.use(sanitizeInputs);
app.use(sanitizeRequest);

// Track failures for IP blocking
app.use(trackFailure);

// Global rate limiting
app.use(generalLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ReceiptScan API',
    version: '1.0.0',
    status: 'operational',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 ReceiptScan API server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security features enabled`);
  });
}

module.exports = app;
