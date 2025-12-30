import { ReceiptService } from '../../src/services/receipt.service';
import { CreateReceiptDto } from '../../src/models/receipt.model';

describe('ReceiptService', () => {
  let receiptService: ReceiptService;

  beforeEach(() => {
    receiptService = new ReceiptService();
  });

  describe('create', () => {
    it('should create a new receipt with valid data', async () => {
      const userId = 'user123';
      const receiptData: CreateReceiptDto = {
        merchant: 'Starbucks',
        date: new Date('2025-12-30'),
        total: 15.5,
        tax: 1.5,
        currency: 'USD',
        category: 'Food & Dining',
        tags: ['coffee', 'breakfast'],
        imageUrl: 'https://example.com/receipt.jpg',
      };

      const result = await receiptService.create(userId, receiptData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.merchant).toBe(receiptData.merchant);
      expect(result.total).toBe(receiptData.total);
      expect(result.tax).toBe(receiptData.tax);
      expect(result.currency).toBe(receiptData.currency);
      expect(result.status).toBe('completed');
      expect(result.confidence).toBe(1.0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should create receipt with default tax value when not provided', async () => {
      const userId = 'user123';
      const receiptData: CreateReceiptDto = {
        merchant: 'Amazon',
        date: new Date('2025-12-30'),
        total: 50.0,
        currency: 'USD',
        category: 'Office Supplies',
        imageUrl: 'https://example.com/receipt.jpg',
      };

      const result = await receiptService.create(userId, receiptData);

      expect(result.tax).toBe(0);
    });

    it('should create receipt with empty tags and lineItems when not provided', async () => {
      const userId = 'user123';
      const receiptData: CreateReceiptDto = {
        merchant: 'Target',
        date: new Date('2025-12-30'),
        total: 25.0,
        currency: 'USD',
        category: 'Shopping',
        imageUrl: 'https://example.com/receipt.jpg',
      };

      const result = await receiptService.create(userId, receiptData);

      expect(result.tags).toEqual([]);
      expect(result.lineItems).toEqual([]);
    });
  });

  describe('validateReceiptData', () => {
    it('should return valid for correct receipt data', () => {
      const validData: CreateReceiptDto = {
        merchant: 'Walmart',
        date: new Date('2025-12-30'),
        total: 100.0,
        currency: 'USD',
        category: 'Shopping',
        imageUrl: 'https://example.com/receipt.jpg',
      };

      const result = receiptService.validateReceiptData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing merchant', () => {
      const invalidData: CreateReceiptDto = {
        merchant: '',
        date: new Date('2025-12-30'),
        total: 100.0,
        currency: 'USD',
        category: 'Shopping',
        imageUrl: 'https://example.com/receipt.jpg',
      };

      const result = receiptService.validateReceiptData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Merchant name is required');
    });

    it('should return error for invalid total', () => {
      const invalidData: CreateReceiptDto = {
        merchant: 'Store',
        date: new Date('2025-12-30'),
        total: -10.0,
        currency: 'USD',
        category: 'Shopping',
        imageUrl: 'https://example.com/receipt.jpg',
      };

      const result = receiptService.validateReceiptData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Total must be greater than 0');
    });

    it('should return error for invalid currency code', () => {
      const invalidData: CreateReceiptDto = {
        merchant: 'Store',
        date: new Date('2025-12-30'),
        total: 50.0,
        currency: 'US',
        category: 'Shopping',
        imageUrl: 'https://example.com/receipt.jpg',
      };

      const result = receiptService.validateReceiptData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Currency must be a valid ISO 4217 code (e.g., USD, EUR)');
    });

    it('should return error for invalid image URL', () => {
      const invalidData: CreateReceiptDto = {
        merchant: 'Store',
        date: new Date('2025-12-30'),
        total: 50.0,
        currency: 'USD',
        category: 'Shopping',
        imageUrl: 'not-a-valid-url',
      };

      const result = receiptService.validateReceiptData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid image URL is required');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidData: CreateReceiptDto = {
        merchant: '',
        date: new Date('2025-12-30'),
        total: -5.0,
        currency: 'INVALID',
        category: 'Shopping',
        imageUrl: 'invalid-url',
      };

      const result = receiptService.validateReceiptData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('calculateTaxPercentage', () => {
    it('should calculate correct tax percentage', () => {
      const total = 100.0;
      const tax = 8.5;

      const result = receiptService.calculateTaxPercentage(total, tax);

      expect(result).toBe(8.5);
    });

    it('should return 0 for zero total', () => {
      const total = 0;
      const tax = 5.0;

      const result = receiptService.calculateTaxPercentage(total, tax);

      expect(result).toBe(0);
    });

    it('should handle decimal precision', () => {
      const total = 33.33;
      const tax = 3.33;

      const result = receiptService.calculateTaxPercentage(total, tax);

      expect(result).toBeCloseTo(9.99, 2);
    });
  });

  describe('checkUserLimit', () => {
    it('should allow upload for free tier user within limit', async () => {
      const userId = 'user123';
      const tier = 'free';

      const result = await receiptService.checkUserLimit(userId, tier);

      expect(result.canUpload).toBe(true);
      expect(result.limit).toBe(10);
    });

    it('should always allow upload for pro tier user', async () => {
      const userId = 'user123';
      const tier = 'pro';

      const result = await receiptService.checkUserLimit(userId, tier);

      expect(result.canUpload).toBe(true);
      expect(result.limit).toBe(0); // 0 means unlimited
    });
  });

  describe('getTotalByCategory', () => {
    it('should return spending totals by category', async () => {
      const userId = 'user123';

      const result = await receiptService.getTotalByCategory(userId);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result['Food & Dining']).toBeDefined();
      expect(typeof result['Food & Dining']).toBe('number');
    });
  });

  describe('list', () => {
    it('should return empty array when no receipts exist', async () => {
      const userId = 'user123';

      const result = await receiptService.list(userId);

      expect(result).toEqual([]);
    });

    it('should accept filtering options', async () => {
      const userId = 'user123';
      const options = {
        limit: 10,
        offset: 0,
        category: 'Food & Dining',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };

      const result = await receiptService.list(userId, options);

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should return true when deleting receipt', async () => {
      const receiptId = 'receipt123';
      const userId = 'user123';

      const result = await receiptService.delete(receiptId, userId);

      expect(result).toBe(true);
    });
  });
});
