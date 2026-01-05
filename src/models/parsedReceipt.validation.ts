/**
 * Zod validation schemas for receipt parsing
 */

import { z } from 'zod';

/**
 * Parse receipt request validation schema
 */
export const parseReceiptRequestSchema = z.object({});

/**
 * Receipt ID validation schema (for URL param)
 */
export const receiptIdParamSchema = z.object({
  receiptId: z.string().uuid({ message: 'Valid receipt ID (UUID) is required' }),
});

/**
 * Type inference from schema
 */
export type ParseReceiptRequestInput = z.infer<typeof parseReceiptRequestSchema>;
export type ReceiptIdParam = z.infer<typeof receiptIdParamSchema>;
