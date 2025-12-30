/**
 * Receipt data model interface
 */
export interface Receipt {
  id: string;
  userId: string;
  merchant: string;
  date: Date;
  total: number;
  tax: number;
  currency: string;
  category: string;
  tags: string[];
  lineItems: LineItem[];
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Line item in a receipt
 */
export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

/**
 * User data model interface
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionId?: string;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create receipt request DTO
 */
export interface CreateReceiptDto {
  merchant: string;
  date: Date;
  total: number;
  tax?: number;
  currency: string;
  category: string;
  tags?: string[];
  lineItems?: LineItem[];
  imageUrl: string;
}
