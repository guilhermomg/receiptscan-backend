/**
 * Unit tests for parsed receipt validation schemas
 */

import { parseReceiptRequestSchema } from '../../models/parsedReceipt.validation';

describe('ParsedReceipt Validation Schemas', () => {
  describe('parseReceiptRequestSchema', () => {
    it('should validate a valid parse request with imageUrl only', () => {
      const validRequest = {
        imageUrl: 'https://storage.googleapis.com/bucket/receipt.jpg',
      };

      const result = parseReceiptRequestSchema.parse(validRequest);
      expect(result.imageUrl).toBe('https://storage.googleapis.com/bucket/receipt.jpg');
      expect(result.receiptId).toBeUndefined();
    });

    it('should validate a valid parse request with imageUrl and receiptId', () => {
      const validRequest = {
        imageUrl: 'https://storage.googleapis.com/bucket/receipt.jpg',
        receiptId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = parseReceiptRequestSchema.parse(validRequest);
      expect(result.imageUrl).toBe('https://storage.googleapis.com/bucket/receipt.jpg');
      expect(result.receiptId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject request with invalid URL', () => {
      const invalidRequest = {
        imageUrl: 'not-a-valid-url',
      };

      expect(() => parseReceiptRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with invalid UUID for receiptId', () => {
      const invalidRequest = {
        imageUrl: 'https://storage.googleapis.com/bucket/receipt.jpg',
        receiptId: 'not-a-uuid',
      };

      expect(() => parseReceiptRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request without imageUrl', () => {
      const invalidRequest = {
        receiptId: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(() => parseReceiptRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject empty request', () => {
      const invalidRequest = {};

      expect(() => parseReceiptRequestSchema.parse(invalidRequest)).toThrow();
    });
  });
});
