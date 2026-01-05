/**
 * Receipt service layer - business logic for receipt operations
 */

import { ReceiptRepository } from '../repositories/receipt.repository';
import {
  Receipt,
  CreateReceiptDto,
  UpdateReceiptDto,
  ReceiptQueryParams,
  PaginatedReceipts,
  ReceiptStats,
} from '../models/receipt.model';
import { AppError } from '../middleware/errorHandler';
import { FileStorageService } from './fileStorage.service';
import logger from '../config/logger';

export class ReceiptService {
  private receiptRepository: ReceiptRepository;
  private fileStorageService: FileStorageService;

  constructor() {
    this.receiptRepository = new ReceiptRepository();
    this.fileStorageService = new FileStorageService();
  }

  public async createUploadedReceipt(
    userId: string,
    receiptId: string,
    imageUrl: string
  ): Promise<Receipt> {
    try {
      logger.debug('Creating uploaded receipt placeholder', { userId, receiptId });
      return await this.receiptRepository.createUploadedReceipt(userId, receiptId, imageUrl);
    } catch (error) {
      logger.error('Error in receipt service - createUploadedReceipt', {
        userId,
        receiptId,
        error,
      });
      throw error;
    }
  }

  private async withSignedImageUrl(receipt: Receipt): Promise<Receipt> {
    if (!receipt.imageUrl) {
      return receipt;
    }

    try {
      const signedUrl = await this.fileStorageService.generateSignedUrl(receipt.imageUrl);
      return { ...receipt, imageUrl: signedUrl };
    } catch (error) {
      // Return receipt without signed URL if generation fails to avoid breaking the response
      logger.warn('Failed to generate signed URL for receipt image', {
        receiptId: receipt.id,
        error,
      });
      return receipt;
    }
  }

  /**
   * Create a new receipt
   */
  public async createReceipt(userId: string, receiptData: CreateReceiptDto): Promise<Receipt> {
    try {
      logger.debug('Creating receipt', { userId, merchant: receiptData.merchant });
      return await this.receiptRepository.createReceipt(userId, receiptData);
    } catch (error) {
      logger.error('Error in receipt service - createReceipt', { userId, error });
      throw error;
    }
  }

  /**
   * Get a single receipt by ID
   */
  public async getReceiptById(receiptId: string, userId: string): Promise<Receipt> {
    try {
      logger.debug('Fetching receipt by ID', { receiptId, userId });
      const receipt = await this.receiptRepository.getReceiptById(receiptId, userId);

      if (!receipt) {
        throw new AppError('Receipt not found', 404);
      }

      return await this.withSignedImageUrl(receipt);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in receipt service - getReceiptById', { receiptId, userId, error });
      throw new AppError('Failed to fetch receipt', 500);
    }
  }

  /**
   * List receipts with filtering, sorting, and pagination
   */
  public async listReceipts(params: ReceiptQueryParams): Promise<PaginatedReceipts> {
    try {
      logger.debug('Listing receipts', { userId: params.userId, filters: params });
      const result = await this.receiptRepository.getReceiptsByUserId(params);

      const receiptsWithSignedUrls = await Promise.all(
        result.receipts.map((receipt) => this.withSignedImageUrl(receipt))
      );

      return { ...result, receipts: receiptsWithSignedUrls };
    } catch (error) {
      logger.error('Error in receipt service - listReceipts', { userId: params.userId, error });
      throw error;
    }
  }

  /**
   * Update a receipt
   */
  public async updateReceipt(
    receiptId: string,
    userId: string,
    updates: UpdateReceiptDto
  ): Promise<Receipt> {
    try {
      logger.debug('Updating receipt', { receiptId, userId, updates });

      // Validate that at least one field is being updated
      if (Object.keys(updates).length === 0) {
        throw new AppError('At least one field must be provided for update', 400);
      }

      return await this.receiptRepository.updateReceipt(receiptId, userId, updates);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in receipt service - updateReceipt', { receiptId, userId, error });
      throw new AppError('Failed to update receipt', 500);
    }
  }

  /**
   * Soft delete a receipt
   */
  public async deleteReceipt(receiptId: string, userId: string): Promise<void> {
    try {
      logger.debug('Deleting receipt', { receiptId, userId });
      await this.receiptRepository.deleteReceipt(receiptId, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error in receipt service - deleteReceipt', { receiptId, userId, error });
      throw new AppError('Failed to delete receipt', 500);
    }
  }

  /**
   * Get receipt statistics with optional grouping
   */
  public async getReceiptStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    groupBy?: 'category' | 'month'
  ): Promise<ReceiptStats> {
    try {
      logger.debug('Fetching receipt statistics', { userId, startDate, endDate, groupBy });
      return await this.receiptRepository.getReceiptStats(userId, startDate, endDate, groupBy);
    } catch (error) {
      logger.error('Error in receipt service - getReceiptStats', { userId, error });
      throw error;
    }
  }

  /**
   * Search receipts by merchant or tags
   */
  public async searchReceipts(
    userId: string,
    searchTerm: string,
    limit = 20,
    startAfter?: string
  ): Promise<PaginatedReceipts> {
    try {
      logger.debug('Searching receipts', { userId, searchTerm });

      const result = await this.receiptRepository.getReceiptsByUserId({
        userId,
        search: searchTerm,
        limit,
        startAfter,
        sortBy: 'date',
        sortOrder: 'desc',
      });

      const receiptsWithSignedUrls = await Promise.all(
        result.receipts.map((receipt) => this.withSignedImageUrl(receipt))
      );

      return { ...result, receipts: receiptsWithSignedUrls };
    } catch (error) {
      logger.error('Error in receipt service - searchReceipts', { userId, error });
      throw error;
    }
  }
}
