import { createApp, startServer } from './app';
import { initializeFirebase } from './config/firebase';
import logger from './config/logger';

try {
  // Initialize Firebase
  initializeFirebase();

  const app = createApp();
  startServer(app);
} catch (error) {
  logger.error('Failed to start server', { error });
  process.exit(1);
}
