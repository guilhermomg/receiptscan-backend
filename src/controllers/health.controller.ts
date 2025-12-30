import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';

export class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  public getHealth = async (_req: Request, res: Response): Promise<void> => {
    const healthStatus = await this.healthService.getHealthStatus();
    res.status(200).json(healthStatus);
  };
}
