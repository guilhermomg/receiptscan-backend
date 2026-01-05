/**
 * Receipt data models and types
 */

/**
 * Receipt processing status
 */
export enum ReceiptStatus {
  UPLOADED = 'uploaded',
  PARSING = 'parsing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Predefined receipt categories
 */
export enum ReceiptCategory {
  FOOD_DINING = 'Food & Dining',
  TRANSPORTATION = 'Transportation',
  OFFICE_SUPPLIES = 'Office Supplies',
  TRAVEL = 'Travel',
  HEALTHCARE = 'Healthcare',
  OTHER = 'Other',
}

/**
 * ISO 4217 currency codes
 */
export type Currency = 'USD' | 'EUR' | 'BRL' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY';

/**
 * Line item within a receipt
 */
export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

/**
 * Complete receipt document
 */
export interface Receipt {
  id: string;
  userId: string;
  merchant?: string;
  date?: Date;
  total: number;
  tax?: number;
  currency?: Currency;
  category?: ReceiptCategory | string; // Supports predefined + custom categories
  tags: string[];
  lineItems: LineItem[];
  imageUrl?: string;
  status: ReceiptStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null; // Soft delete timestamp
}

/**
 * Data transfer object for creating a receipt
 */
export interface CreateReceiptDto {
  merchant: string;
  date: Date;
  total: number;
  tax?: number;
  currency: Currency;
  category: ReceiptCategory | string;
  tags?: string[];
  lineItems?: LineItem[];
  imageUrl?: string;
  status?: ReceiptStatus;
}

/**
 * Data transfer object for updating a receipt
 */
export interface UpdateReceiptDto {
  merchant?: string;
  date?: Date;
  total?: number;
  tax?: number;
  currency?: Currency;
  category?: ReceiptCategory | string;
  tags?: string[];
  lineItems?: LineItem[];
  imageUrl?: string;
  status?: ReceiptStatus;
}

/**
 * Query parameters for filtering receipts
 */
export interface ReceiptQueryParams {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  merchant?: string;
  status?: ReceiptStatus;
  tags?: string[];
  search?: string; // Search across merchant and tags
  limit?: number;
  startAfter?: string; // Cursor for pagination (document ID)
  sortBy?: 'date' | 'total' | 'merchant' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated receipt results with cursor-based pagination
 */
export interface PaginatedReceipts {
  receipts: Receipt[];
  total: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string; // Next page cursor (last document ID)
}

/**
 * Receipt statistics for aggregation
 */
export interface ReceiptStats {
  totalAmount: number;
  count: number;
  byCategory?: Record<string, { amount: number; count: number }>;
  byPeriod?: Record<string, { amount: number; count: number }>;
}
