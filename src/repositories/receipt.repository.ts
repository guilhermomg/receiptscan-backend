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
import type { DocumentData } from 'firebase-admin/firestore';

export class ReceiptRepository {
  private receiptsCollection = 'receipts';
  private readonly MAX_TAGS_FILTER = 10;

  private getDb() {
    return getFirestore();
  }

  /**
   * Helper method to convert Firestore timestamp to Date
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertFirestoreDate(date: any): Date {
    return date?.toDate ? date.toDate() : new Date(date);
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
        deletedAt: null,
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

      // Check if soft deleted
      if (data.deletedAt) {
        return null;
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
        .where('userId', '==', params.userId)
        .where('deletedAt', '==', null); // Exclude soft-deleted receipts

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

      if (params.merchant) {
        query = query.where('merchant', '==', params.merchant);
      }

      if (params.status) {
        query = query.where('status', '==', params.status);
      }

      if (params.tags && params.tags.length > 0) {
        // Firestore supports array-contains but only for single value
        // For multiple tags, we'll filter in memory after fetching
        query = query.where(
          'tags',
          'array-contains-any',
          params.tags.slice(0, this.MAX_TAGS_FILTER)
        );
      }

      // Get total count BEFORE applying sorting to avoid index issues
      const countQuery = query.count();
      const countSnapshot = await countQuery.get();
      const total = countSnapshot.data().count;

      // Apply sorting AFTER count query
      const sortField = params.sortBy || 'date';
      const sortOrder = params.sortOrder || 'desc';
      query = query.orderBy(sortField, sortOrder);

      // Cursor-based pagination
      const limit = params.limit || 20;
      if (params.startAfter) {
        const startAfterDoc = await this.getDb()
          .collection(this.receiptsCollection)
          .doc(params.startAfter)
          .get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      query = query.limit(limit);

      const snapshot = await query.get();
      const receipts: Receipt[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push(this.mapDocumentToReceipt(doc.id, data));
      });

      // Apply search filter if provided (client-side filtering)
      let filteredReceipts = receipts;
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredReceipts = receipts.filter(
          (receipt) =>
            receipt.merchant.toLowerCase().includes(searchLower) ||
            receipt.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      // Determine if there are more results
      const hasMore = receipts.length === limit;
      const nextCursor =
        hasMore && receipts.length > 0 ? receipts[receipts.length - 1].id : undefined;

      return {
        receipts: filteredReceipts,
        total,
        limit,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      logger.error('Error fetching receipts', {
        userId: params.userId,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        params,
      });
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
    startAfter?: string
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      startDate,
      endDate,
      limit,
      startAfter,
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
    startAfter?: string
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      category,
      limit,
      startAfter,
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
   * Delete receipt (soft delete with deletedAt timestamp)
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

      // Check if already deleted
      if (data.deletedAt) {
        throw new AppError('Receipt already deleted', 400);
      }

      // Soft delete - set deletedAt timestamp
      await receiptRef.update({
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Receipt soft deleted successfully', { receiptId, userId });
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
    startAfter?: string
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      tags,
      limit,
      startAfter,
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
    startAfter?: string
  ): Promise<PaginatedReceipts> {
    return this.getReceiptsByUserId({
      userId,
      status,
      limit,
      startAfter,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }

  /**
   * Get receipt statistics
   */
  public async getReceiptStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    groupBy?: 'category' | 'month'
  ): Promise<{
    totalAmount: number;
    count: number;
    byCategory?: Record<string, { amount: number; count: number }>;
    byPeriod?: Record<string, { amount: number; count: number }>;
  }> {
    try {
      let query = this.getDb()
        .collection(this.receiptsCollection)
        .where('userId', '==', userId)
        .where('deletedAt', '==', null);

      if (startDate) {
        query = query.where('date', '>=', startDate);
      }

      if (endDate) {
        query = query.where('date', '<=', endDate);
      }

      const snapshot = await query.get();

      let totalAmount = 0;
      let count = 0;
      const byCategory: Record<string, { amount: number; count: number }> = {};
      const byPeriod: Record<string, { amount: number; count: number }> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        totalAmount += data.total || 0;
        count++;

        // Group by category
        if (groupBy === 'category') {
          const category = data.category || 'Other';
          if (!byCategory[category]) {
            byCategory[category] = { amount: 0, count: 0 };
          }
          byCategory[category].amount += data.total || 0;
          byCategory[category].count++;
        }

        // Group by month
        if (groupBy === 'month') {
          const date = this.convertFirestoreDate(data.date);
          const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!byPeriod[period]) {
            byPeriod[period] = { amount: 0, count: 0 };
          }
          byPeriod[period].amount += data.total || 0;
          byPeriod[period].count++;
        }
      });

      const result: {
        totalAmount: number;
        count: number;
        byCategory?: Record<string, { amount: number; count: number }>;
        byPeriod?: Record<string, { amount: number; count: number }>;
      } = {
        totalAmount,
        count,
      };

      if (groupBy === 'category') {
        result.byCategory = byCategory;
      }

      if (groupBy === 'month') {
        result.byPeriod = byPeriod;
      }

      return result;
    } catch (error) {
      logger.error('Error fetching receipt stats', { userId, error });
      throw new AppError('Failed to fetch receipt statistics', 500);
    }
  }

  /**
   * Helper method to map Firestore document to Receipt interface
   */
  private mapDocumentToReceipt(id: string, data: DocumentData): Receipt {
    return {
      id,
      userId: data.userId,
      merchant: data.merchant,
      date: this.convertFirestoreDate(data.date),
      total: data.total,
      tax: data.tax,
      currency: data.currency,
      category: data.category,
      tags: data.tags || [],
      lineItems: data.lineItems || [],
      imageUrl: data.imageUrl,
      status: data.status,
      createdAt: this.convertFirestoreDate(data.createdAt),
      updatedAt: this.convertFirestoreDate(data.updatedAt),
      deletedAt: data.deletedAt ? this.convertFirestoreDate(data.deletedAt) : null,
    };
  }
}
