/// <reference types="multer" />
import multer from 'multer';
import { Request } from 'express';
import { FILE_UPLOAD_CONFIG } from '../services/fileValidation.service';
import { AppError } from './errorHandler';

/**
 * Multer configuration for file uploads
 * Files are stored in memory as buffers for direct upload to Cloud Storage
 */
const storage = multer.memoryStorage();

/**
 * File filter for multer
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Check MIME type
  if (FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type '${file.mimetype}' is not allowed`, 400));
  }
};

/**
 * Multer upload configuration
 */
export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.maxFileSize,
    files: 1, // Only allow single file upload per request
  },
});

/**
 * Single file upload middleware
 * Expects a field name 'receipt' in the multipart form
 */
export const uploadSingleFile = uploadMiddleware.single('receipt');
