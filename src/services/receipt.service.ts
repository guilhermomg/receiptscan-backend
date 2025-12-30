import { Receipt, CreateReceiptDto } from '../models/receipt.model';

/**
 * Service for managing receipt business logic
 */
export class ReceiptService {
  /**
   * Create a new receipt
   */
  async create(userId: string, data: CreateReceiptDto): Promise<Receipt> {
    const receipt: Receipt = {
      id: this.generateId(),
      userId,
      merchant: data.merchant,
      date: data.date,
      total: data.total,
      tax: data.tax || 0,
      currency: data.currency,
      category: data.category,
      tags: data.tags || [],
      lineItems: data.lineItems || [],
      imageUrl: data.imageUrl,
      status: 'completed',
      confidence: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In real implementation, this would save to database
    return receipt;
  }

  /**
   * Get receipt by ID
   */
  async getById(_receiptId: string, _userId: string): Promise<Receipt | null> {
    // Placeholder implementation
    // In real code, this would query the database
    return null;
  }

  /**
   * List receipts for a user
   */
  async list(
    _userId: string,
    _options?: {
      limit?: number;
      offset?: number;
      category?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Receipt[]> {
    // Placeholder implementation
    // In real code, this would query the database with filters
    return [];
  }

  /**
   * Update receipt
   */
  async update(
    _receiptId: string,
    _userId: string,
    _updates: Partial<Receipt>
  ): Promise<Receipt | null> {
    // Placeholder implementation
    return null;
  }

  /**
   * Soft delete receipt
   */
  async delete(_receiptId: string, _userId: string): Promise<boolean> {
    // Placeholder implementation
    // In real code, this would set deletedAt timestamp
    return true;
  }

  /**
   * Calculate total spending by category
   */
  async getTotalByCategory(
    _userId: string,
    _startDate?: Date,
    _endDate?: Date
  ): Promise<Record<string, number>> {
    // Placeholder implementation
    return {
      'Food & Dining': 250.0,
      Transportation: 100.0,
      'Office Supplies': 75.5,
    };
  }

  /**
   * Validate receipt data
   */
  validateReceiptData(data: CreateReceiptDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.merchant || data.merchant.trim().length === 0) {
      errors.push('Merchant name is required');
    }

    if (!data.date) {
      errors.push('Receipt date is required');
    }

    if (data.total <= 0) {
      errors.push('Total must be greater than 0');
    }

    if (!data.currency || data.currency.length !== 3) {
      errors.push('Currency must be a valid ISO 4217 code (e.g., USD, EUR)');
    }

    if (!data.imageUrl || !this.isValidUrl(data.imageUrl)) {
      errors.push('Valid image URL is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate tax percentage
   */
  calculateTaxPercentage(total: number, tax: number): number {
    if (total === 0) return 0;
    return (tax / total) * 100;
  }

  /**
   * Check if user has reached receipt limit for their tier
   */
  async checkUserLimit(
    _userId: string,
    tier: 'free' | 'pro'
  ): Promise<{
    canUpload: boolean;
    currentCount: number;
    limit: number;
  }> {
    const limits = {
      free: 10,
      pro: 0, // unlimited
    };

    // Placeholder - would query actual count from database
    const currentCount = 5;
    const limit = limits[tier];
    const canUpload = tier === 'pro' || currentCount < limit;

    return {
      canUpload,
      currentCount,
      limit,
    };
  }

  private generateId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const receiptService = new ReceiptService();
