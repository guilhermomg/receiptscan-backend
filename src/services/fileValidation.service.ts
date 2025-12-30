/// <reference types="multer" />
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

/**
 * File validation configuration
 */
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'application/pdf',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.pdf'],
};

/**
 * File validation service
 */
export class FileValidationService {
  /**
   * Validate file size
   */
  validateFileSize(fileSize: number): void {
    if (fileSize > FILE_UPLOAD_CONFIG.maxFileSize) {
      logger.warn('File size exceeds limit', { fileSize, maxSize: FILE_UPLOAD_CONFIG.maxFileSize });
      throw new AppError(
        `File size exceeds the maximum limit of ${FILE_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`,
        400
      );
    }
  }

  /**
   * Validate file MIME type
   */
  validateMimeType(mimetype: string): void {
    if (!FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(mimetype)) {
      logger.warn('Invalid file type', { mimetype });
      throw new AppError(
        `File type '${mimetype}' is not allowed. Allowed types: images and PDF files`,
        400
      );
    }
  }

  /**
   * Validate file extension
   */
  validateFileExtension(filename: string): void {
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
      logger.warn('Invalid file extension', { filename, extension });
      throw new AppError(
        `File extension '${extension}' is not allowed. Allowed extensions: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
        400
      );
    }
  }

  /**
   * Comprehensive file validation
   */
  validateFile(file: { originalname: string; size: number; mimetype: string }): void {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    this.validateFileSize(file.size);
    this.validateMimeType(file.mimetype);
    this.validateFileExtension(file.originalname);

    logger.debug('File validation passed', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  /**
   * Generate secure file path
   */
  generateFilePath(userId: string, receiptId: string, originalFilename: string): string {
    const timestamp = Date.now();
    const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
    const sanitizedFilename = originalFilename
      .substring(0, originalFilename.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    return `receipts/${userId}/${receiptId}/${timestamp}-${sanitizedFilename}${extension}`;
  }
}
