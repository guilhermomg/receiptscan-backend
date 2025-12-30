const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const receiptRoutes = require('./routes/receipts');
const uploadRoutes = require('./routes/upload');
const billingRoutes = require('./routes/billing');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for Swagger UI to work properly
}));

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ReceiptScan API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// Serve OpenAPI spec as JSON
app.get('/api/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Redirect root to API docs
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    status: 404,
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    error: message,
    code: err.code || 'SERVER_ERROR',
    status: status,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 ReceiptScan API server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`📄 OpenAPI Spec: http://localhost:${PORT}/api/docs/swagger.json`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
