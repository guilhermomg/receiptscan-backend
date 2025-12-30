import { getStorage } from '../config/firebase';
import config from '../config';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * File storage service for Firebase Cloud Storage
 */
export class FileStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = config.firebase.storageBucket;
  }

  /**
   * Upload file to Cloud Storage
   */
  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    mimetype: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      await file.save(fileBuffer, {
        metadata: {
          contentType: mimetype,
          metadata: metadata || {},
        },
        public: false,
      });

      logger.info('File uploaded successfully', { filePath, mimetype });
      return filePath;
    } catch (error) {
      logger.error('Failed to upload file', { filePath, error });
      throw new AppError('Failed to upload file to storage', 500);
    }
  }

  /**
   * Generate signed URL for file access
   * URL expires after 1 hour
   */
  async generateSignedUrl(filePath: string): Promise<string> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
      });

      logger.debug('Signed URL generated', { filePath });
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', { filePath, error });
      throw new AppError('Failed to generate file access URL', 500);
    }
  }

  /**
   * Delete file from Cloud Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      // Check if file exists before attempting to delete
      const [exists] = await file.exists();
      if (!exists) {
        logger.warn('File does not exist, skipping deletion', { filePath });
        return;
      }

      await file.delete();
      logger.info('File deleted successfully', { filePath });
    } catch (error) {
      logger.error('Failed to delete file', { filePath, error });
      throw new AppError('Failed to delete file from storage', 500);
    }
  }

  /**
   * Check if file exists in Cloud Storage
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      logger.error('Failed to check file existence', { filePath, error });
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<Record<string, unknown>> {
    try {
      const storage = getStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      logger.error('Failed to get file metadata', { filePath, error });
      throw new AppError('Failed to get file metadata', 500);
    }
  }
}
