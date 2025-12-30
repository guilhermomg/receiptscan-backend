/// <reference path="../types/express.d.ts" />
/**
 * Export controller - handles HTTP requests for receipt export operations
 */

import { Request, Response, NextFunction } from 'express';
import { ExportService, ExportFormat } from '../services/export.service';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { z } from 'zod';
import { auditLogger, AuditAction } from '../services/audit.service';

export class ExportController {
  private exportService: ExportService;

  constructor() {
    this.exportService = new ExportService();
  }

  /**
   * GET /api/v1/receipts/export
   * Export receipts in specified format (CSV or PDF)
   */
  public exportReceipts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Validation schema for query parameters
      const exportQuerySchema = z.object({
        format: z.enum(['csv', 'pdf']),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        category: z.string().optional(),
        merchant: z.string().optional(),
        tags: z
          .string()
          .optional()
          .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined)),
      });

      const validatedQuery = exportQuerySchema.parse(req.query);

      logger.info('Export request received', {
        requestId: req.requestId,
        userId: req.user.uid,
        format: validatedQuery.format,
      });

      // Perform export
      const result = await this.exportService.exportReceipts({
        userId: req.user.uid,
        format: validatedQuery.format as ExportFormat,
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
        category: validatedQuery.category,
        merchant: validatedQuery.merchant,
        tags: validatedQuery.tags,
      });

      logger.info('Export completed successfully', {
        requestId: req.requestId,
        userId: req.user.uid,
        format: validatedQuery.format,
        recordCount: result.recordCount,
      });

      // Audit log
      await auditLogger.logFromRequest(
        req,
        AuditAction.RECEIPT_EXPORT,
        true,
        { type: 'export', id: result.fileName },
        { format: validatedQuery.format, recordCount: result.recordCount }
      );

      res.status(200).json({
        status: 'success',
        message: 'Export generated successfully',
        data: {
          downloadUrl: result.fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          recordCount: result.recordCount,
          expiresIn: '24 hours',
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
