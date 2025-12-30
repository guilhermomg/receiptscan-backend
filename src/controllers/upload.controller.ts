/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

/**
 * Upload controller
 * Handles file upload endpoints
 */
export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  /**
   * POST /api/v1/receipts/upload
   * Upload a receipt file
   */
  uploadReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Ensure file is present
      if (!req.file) {
        throw new AppError('No file provided. Please upload a receipt file.', 400);
      }

      logger.info('Processing receipt upload', {
        requestId: req.requestId,
        userId: req.user.uid,
        filename: req.file.originalname,
        size: req.file.size,
      });

      // Upload file
      const result = await this.uploadService.uploadReceiptFile(req.user.uid, req.file);

      // Return success response
      res.status(201).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Upload failed', {
        requestId: req.requestId,
        userId: req.user?.uid,
        error,
      });
      next(error);
    }
  };

  /**
   * DELETE /api/v1/receipts/file
   * Delete a receipt file
   */
  deleteReceiptFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { filePath } = req.body;

      if (!filePath) {
        throw new AppError('File path is required', 400);
      }

      // Verify file path belongs to user
      if (!filePath.startsWith(`receipts/${req.user.uid}/`)) {
        throw new AppError('Unauthorized to delete this file', 403);
      }

      logger.info('Deleting receipt file', {
        requestId: req.requestId,
        userId: req.user.uid,
        filePath,
      });

      await this.uploadService.deleteReceiptFile(filePath);

      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
      });
    } catch (error) {
      logger.error('Delete failed', {
        requestId: req.requestId,
        userId: req.user?.uid,
        error,
      });
      next(error);
    }
  };

  /**
   * POST /api/v1/receipts/file-url
   * Generate a signed URL for an existing file
   */
  generateFileUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { filePath } = req.body;

      if (!filePath) {
        throw new AppError('File path is required', 400);
      }

      // Verify file path belongs to user
      if (!filePath.startsWith(`receipts/${req.user.uid}/`)) {
        throw new AppError('Unauthorized to access this file', 403);
      }

      logger.info('Generating file URL', {
        requestId: req.requestId,
        userId: req.user.uid,
        filePath,
      });

      const url = await this.uploadService.generateFileUrl(filePath);

      res.status(200).json({
        status: 'success',
        data: {
          fileUrl: url,
          expiresIn: '1 hour',
        },
      });
    } catch (error) {
      logger.error('URL generation failed', {
        requestId: req.requestId,
        userId: req.user?.uid,
        error,
      });
      next(error);
    }
  };
}
