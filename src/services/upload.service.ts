/// <reference types="multer" />
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { FileValidationService } from './fileValidation.service';
import { FileStorageService } from './fileStorage.service';
import { AppError } from '../middleware/errorHandler';

/**
 * Upload response interface
 */
export interface UploadResult {
  receiptId: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * File upload service
 * Handles the complete upload workflow: validation, storage, and URL generation
 */
export class UploadService {
  private validationService: FileValidationService;
  private storageService: FileStorageService;

  constructor() {
    this.validationService = new FileValidationService();
    this.storageService = new FileStorageService();
  }

  /**
   * Upload a receipt file
   */
  async uploadReceiptFile(
    userId: string,
    file: { originalname: string; size: number; mimetype: string; buffer: Buffer }
  ): Promise<UploadResult> {
    const requestId = `upload-${uuidv4()}`;
    logger.info('Starting file upload', {
      requestId,
      userId,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    try {
      // Validate file
      this.validationService.validateFile(file);

      // Generate unique receipt ID
      const receiptId = uuidv4();

      // Generate file path
      const filePath = this.validationService.generateFilePath(
        userId,
        receiptId,
        file.originalname
      );

      // Upload to storage
      await this.storageService.uploadFile(filePath, file.buffer, file.mimetype, {
        userId,
        receiptId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      });

      // Generate signed URL
      const fileUrl = await this.storageService.generateSignedUrl(filePath);

      const result: UploadResult = {
        receiptId,
        fileName: file.originalname,
        filePath,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };

      logger.info('File upload completed successfully', {
        requestId,
        receiptId,
        filePath,
      });

      return result;
    } catch (error) {
      logger.error('File upload failed', {
        requestId,
        userId,
        filename: file.originalname,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a receipt file
   */
  async deleteReceiptFile(filePath: string): Promise<void> {
    logger.info('Deleting file', { filePath });

    try {
      await this.storageService.deleteFile(filePath);
      logger.info('File deleted successfully', { filePath });
    } catch (error) {
      logger.error('Failed to delete file', { filePath, error });
      throw error;
    }
  }

  /**
   * Generate a new signed URL for an existing file
   */
  async generateFileUrl(filePath: string): Promise<string> {
    logger.info('Generating signed URL', { filePath });

    try {
      // Check if file exists
      const exists = await this.storageService.fileExists(filePath);
      if (!exists) {
        throw new AppError('File not found', 404);
      }

      const url = await this.storageService.generateSignedUrl(filePath);
      logger.info('Signed URL generated successfully', { filePath });
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', { filePath, error });
      throw error;
    }
  }
}
