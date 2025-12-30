interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export class HealthService {
  public async getHealthStatus(): Promise<HealthStatus> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}
