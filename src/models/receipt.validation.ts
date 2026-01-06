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
 * Merchant details validation schema
 */
export const merchantDetailsSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
});

/**
 * Confidence scores validation schema
 */
export const confidenceScoresSchema = z.object({
  merchant: z.number().min(0).max(1).optional(),
  date: z.number().min(0).max(1).optional(),
  total: z.number().min(0).max(1).optional(),
  tax: z.number().min(0).max(1).optional(),
  currency: z.number().min(0).max(1).optional(),
  category: z.number().min(0).max(1).optional(),
  payment: z.number().min(0).max(1).optional(),
  lineItems: z.number().min(0).max(1).optional(),
  overall: z.number().min(0).max(1).optional(),
});

/**
 * Line item validation schema
 */
export const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  category: z.string().min(1).max(100).optional(),
});

/**
 * Create receipt DTO validation schema
 */
export const createReceiptSchema = z.object({
  merchant: z.string().min(1).max(200),
  merchantDetails: merchantDetailsSchema.optional(),
  date: z.coerce.date(),
  total: z.number().nonnegative(),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  tip: z.number().nonnegative().optional(),
  currency: currencySchema,
  category: receiptCategorySchema,
  paymentMethod: z.string().max(100).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  lineItems: z.array(lineItemSchema).max(100).default([]),
  imageUrl: z.string().url().optional(),
  status: receiptStatusSchema.default(ReceiptStatus.UPLOADED),
  confidenceScores: confidenceScoresSchema.optional(),
});

/**
 * Update receipt DTO validation schema
 */
export const updateReceiptSchema = z.object({
  merchant: z.string().min(1).max(200).optional(),
  merchantDetails: merchantDetailsSchema.optional(),
  date: z.coerce.date().optional(),
  total: z.number().nonnegative().optional(),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  tip: z.number().nonnegative().optional(),
  currency: currencySchema.optional(),
  category: receiptCategorySchema.optional(),
  paymentMethod: z.string().max(100).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  lineItems: z.array(lineItemSchema).max(100).optional(),
  imageUrl: z.string().url().optional(),
  status: receiptStatusSchema.optional(),
  confidenceScores: confidenceScoresSchema.optional(),
});

/**
 * Query parameters validation schema
 */
export const receiptQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.string().optional(),
  merchant: z.string().optional(),
  status: receiptStatusSchema.optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined)),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startAfter: z.string().optional(),
  sortBy: z.enum(['date', 'total', 'merchant', 'createdAt', 'updatedAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type inference from Zod schemas
 */
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type ReceiptQueryInput = z.infer<typeof receiptQuerySchema>;
