/// <reference path="../types/express.d.ts" />
/**
 * Analytics controller - handles HTTP requests for analytics and reporting
 */

import { Request, Response, NextFunction } from 'express';
import { AnalyticsService, TimePeriod } from '../services/analytics.service';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { z } from 'zod';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * GET /api/v1/receipts/analytics
   * Get spending analytics and insights
   */
  public getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Validation schema for query parameters
      const analyticsQuerySchema = z.object({
        period: z.enum(['this_month', 'last_month', 'ytd', 'custom']).default('this_month'),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      });

      const validatedQuery = analyticsQuerySchema.parse(req.query);

      // Validate custom period dates
      if (validatedQuery.period === 'custom') {
        if (!validatedQuery.startDate || !validatedQuery.endDate) {
          throw new AppError('Custom period requires startDate and endDate parameters', 400);
        }
        if (validatedQuery.startDate > validatedQuery.endDate) {
          throw new AppError('startDate must be before endDate', 400);
        }
      }

      logger.info('Analytics request received', {
        requestId: req.requestId,
        userId: req.user.uid,
        period: validatedQuery.period,
      });

      // Get analytics
      const analytics = await this.analyticsService.getAnalytics({
        userId: req.user.uid,
        period: validatedQuery.period as TimePeriod,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
      });

      logger.info('Analytics generated successfully', {
        requestId: req.requestId,
        userId: req.user.uid,
        totalReceipts: analytics.summary.totalReceipts,
      });

      res.status(200).json({
        status: 'success',
        data: {
          analytics,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        return next(new AppError(`Validation error: ${firstError.message}`, 400));
      }
      next(error);
    }
  };
}
