/// <reference path="../types/express.d.ts" />
/**
 * Receipt controller - handles HTTP requests for receipt operations
 */

import { Request, Response, NextFunction } from 'express';
import { ReceiptService } from '../services/receipt.service';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import {
  createReceiptSchema,
  updateReceiptSchema,
  receiptQuerySchema,
} from '../models/receipt.validation';
import { z } from 'zod';

export class ReceiptController {
  private receiptService: ReceiptService;

  constructor() {
    this.receiptService = new ReceiptService();
  }

  /**
   * POST /api/v1/receipts
   * Create a new receipt
   */
  public createReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Validate request body
      const validatedData = createReceiptSchema.parse(req.body);

      const receipt = await this.receiptService.createReceipt(req.user.uid, validatedData);

      logger.info('Receipt created', {
        requestId: req.requestId,
        userId: req.user.uid,
        receiptId: receipt.id,
      });

      res.status(201).json({
        status: 'success',
        message: 'Receipt created successfully',
        data: {
          receipt,
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

  /**
   * GET /api/v1/receipts/:id
   * Get a single receipt by ID
   */
  public getReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;

      if (!id) {
        throw new AppError('Receipt ID is required', 400);
      }

      const receipt = await this.receiptService.getReceiptById(id, req.user.uid);

      logger.debug('Receipt retrieved', {
        requestId: req.requestId,
        userId: req.user.uid,
        receiptId: id,
      });

      res.status(200).json({
        status: 'success',
        data: {
          receipt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/receipts
   * List receipts with filtering, sorting, and pagination
   */
  public listReceipts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Validate and parse query parameters
      const validatedQuery = receiptQuerySchema.parse(req.query);

      const results = await this.receiptService.listReceipts({
        userId: req.user.uid,
        ...validatedQuery,
      });

      logger.debug('Receipts listed', {
        requestId: req.requestId,
        userId: req.user.uid,
        count: results.receipts.length,
      });

      res.status(200).json({
        status: 'success',
        data: {
          receipts: results.receipts,
          pagination: {
            total: results.total,
            limit: results.limit,
            hasMore: results.hasMore,
            nextCursor: results.nextCursor,
          },
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

  /**
   * PATCH /api/v1/receipts/:id
   * Update a receipt
   */
  public updateReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;

      if (!id) {
        throw new AppError('Receipt ID is required', 400);
      }

      // Validate request body
      const validatedData = updateReceiptSchema.parse(req.body);

      const receipt = await this.receiptService.updateReceipt(id, req.user.uid, validatedData);

      logger.info('Receipt updated', {
        requestId: req.requestId,
        userId: req.user.uid,
        receiptId: id,
      });

      res.status(200).json({
        status: 'success',
        message: 'Receipt updated successfully',
        data: {
          receipt,
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

  /**
   * DELETE /api/v1/receipts/:id
   * Soft delete a receipt
   */
  public deleteReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { id } = req.params;

      if (!id) {
        throw new AppError('Receipt ID is required', 400);
      }

      await this.receiptService.deleteReceipt(id, req.user.uid);

      logger.info('Receipt deleted', {
        requestId: req.requestId,
        userId: req.user.uid,
        receiptId: id,
      });

      res.status(200).json({
        status: 'success',
        message: 'Receipt deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/receipts/stats
   * Get receipt statistics with optional grouping
   */
  public getReceiptStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { startDate, endDate, groupBy } = req.query;

      const statsSchema = z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        groupBy: z.enum(['category', 'month']).optional(),
      });

      const validatedQuery = statsSchema.parse({ startDate, endDate, groupBy });

      const stats = await this.receiptService.getReceiptStats(
        req.user.uid,
        validatedQuery.startDate,
        validatedQuery.endDate,
        validatedQuery.groupBy
      );

      logger.debug('Receipt statistics retrieved', {
        requestId: req.requestId,
        userId: req.user.uid,
      });

      res.status(200).json({
        status: 'success',
        data: {
          stats,
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
