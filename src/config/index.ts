import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development';
const envFile = env === 'production' ? '.env.prd' : env === 'test' ? '.env.test' : '.env.dev';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export interface Config {
  nodeEnv: string;
  firebase: {
    projectId: string;
    region: string;
  };
  api: {
    baseUrl: string;
    port: number;
  };
  openai: {
    apiKey: string;
  };
  stripe: {
    apiKey: string;
    webhookSecret: string;
  };
  firestore: {
    databaseId: string;
  };
  storage: {
    bucket: string;
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
  };
  cors: {
    origins: string[];
  };
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'receiptscan-dev',
    region: process.env.FIREBASE_REGION || 'us-central1',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5001',
    port: parseInt(process.env.API_PORT || '5001', 10),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  firestore: {
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
  },
  storage: {
    bucket: process.env.STORAGE_BUCKET || '',
  },
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  },
};

export default config;
