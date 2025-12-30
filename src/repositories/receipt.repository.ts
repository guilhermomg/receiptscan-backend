/**
 * Receipt repository layer - handles Firestore operations for receipts
 */

import { getFirestore } from '../config/firebase';
import {
  Receipt,
  CreateReceiptDto,
  UpdateReceiptDto,
  ReceiptQueryParams,
  PaginatedReceipts,
  ReceiptStatus,
} from '../models/receipt.model';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export class ReceiptRepository {
  private receiptsCollection = 'receipts';

  private getDb() {
    return getFirestore();
  }

  /**
   * Create a new receipt
   */
  public async createReceipt(userId: string, receiptData: CreateReceiptDto): Promise<Receipt> {
    try {
      const receiptId = uuidv4();
      const now = new Date();

      const receipt: Omit<Receipt, 'id'> = {
        userId,
        merchant: receiptData.merchant,
        date: receiptData.date,
        total: receiptData.total,
        tax: receiptData.tax,
        currency: receiptData.currency,
        category: receiptData.category,
        tags: receiptData.tags || [],
        lineItems: receiptData.lineItems || [],
        imageUrl: receiptData.imageUrl,
        status: receiptData.status || ReceiptStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      const receiptRef = this.getDb().collection(this.receiptsCollection).doc(receiptId);
      await receiptRef.set(receipt);

      logger.info('Receipt created successfully', { receiptId, userId });

      return {
        id: receiptId,
        ...receipt,
      };
    } catch (error) {
      logger.error('Error creating receipt', { userId, error });
      throw new AppError('Failed to create receipt', 500);
    }
  }

  /**
   * Get receipt by ID
   */
  public async getReceiptById(receiptId: string, userId: string): Promise<Receipt | null> {
    try {
      const receiptRef = this.getDb().collection(this.receiptsCollection).doc(receiptId);
      const receiptDoc = await receiptRef.get();

      if (!receiptDoc.exists) {
        return null;
      }

      const data = receiptDoc.data();
      if (!data) {
        return null;
      }

      // Verify ownership
      if (data.userId !== userId) {
        throw new AppError('Unauthorized access to receipt', 403);
      }

      return this.mapDocumentToReceipt(receiptDoc.id, data);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error fetching receipt', { receiptId, userId, error });
      throw new AppError('Failed to fetch receipt', 500);
    }
  }

  /**
   * Get receipts by user ID with pagination and filtering
   */
  public async getReceiptsByUserId(params: ReceiptQueryParams): Promise<PaginatedReceipts> {
    try {
      let query = this.getDb()
        .collection(this.receiptsCollection)
        .where('userId', '==', params.userId);

      // Apply filters
      if (params.startDate) {
        query = query.where('date', '>=', params.startDate);
      }

      if (params.endDate) {
        query = query.where('date', '<=', params.endDate);
      }

      if (params.category) {
        query = query.where('category', '==', params.category);
      }

      if (params.status) {
        query = query.where('status', '==', params.status);
      }

      if (params.tags && params.tags.length > 0) {
        // Firestore supports array-contains but only for single value
        // For multiple tags, we'll filter in memory after fetching
        query = query.where('tags', 'array-contains-any', params.tags.slice(0, 10));
      }

      // Apply sorting
      const sortField = params.sortBy || 'date';
      const sortOrder = params.sortOrder || 'desc';
      query = query.orderBy(sortField, sortOrder);

      // Get total count (without pagination)
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;

      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      const receipts: Receipt[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push(this.mapDocumentToReceipt(doc.id, data));
      });

      return {
        receipts,
        total,
        limit,
        offset,
        hasMore: offset + receipts.length < total,
      };
    } catch (error) {
      logger.error('Error fetching receipts', { userId: params.userId, error });
      throw new AppError('Failed to fetch receipts', 500);
    }
  }

  /**
   * Get receipts by date range
   */
  public async getReceiptsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit = 20,
    offset = 0
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      startDate,
      endDate,
      limit,
      offset,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  }

  /**
   * Get receipts by category
   */
  public async getReceiptsByCategory(
    userId: string,
    category: string,
    limit = 20,
    offset = 0
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      category,
      limit,
      offset,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  }

  /**
   * Update receipt
   */
  public async updateReceipt(
    receiptId: string,
    userId: string,
    updates: UpdateReceiptDto
  ): Promise<Receipt> {
    try {
      const receiptRef = this.getDb().collection(this.receiptsCollection).doc(receiptId);
      const receiptDoc = await receiptRef.get();

      if (!receiptDoc.exists) {
        throw new AppError('Receipt not found', 404);
      }

      const data = receiptDoc.data();
      if (!data) {
        throw new AppError('Receipt data is invalid', 500);
      }

      // Verify ownership
      if (data.userId !== userId) {
        throw new AppError('Unauthorized access to receipt', 403);
      }

      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date(),
      };

      await receiptRef.update(updateData);

      logger.info('Receipt updated successfully', { receiptId, userId });

      // Fetch and return updated receipt
      const updatedDoc = await receiptRef.get();
      const updatedData = updatedDoc.data();
      if (!updatedData) {
        throw new AppError('Failed to retrieve updated receipt', 500);
      }

      return this.mapDocumentToReceipt(receiptId, updatedData);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating receipt', { receiptId, userId, error });
      throw new AppError('Failed to update receipt', 500);
    }
  }

  /**
   * Delete receipt (soft delete by marking as failed or hard delete)
   */
  public async deleteReceipt(receiptId: string, userId: string): Promise<void> {
    try {
      const receiptRef = this.getDb().collection(this.receiptsCollection).doc(receiptId);
      const receiptDoc = await receiptRef.get();

      if (!receiptDoc.exists) {
        throw new AppError('Receipt not found', 404);
      }

      const data = receiptDoc.data();
      if (!data) {
        throw new AppError('Receipt data is invalid', 500);
      }

      // Verify ownership
      if (data.userId !== userId) {
        throw new AppError('Unauthorized access to receipt', 403);
      }

      // Hard delete
      await receiptRef.delete();

      logger.info('Receipt deleted successfully', { receiptId, userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting receipt', { receiptId, userId, error });
      throw new AppError('Failed to delete receipt', 500);
    }
  }

  /**
   * Get receipts by tags
   */
  public async getReceiptsByTags(
    userId: string,
    tags: string[],
    limit = 20,
    offset = 0
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      tags,
      limit,
      offset,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  }

  /**
   * Get receipts by status
   */
  public async getReceiptsByStatus(
    userId: string,
    status: ReceiptStatus,
    limit = 20,
    offset = 0
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      status,
      limit,
      offset,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }

  /**
   * Helper method to map Firestore document to Receipt interface
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapDocumentToReceipt(id: string, data: any): Receipt {
    return {
      id,
      userId: data.userId,
      merchant: data.merchant,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      total: data.total,
      tax: data.tax,
      currency: data.currency,
      category: data.category,
      tags: data.tags || [],
      lineItems: data.lineItems || [],
      imageUrl: data.imageUrl,
      status: data.status,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    };
  }
}
