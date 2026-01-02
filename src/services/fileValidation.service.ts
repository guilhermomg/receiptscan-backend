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
  // Additional MIME type mappings for better detection
  mimeTypeExtensionMap: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff'],
    'application/pdf': ['.pdf'],
  },
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
   * Falls back to MIME type if extension is not available
   */
  validateFileExtension(filename: string, mimetype?: string): void {
    // Add defensive check and detailed logging
    logger.debug('validateFileExtension called', {
      filename,
      type: typeof filename,
      isString: typeof filename === 'string',
      length: typeof filename === 'string' ? filename.length : 'N/A',
      isEmpty: !filename,
      mimetype,
    });

    if (!filename || typeof filename !== 'string') {
      logger.warn('Invalid filename - not a string', { filename, type: typeof filename });
      // If we have a MIME type, we can still validate using that
      if (mimetype && FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(mimetype)) {
        logger.info('File validation using MIME type fallback', { mimetype });
        return;
      }
      throw new AppError('File must have a valid extension', 400);
    }

    // Trim and normalize the filename
    const normalizedFilename = filename.trim();

    if (!normalizedFilename) {
      logger.warn('Empty filename after trimming', { originalFilename: filename });
      throw new AppError('File must have a valid extension', 400);
    }

    const lastDotIndex = normalizedFilename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      logger.warn('File has no extension', {
        filename: normalizedFilename,
        length: normalizedFilename.length,
      });
      // Fallback to MIME type validation
      if (mimetype && FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(mimetype)) {
        logger.info('File validation using MIME type fallback (no extension)', {
          filename: normalizedFilename,
          mimetype,
        });
        return;
      }
      throw new AppError('File must have a valid extension', 400);
    }

    const extension = normalizedFilename.substring(lastDotIndex).toLowerCase();
    logger.debug('Extension validation', {
      filename: normalizedFilename,
      extension,
      allowed: FILE_UPLOAD_CONFIG.allowedExtensions.includes(extension),
    });

    if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
      logger.warn('Invalid file extension', { filename: normalizedFilename, extension });
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
    logger.debug('File validation started', {
      hasFile: !!file,
      fileKeys: file ? Object.keys(file) : [],
      originalname: file?.originalname,
      size: file?.size,
      mimetype: file?.mimetype,
    });

    if (!file) {
      throw new AppError('No file provided', 400);
    }

    this.validateFileSize(file.size);
    this.validateMimeType(file.mimetype);
    this.validateFileExtension(file.originalname, file.mimetype);

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
    const lastDotIndex = originalFilename.lastIndexOf('.');

    let extension = '';
    let baseFilename = originalFilename;

    if (lastDotIndex !== -1) {
      extension = originalFilename.substring(lastDotIndex);
      baseFilename = originalFilename.substring(0, lastDotIndex);
    }

    const sanitizedFilename = baseFilename.replace(/[^a-zA-Z0-9_-]/g, '_');

    return `receipts/${userId}/${receiptId}/${timestamp}-${sanitizedFilename}${extension}`;
  }
}
