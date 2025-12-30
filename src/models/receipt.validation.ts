/**
 * Zod validation schemas for receipt data
 */

import { z } from 'zod';
import { ReceiptStatus, ReceiptCategory } from './receipt.model';

/**
 * Currency validation schema
 */
const currencySchema = z.enum(['USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY']);

/**
 * Receipt status validation schema
 */
const receiptStatusSchema = z.nativeEnum(ReceiptStatus);

/**
 * Receipt category validation schema (supports predefined + custom)
 */
const receiptCategorySchema = z.union([z.nativeEnum(ReceiptCategory), z.string().min(1).max(100)]);

/**
 * Line item validation schema
 */
export const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
  category: z.string().min(1).max(100).optional(),
});

/**
 * Create receipt DTO validation schema
 */
export const createReceiptSchema = z.object({
  merchant: z.string().min(1).max(200),
  date: z.coerce.date(),
  total: z.number().nonnegative(),
  tax: z.number().nonnegative().optional(),
  currency: currencySchema,
  category: receiptCategorySchema,
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  lineItems: z.array(lineItemSchema).max(100).default([]),
  imageUrl: z.string().url().optional(),
  status: receiptStatusSchema.default(ReceiptStatus.PENDING),
});

/**
 * Update receipt DTO validation schema
 */
export const updateReceiptSchema = z.object({
  merchant: z.string().min(1).max(200).optional(),
  date: z.coerce.date().optional(),
  total: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  currency: currencySchema.optional(),
  category: receiptCategorySchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  lineItems: z.array(lineItemSchema).max(100).optional(),
  imageUrl: z.string().url().optional(),
  status: receiptStatusSchema.optional(),
});

/**
 * Query parameters validation schema
 */
export const receiptQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.string().optional(),
  status: receiptStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.enum(['date', 'total', 'createdAt', 'updatedAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type inference from Zod schemas
 */
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type ReceiptQueryInput = z.infer<typeof receiptQuerySchema>;
