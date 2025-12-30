/**
 * Zod validation schemas for receipt parsing
 */

import { z } from 'zod';

/**
 * Parse receipt request validation schema
 */
export const parseReceiptRequestSchema = z.object({
  imageUrl: z.string().url({ message: 'Valid image URL is required' }),
  receiptId: z.string().uuid().optional(),
});

/**
 * Type inference from schema
 */
export type ParseReceiptRequestInput = z.infer<typeof parseReceiptRequestSchema>;
