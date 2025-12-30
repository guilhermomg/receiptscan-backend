import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });

interface Config {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  logLevel: string;
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    storageBucket: string;
  };
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
    proPriceId: string;
  };
  frontendUrl: string;
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  logLevel: process.env.LOG_LEVEL || 'info',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1'),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    proPriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
};

export default config;
