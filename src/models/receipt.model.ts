/**
 * Receipt data models and types
 */

/**
 * Receipt processing status
 */
export enum ReceiptStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
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
  merchant: string;
  date: Date;
  total: number;
  tax?: number;
  currency: Currency;
  category: ReceiptCategory | string; // Supports predefined + custom categories
  tags: string[];
  lineItems: LineItem[];
  imageUrl?: string;
  status: ReceiptStatus;
  createdAt: Date;
  updatedAt: Date;
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
  status?: ReceiptStatus;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'total' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated receipt results
 */
export interface PaginatedReceipts {
  receipts: Receipt[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
