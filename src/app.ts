import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger from './config/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

export const createApp = (): Application => {
  const app: Application = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request ID and logging middleware
  app.use(requestIdMiddleware);
  app.use(requestLogger);

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
