interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  deployment?: {
    commitSha?: string;
    deployedAt?: string;
  };
  services?: {
    firebase?: string;
    openai?: string;
    stripe?: string;
  };
}

export class HealthService {
  public async getHealthStatus(): Promise<HealthStatus> {
    const baseStatus: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    // Add deployment metadata if available
    if (process.env.DEPLOYMENT_COMMIT_SHA || process.env.DEPLOYMENT_TIMESTAMP) {
      baseStatus.deployment = {
        commitSha: process.env.DEPLOYMENT_COMMIT_SHA,
        deployedAt: process.env.DEPLOYMENT_TIMESTAMP,
      };
    }

    // Check service availability (basic checks)
    baseStatus.services = {
      firebase: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'not-configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not-configured',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not-configured',
    };

    return baseStatus;
  }
}
