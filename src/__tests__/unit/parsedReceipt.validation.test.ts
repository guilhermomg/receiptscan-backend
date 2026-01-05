/**
 * Unit tests for parsed receipt validation schemas
 */

import {
  parseReceiptRequestSchema,
  receiptIdParamSchema,
} from '../../models/parsedReceipt.validation';

describe('ParsedReceipt Validation Schemas', () => {
  describe('parseReceiptRequestSchema', () => {
    it('should validate an empty request body', () => {
      const validRequest = {};

      const result = parseReceiptRequestSchema.parse(validRequest);
      expect(result).toEqual({});
    });

    it('should accept any request (body is now empty for path-based parsing)', () => {
      const requestWithExtra = {
        someField: 'should be allowed',
      };

      // The schema now allows any fields since body validation is not needed
      const result = parseReceiptRequestSchema.parse(requestWithExtra);
      expect(result).toBeDefined();
    });
  });

  describe('receiptIdParamSchema', () => {
    it('should validate a valid receipt ID', () => {
      const validParam = {
        receiptId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = receiptIdParamSchema.parse(validParam);
      expect(result.receiptId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject request with invalid UUID for receiptId', () => {
      const invalidParam = {
        receiptId: 'not-a-uuid',
      };

      expect(() => receiptIdParamSchema.parse(invalidParam)).toThrow();
    });

    it('should reject request without receiptId', () => {
      const invalidParam = {};

      expect(() => receiptIdParamSchema.parse(invalidParam)).toThrow();
    });

    it('should reject request with empty receiptId string', () => {
      const invalidParam = {
        receiptId: '',
      };

      expect(() => receiptIdParamSchema.parse(invalidParam)).toThrow();
    });

    it('should reject request with invalid UUID format', () => {
      const invalidParam = {
        receiptId: '123e4567-e89b-12d3-a456',
      };

      expect(() => receiptIdParamSchema.parse(invalidParam)).toThrow();
    });
  });
});
