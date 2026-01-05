/**
 * Unit tests for receipt validation schemas
 */

import {
  createReceiptSchema,
  updateReceiptSchema,
  receiptQuerySchema,
  lineItemSchema,
} from '../../models/receipt.validation';
import { ReceiptStatus } from '../../models/receipt.model';

describe('Receipt Validation Schemas', () => {
  describe('lineItemSchema', () => {
    it('should validate a valid line item', () => {
      const validLineItem = {
        description: 'Test Item',
        quantity: 2,
        unitPrice: 10.5,
        total: 21.0,
        category: 'Food',
      };

      const result = lineItemSchema.parse(validLineItem);
      expect(result).toEqual(validLineItem);
    });

    it('should reject line item with negative quantity', () => {
      const invalidLineItem = {
        description: 'Test Item',
        quantity: -1,
        unitPrice: 10.5,
        total: 21.0,
      };

      expect(() => lineItemSchema.parse(invalidLineItem)).toThrow();
    });

    it('should reject line item with negative price', () => {
      const invalidLineItem = {
        description: 'Test Item',
        quantity: 1,
        unitPrice: -10.5,
        total: 21.0,
      };

      expect(() => lineItemSchema.parse(invalidLineItem)).toThrow();
    });

    it('should accept line item without category', () => {
      const validLineItem = {
        description: 'Test Item',
        quantity: 1,
        unitPrice: 10.5,
        total: 10.5,
      };

      const result = lineItemSchema.parse(validLineItem);
      expect(result).toEqual(validLineItem);
    });
  });

  describe('createReceiptSchema', () => {
    it('should validate a valid receipt creation request', () => {
      const validReceipt = {
        merchant: 'Test Store',
        date: new Date('2024-01-15'),
        total: 127.45,
        tax: 11.25,
        currency: 'USD',
        category: 'Food & Dining',
        tags: ['groceries', 'food'],
        lineItems: [
          {
            description: 'Bananas',
            quantity: 2,
            unitPrice: 0.79,
            total: 1.58,
          },
        ],
        imageUrl: 'https://example.com/receipt.jpg',
        status: ReceiptStatus.UPLOADED,
      };

      const result = createReceiptSchema.parse(validReceipt);
      expect(result.merchant).toBe('Test Store');
      expect(result.total).toBe(127.45);
      expect(result.currency).toBe('USD');
    });

    it('should reject receipt with invalid currency', () => {
      const invalidReceipt = {
        merchant: 'Test Store',
        date: new Date(),
        total: 100,
        currency: 'INVALID',
        category: 'Food & Dining',
      };

      expect(() => createReceiptSchema.parse(invalidReceipt)).toThrow();
    });

    it('should reject receipt with negative total', () => {
      const invalidReceipt = {
        merchant: 'Test Store',
        date: new Date(),
        total: -100,
        currency: 'USD',
        category: 'Food & Dining',
      };

      expect(() => createReceiptSchema.parse(invalidReceipt)).toThrow();
    });

    it('should set default values for optional fields', () => {
      const minimalReceipt = {
        merchant: 'Test Store',
        date: new Date('2024-01-15'),
        total: 100,
        currency: 'USD',
        category: 'Food & Dining',
      };

      const result = createReceiptSchema.parse(minimalReceipt);
      expect(result.tags).toEqual([]);
      expect(result.lineItems).toEqual([]);
      expect(result.status).toBe(ReceiptStatus.UPLOADED);
    });

    it('should accept custom category', () => {
      const receiptWithCustomCategory = {
        merchant: 'Test Store',
        date: new Date(),
        total: 100,
        currency: 'USD',
        category: 'Custom Category',
      };

      const result = createReceiptSchema.parse(receiptWithCustomCategory);
      expect(result.category).toBe('Custom Category');
    });

    it('should reject receipt with too many tags', () => {
      const invalidReceipt = {
        merchant: 'Test Store',
        date: new Date(),
        total: 100,
        currency: 'USD',
        category: 'Food & Dining',
        tags: Array(21).fill('tag'),
      };

      expect(() => createReceiptSchema.parse(invalidReceipt)).toThrow();
    });

    it('should reject receipt with invalid image URL', () => {
      const invalidReceipt = {
        merchant: 'Test Store',
        date: new Date(),
        total: 100,
        currency: 'USD',
        category: 'Food & Dining',
        imageUrl: 'not-a-url',
      };

      expect(() => createReceiptSchema.parse(invalidReceipt)).toThrow();
    });
  });

  describe('updateReceiptSchema', () => {
    it('should validate partial updates', () => {
      const partialUpdate = {
        merchant: 'Updated Store',
        total: 150.0,
      };

      const result = updateReceiptSchema.parse(partialUpdate);
      expect(result.merchant).toBe('Updated Store');
      expect(result.total).toBe(150.0);
    });

    it('should validate empty update', () => {
      const emptyUpdate = {};
      const result = updateReceiptSchema.parse(emptyUpdate);
      expect(result).toEqual({});
    });

    it('should reject invalid partial updates', () => {
      const invalidUpdate = {
        total: -50,
      };

      expect(() => updateReceiptSchema.parse(invalidUpdate)).toThrow();
    });
  });

  describe('receiptQuerySchema', () => {
    it('should validate query parameters with defaults', () => {
      const query = {};
      const result = receiptQuerySchema.parse(query);

      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('date');
      expect(result.sortOrder).toBe('desc');
    });

    it('should parse date strings to Date objects', () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = receiptQuerySchema.parse(query);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should parse comma-separated tags', () => {
      const query = {
        tags: 'groceries,food,organic',
      };

      const result = receiptQuerySchema.parse(query);
      expect(result.tags).toEqual(['groceries', 'food', 'organic']);
    });

    it('should reject limit exceeding maximum', () => {
      const query = {
        limit: 101,
      };

      expect(() => receiptQuerySchema.parse(query)).toThrow();
    });

    it('should reject invalid sort fields', () => {
      const query = {
        sortBy: 'invalid',
      };

      expect(() => receiptQuerySchema.parse(query)).toThrow();
    });
  });
});
