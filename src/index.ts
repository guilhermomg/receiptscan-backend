import { createApp, startServer } from './app';
import logger from './config/logger';

try {
  const app = createApp();
  startServer(app);
} catch (error) {
  logger.error('Failed to start server', { error });
  process.exit(1);
}
