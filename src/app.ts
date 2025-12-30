import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger from './config/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeRequest } from './middleware/sanitization';
import { checkIPBlocked } from './middleware/abuseDetection';
import { generalRateLimiter } from './middleware/rateLimiter';
import routes from './routes';

export const createApp = (): Application => {
  const app: Application = express();

  // Trust proxy - needed for proper IP detection behind load balancers
  app.set('trust proxy', 1);

  // Enhanced security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    })
  );

  // CORS configuration with allowed origins
  const allowedOrigins = config.corsOrigins.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          logger.warn('CORS origin not allowed', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
      maxAge: 600, // 10 minutes
    })
  );

  // Request ID and logging middleware (before body parsing)
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // IP-based abuse detection
  app.use(checkIPBlocked);

  // General rate limiting
  app.use(generalRateLimiter);

  // Raw body parsing for Stripe webhook (must be before JSON parsing)
  app.use(`${config.apiPrefix}/billing/webhook`, express.raw({ type: 'application/json' }));

  // Body parsing middleware with size limits
  app.use(express.json({ limit: config.maxRequestSize }));
  app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

  // Request sanitization to prevent injection attacks
  app.use(sanitizeRequest);

  // API routes
  app.use(config.apiPrefix, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

export const startServer = (app: Application): void => {
  const server = app.listen(config.port, () => {
    logger.info(`Server started`, {
      port: config.port,
      environment: config.nodeEnv,
      apiPrefix: config.apiPrefix,
    });
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
      logger.info('Server shut down successfully');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
