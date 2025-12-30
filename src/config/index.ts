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
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
