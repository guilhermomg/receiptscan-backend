/**
 * Unit tests for receipt models and types
 */

import {
  ReceiptStatus,
  ReceiptCategory,
  Receipt,
  LineItem,
  CreateReceiptDto,
  UpdateReceiptDto,
  Currency,
} from '../../models/receipt.model';

describe('Receipt Models', () => {
  describe('ReceiptStatus enum', () => {
    it('should have correct status values', () => {
      expect(ReceiptStatus.UPLOADED).toBe('uploaded');
      expect(ReceiptStatus.PARSING).toBe('parsing');
      expect(ReceiptStatus.COMPLETED).toBe('completed');
      expect(ReceiptStatus.FAILED).toBe('failed');
    });

    it('should have all expected statuses', () => {
      const statuses = Object.values(ReceiptStatus);
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('uploaded');
      expect(statuses).toContain('parsing');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
    });
  });

  describe('ReceiptCategory enum', () => {
    it('should have correct category values', () => {
      expect(ReceiptCategory.FOOD_DINING).toBe('Food & Dining');
      expect(ReceiptCategory.TRANSPORTATION).toBe('Transportation');
      expect(ReceiptCategory.OFFICE_SUPPLIES).toBe('Office Supplies');
      expect(ReceiptCategory.TRAVEL).toBe('Travel');
      expect(ReceiptCategory.HEALTHCARE).toBe('Healthcare');
      expect(ReceiptCategory.OTHER).toBe('Other');
    });

    it('should have all expected categories', () => {
      const categories = Object.values(ReceiptCategory);
      expect(categories).toHaveLength(6);
    });
  });

  describe('Currency type', () => {
    it('should accept valid currency codes', () => {
      const validCurrencies: Currency[] = [
        'USD',
        'EUR',
        'BRL',
        'GBP',
        'JPY',
        'CAD',
        'AUD',
        'CHF',
        'CNY',
      ];

      validCurrencies.forEach((currency) => {
        const testCurrency: Currency = currency;
        expect(testCurrency).toBe(currency);
      });
    });
  });

  describe('LineItem interface', () => {
    it('should create a valid line item with all fields', () => {
      const lineItem: LineItem = {
        description: 'Organic Bananas',
        quantity: 2,
        unitPrice: 0.79,
        total: 1.58,
        category: 'Produce',
      };

      expect(lineItem.description).toBe('Organic Bananas');
      expect(lineItem.quantity).toBe(2);
      expect(lineItem.unitPrice).toBe(0.79);
      expect(lineItem.total).toBe(1.58);
      expect(lineItem.category).toBe('Produce');
    });

    it('should create a valid line item without optional category', () => {
      const lineItem: LineItem = {
        description: 'Test Item',
        quantity: 1,
        unitPrice: 10.0,
        total: 10.0,
      };

      expect(lineItem.category).toBeUndefined();
    });
  });

  describe('Receipt interface', () => {
    it('should create a valid receipt with all fields', () => {
      const receipt: Receipt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user123',
        merchant: 'Whole Foods Market',
        date: new Date('2024-01-15'),
        total: 127.45,
        tax: 11.25,
        currency: 'USD',
        category: ReceiptCategory.FOOD_DINING,
        tags: ['groceries', 'organic'],
        lineItems: [
          {
            description: 'Bananas',
            quantity: 2,
            unitPrice: 0.79,
            total: 1.58,
          },
        ],
        imageUrl: 'https://storage.googleapis.com/bucket/receipt.jpg',
        status: ReceiptStatus.COMPLETED,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:05:00Z'),
      };

      expect(receipt.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(receipt.merchant).toBe('Whole Foods Market');
      expect(receipt.status).toBe(ReceiptStatus.COMPLETED);
      expect(receipt.category).toBe(ReceiptCategory.FOOD_DINING);
    });

    it('should create a receipt with custom category', () => {
      const receipt: Receipt = {
        id: '123',
        userId: 'user123',
        merchant: 'Test Store',
        date: new Date(),
        total: 100,
        currency: 'USD',
        category: 'Custom Category',
        tags: [],
        lineItems: [],
        status: ReceiptStatus.UPLOADED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(receipt.category).toBe('Custom Category');
    });

    it('should handle soft delete with deletedAt field', () => {
      const receipt: Receipt = {
        id: '123',
        userId: 'user123',
        merchant: 'Test Store',
        date: new Date(),
        total: 100,
        currency: 'USD',
        category: ReceiptCategory.OTHER,
        tags: [],
        lineItems: [],
        status: ReceiptStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      expect(receipt.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('CreateReceiptDto interface', () => {
    it('should create a valid DTO with required fields', () => {
      const dto: CreateReceiptDto = {
        merchant: 'Test Store',
        date: new Date('2024-01-15'),
        total: 100.0,
        currency: 'USD',
        category: ReceiptCategory.FOOD_DINING,
      };

      expect(dto.merchant).toBe('Test Store');
      expect(dto.total).toBe(100.0);
      expect(dto.currency).toBe('USD');
    });

    it('should create a DTO with all optional fields', () => {
      const dto: CreateReceiptDto = {
        merchant: 'Test Store',
        date: new Date('2024-01-15'),
        total: 100.0,
        tax: 8.0,
        currency: 'USD',
        category: ReceiptCategory.FOOD_DINING,
        tags: ['test', 'sample'],
        lineItems: [
          {
            description: 'Item 1',
            quantity: 1,
            unitPrice: 100.0,
            total: 100.0,
          },
        ],
        imageUrl: 'https://example.com/receipt.jpg',
        status: ReceiptStatus.UPLOADED,
      };

      expect(dto.tax).toBe(8.0);
      expect(dto.tags).toHaveLength(2);
      expect(dto.lineItems).toHaveLength(1);
      expect(dto.imageUrl).toBeDefined();
      expect(dto.status).toBe(ReceiptStatus.UPLOADED);
    });
  });

  describe('UpdateReceiptDto interface', () => {
    it('should create a DTO with partial updates', () => {
      const dto: UpdateReceiptDto = {
        merchant: 'Updated Store',
        total: 150.0,
      };

      expect(dto.merchant).toBe('Updated Store');
      expect(dto.total).toBe(150.0);
      expect(dto.date).toBeUndefined();
      expect(dto.currency).toBeUndefined();
    });

    it('should create an empty DTO for partial updates', () => {
      const dto: UpdateReceiptDto = {};
      expect(Object.keys(dto)).toHaveLength(0);
    });
  });
});
