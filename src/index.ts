import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import config from './config';
import { healthCheck, readinessCheck } from './controllers/health.controller';

const app = express();

// Configure CORS
const corsOptions = {
  origin: config.cors.origins,
  credentials: true,
};
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Health check endpoints
app.get('/health', healthCheck);
app.get('/readiness', readinessCheck);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ReceiptScan API',
    environment: config.nodeEnv,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      readiness: '/readiness',
    },
  });
});

// Export the Express app as a Firebase Function
export const api = functions
  .region(config.firebase.region)
  .https.onRequest(app);
