/**
 * Analytics service - provides spending insights and aggregations
 */

import { ReceiptRepository } from '../repositories/receipt.repository';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

export type TimePeriod = 'this_month' | 'last_month' | 'ytd' | 'custom';

export interface AnalyticsOptions {
  userId: string;
  period: TimePeriod;
  startDate?: Date;
  endDate?: Date;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM format
  amount: number;
  count: number;
}

export interface TopMerchant {
  merchant: string;
  amount: number;
  count: number;
  avgAmount: number;
}

export interface AnalyticsResult {
  summary: {
    totalAmount: number;
    totalReceipts: number;
    avgAmount: number;
    period: {
      start: Date;
      end: Date;
    };
  };
  byCategory: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  topMerchants: TopMerchant[];
}

export class AnalyticsService {
  private receiptRepository: ReceiptRepository;

  constructor() {
    this.receiptRepository = new ReceiptRepository();
  }

  /**
   * Get spending analytics for a user
   */
  public async getAnalytics(options: AnalyticsOptions): Promise<AnalyticsResult> {
    try {
      logger.info('Generating analytics', {
        userId: options.userId,
        period: options.period,
      });

      // Calculate date range based on period
      const { startDate, endDate } = this.calculateDateRange(options);

      // Fetch all receipts in the date range
      const receipts = await this.fetchReceiptsForAnalytics(options.userId, startDate, endDate);

      if (receipts.length === 0) {
        return this.getEmptyAnalytics(startDate, endDate);
      }

      // Calculate summary statistics
      const totalAmount = receipts.reduce((sum, r) => sum + r.total, 0);
      const totalReceipts = receipts.length;
      const avgAmount = totalAmount / totalReceipts;

      // Generate category breakdown
      const byCategory = this.calculateCategoryBreakdown(receipts, totalAmount);

      // Generate monthly trends
      const monthlyTrends = this.calculateMonthlyTrends(receipts);

      // Generate top merchants
      const topMerchants = this.calculateTopMerchants(receipts);

      logger.info('Analytics generated successfully', {
        userId: options.userId,
        totalReceipts,
        totalAmount,
      });

      return {
        summary: {
          totalAmount,
          totalReceipts,
          avgAmount,
          period: {
            start: startDate,
            end: endDate,
          },
        },
        byCategory,
        monthlyTrends,
        topMerchants,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error generating analytics', { userId: options.userId, error });
      throw new AppError('Failed to generate analytics', 500);
    }
  }

  /**
   * Calculate date range based on period
   */
  private calculateDateRange(options: AnalyticsOptions): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (options.period) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;

      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;

      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;

      case 'custom':
        if (!options.startDate || !options.endDate) {
          throw new AppError('Custom period requires startDate and endDate', 400);
        }
        startDate = new Date(options.startDate);
        endDate = new Date(options.endDate);
        break;

      default:
        throw new AppError('Invalid period specified', 400);
    }

    return { startDate, endDate };
  }

  /**
   * Fetch receipts for analytics
   */
  private async fetchReceiptsForAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ merchant: string; total: number; category: string; date: Date }>> {
    const receipts: Array<{ merchant: string; total: number; category: string; date: Date }> = [];
    let hasMore = true;
    let startAfter: string | undefined;

    while (hasMore) {
      const result = await this.receiptRepository.getReceiptsByUserId({
        userId,
        startDate,
        endDate,
        limit: 100,
        startAfter,
        sortBy: 'date',
        sortOrder: 'desc',
      });

      receipts.push(
        ...result.receipts
          .filter((r) => r.merchant && r.category && r.date)
          .map((r) => ({
            merchant: r.merchant!,
            total: r.total,
            category: r.category!,
            date: r.date instanceof Date ? r.date : new Date(r.date!),
          }))
      );

      hasMore = result.hasMore;
      startAfter = result.nextCursor;
    }

    return receipts;
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(
    receipts: Array<{ category: string; total: number }>,
    totalAmount: number
  ): CategoryBreakdown[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    receipts.forEach((receipt) => {
      const existing = categoryMap.get(receipt.category) || { amount: 0, count: 0 };
      categoryMap.set(receipt.category, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        amount: stats.amount,
        count: stats.count,
        percentage: (stats.amount / totalAmount) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate monthly trends
   */
  private calculateMonthlyTrends(receipts: Array<{ date: Date; total: number }>): MonthlyTrend[] {
    const monthMap = new Map<string, { amount: number; count: number }>();

    receipts.forEach((receipt) => {
      const date = receipt.date instanceof Date ? receipt.date : new Date(receipt.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthMap.get(month) || { amount: 0, count: 0 };
      monthMap.set(month, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1,
      });
    });

    return Array.from(monthMap.entries())
      .map(([month, stats]) => ({
        month,
        amount: stats.amount,
        count: stats.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate top merchants
   */
  private calculateTopMerchants(
    receipts: Array<{ merchant: string; total: number }>
  ): TopMerchant[] {
    const merchantMap = new Map<string, { amount: number; count: number }>();

    receipts.forEach((receipt) => {
      const existing = merchantMap.get(receipt.merchant) || { amount: 0, count: 0 };
      merchantMap.set(receipt.merchant, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1,
      });
    });

    return Array.from(merchantMap.entries())
      .map(([merchant, stats]) => ({
        merchant,
        amount: stats.amount,
        count: stats.count,
        avgAmount: stats.amount / stats.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 merchants
  }

  /**
   * Get empty analytics result
   */
  private getEmptyAnalytics(startDate: Date, endDate: Date): AnalyticsResult {
    return {
      summary: {
        totalAmount: 0,
        totalReceipts: 0,
        avgAmount: 0,
        period: {
          start: startDate,
          end: endDate,
        },
      },
      byCategory: [],
      monthlyTrends: [],
      topMerchants: [],
    };
  }
}
