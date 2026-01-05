/**
 * Unit tests for parsed receipt models and helper functions
 */

import {
  ConfidenceLevel,
  ParsedReceipt,
  ParsedLineItem,
  ConfidentField,
  getConfidenceLevel,
  createConfidentField,
  ParseReceiptRequest,
  ParseReceiptResponse,
} from '../../models/parsedReceipt.model';

describe('ParsedReceipt Models', () => {
  describe('ConfidenceLevel enum', () => {
    it('should have correct confidence level values', () => {
      expect(ConfidenceLevel.HIGH).toBe('high');
      expect(ConfidenceLevel.MEDIUM).toBe('medium');
      expect(ConfidenceLevel.LOW).toBe('low');
    });

    it('should have all expected confidence levels', () => {
      const levels = Object.values(ConfidenceLevel);
      expect(levels).toHaveLength(3);
      expect(levels).toContain('high');
      expect(levels).toContain('medium');
      expect(levels).toContain('low');
    });
  });

  describe('getConfidenceLevel helper', () => {
    it('should return HIGH for confidence > 0.8', () => {
      expect(getConfidenceLevel(0.81)).toBe(ConfidenceLevel.HIGH);
      expect(getConfidenceLevel(0.9)).toBe(ConfidenceLevel.HIGH);
      expect(getConfidenceLevel(0.95)).toBe(ConfidenceLevel.HIGH);
      expect(getConfidenceLevel(1.0)).toBe(ConfidenceLevel.HIGH);
    });

    it('should return MEDIUM for confidence between 0.5 and 0.8', () => {
      expect(getConfidenceLevel(0.5)).toBe(ConfidenceLevel.MEDIUM);
      expect(getConfidenceLevel(0.65)).toBe(ConfidenceLevel.MEDIUM);
      expect(getConfidenceLevel(0.8)).toBe(ConfidenceLevel.MEDIUM);
    });

    it('should return LOW for confidence < 0.5', () => {
      expect(getConfidenceLevel(0.49)).toBe(ConfidenceLevel.LOW);
      expect(getConfidenceLevel(0.3)).toBe(ConfidenceLevel.LOW);
      expect(getConfidenceLevel(0.1)).toBe(ConfidenceLevel.LOW);
      expect(getConfidenceLevel(0)).toBe(ConfidenceLevel.LOW);
    });
  });

  describe('createConfidentField helper', () => {
    it('should create a confident field with high confidence', () => {
      const field = createConfidentField('Test Merchant', 0.95);

      expect(field.value).toBe('Test Merchant');
      expect(field.confidence).toBe(0.95);
      expect(field.confidenceLevel).toBe(ConfidenceLevel.HIGH);
    });

    it('should create a confident field with medium confidence', () => {
      const field = createConfidentField(100.0, 0.7);

      expect(field.value).toBe(100.0);
      expect(field.confidence).toBe(0.7);
      expect(field.confidenceLevel).toBe(ConfidenceLevel.MEDIUM);
    });

    it('should create a confident field with low confidence', () => {
      const field = createConfidentField('Low Confidence', 0.3);

      expect(field.value).toBe('Low Confidence');
      expect(field.confidence).toBe(0.3);
      expect(field.confidenceLevel).toBe(ConfidenceLevel.LOW);
    });

    it('should work with different value types', () => {
      const stringField = createConfidentField('string', 0.9);
      const numberField = createConfidentField(123, 0.9);
      const dateField = createConfidentField(new Date(), 0.9);
      const booleanField = createConfidentField(true, 0.9);

      expect(stringField.value).toBe('string');
      expect(numberField.value).toBe(123);
      expect(dateField.value).toBeInstanceOf(Date);
      expect(booleanField.value).toBe(true);
    });
  });

  describe('ConfidentField interface', () => {
    it('should create a valid confident field for string', () => {
      const field: ConfidentField<string> = {
        value: 'Whole Foods',
        confidence: 0.95,
        confidenceLevel: ConfidenceLevel.HIGH,
      };

      expect(field.value).toBe('Whole Foods');
      expect(field.confidence).toBe(0.95);
      expect(field.confidenceLevel).toBe(ConfidenceLevel.HIGH);
    });

    it('should create a valid confident field for number', () => {
      const field: ConfidentField<number> = {
        value: 127.45,
        confidence: 0.98,
        confidenceLevel: ConfidenceLevel.HIGH,
      };

      expect(field.value).toBe(127.45);
      expect(field.confidence).toBe(0.98);
    });
  });

  describe('ParsedLineItem interface', () => {
    it('should create a parsed line item with confidence', () => {
      const lineItem: ParsedLineItem = {
        description: 'Organic Bananas',
        quantity: 2,
        unitPrice: 0.79,
        total: 1.58,
        confidence: 0.85,
      };

      expect(lineItem.description).toBe('Organic Bananas');
      expect(lineItem.confidence).toBe(0.85);
    });

    it('should create a parsed line item without confidence', () => {
      const lineItem: ParsedLineItem = {
        description: 'Test Item',
        quantity: 1,
        unitPrice: 10.0,
        total: 10.0,
      };

      expect(lineItem.confidence).toBeUndefined();
    });
  });

  describe('ParsedReceipt interface', () => {
    it('should create a complete parsed receipt', () => {
      const parsedReceipt: ParsedReceipt = {
        merchant: createConfidentField(
          {
            name: 'Whole Foods Market',
            address: '123 Main St',
            city: 'Austin',
            state: 'TX',
            zip: '73301',
            country: 'USA',
            phone: '+1-512-555-1234',
            email: 'info@wholefoods.com',
          },
          0.95
        ),
        customer: createConfidentField(
          {
            name: 'Jane Doe',
            city: 'Austin',
            country: 'USA',
            email: 'jane@example.com',
          },
          0.75
        ),
        payment: createConfidentField(
          {
            method: 'card',
            cardNetwork: 'Visa',
            last4: '4242',
          },
          0.8
        ),
        date: createConfidentField(new Date('2024-01-15'), 0.92),
        total: createConfidentField(127.45, 0.98),
        tax: createConfidentField(11.25, 0.88),
        currency: createConfidentField('USD', 0.99),
        category: createConfidentField('Food & Dining', 0.85),
        lineItems: [
          {
            description: 'Bananas',
            quantity: 2,
            unitPrice: 0.79,
            total: 1.58,
            confidence: 0.75,
          },
        ],
        overallConfidence: 0.92,
        processingTime: 2345,
      };

      expect(parsedReceipt.merchant.value.name).toBe('Whole Foods Market');
      expect(parsedReceipt.payment?.value.cardNetwork).toBe('Visa');
      expect(parsedReceipt.total.value).toBe(127.45);
      expect(parsedReceipt.overallConfidence).toBe(0.92);
      expect(parsedReceipt.lineItems).toHaveLength(1);
    });

    it('should create a minimal parsed receipt without optional fields', () => {
      const parsedReceipt: ParsedReceipt = {
        merchant: createConfidentField({ name: 'Test Store' }, 0.8),
        date: createConfidentField(new Date(), 0.8),
        total: createConfidentField(100, 0.8),
        currency: createConfidentField('USD', 0.9),
        lineItems: [],
        overallConfidence: 0.8,
      };

      expect(parsedReceipt.tax).toBeUndefined();
      expect(parsedReceipt.category).toBeUndefined();
      expect(parsedReceipt.processingTime).toBeUndefined();
      expect(parsedReceipt.rawResponse).toBeUndefined();
    });
  });

  describe('ParseReceiptRequest interface', () => {
    it('should create a valid parse request with all fields', () => {
      const request: ParseReceiptRequest = {
        imageUrl: 'https://storage.googleapis.com/bucket/receipt.jpg',
        userId: 'user123',
        receiptId: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(request.imageUrl).toBe('https://storage.googleapis.com/bucket/receipt.jpg');
      expect(request.userId).toBe('user123');
      expect(request.receiptId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should create a valid parse request without receiptId', () => {
      const request: ParseReceiptRequest = {
        imageUrl: 'https://storage.googleapis.com/bucket/receipt.jpg',
        userId: 'user123',
      };

      expect(request.receiptId).toBeUndefined();
    });
  });

  describe('ParseReceiptResponse interface', () => {
    it('should create a successful parse response', () => {
      const response: ParseReceiptResponse = {
        success: true,
        parsedData: {
          merchant: createConfidentField({ name: 'Test Store' }, 0.9),
          date: createConfidentField(new Date(), 0.9),
          total: createConfidentField(100, 0.9),
          currency: createConfidentField('USD', 0.9),
          lineItems: [],
          overallConfidence: 0.9,
        },
        source: 'openai',
      };

      expect(response.success).toBe(true);
      expect(response.parsedData).toBeDefined();
      expect(response.source).toBe('openai');
    });

    it('should create a failed parse response', () => {
      const response: ParseReceiptResponse = {
        success: false,
        error: 'Failed to parse receipt',
        source: 'failed',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to parse receipt');
      expect(response.parsedData).toBeUndefined();
    });

    it('should indicate fallback usage', () => {
      const response: ParseReceiptResponse = {
        success: true,
        parsedData: {
          merchant: createConfidentField({ name: 'Test Store' }, 0.7),
          date: createConfidentField(new Date(), 0.7),
          total: createConfidentField(100, 0.7),
          currency: createConfidentField('USD', 0.7),
          lineItems: [],
          overallConfidence: 0.7,
        },
        fallbackUsed: true,
        source: 'google-vision',
      };

      expect(response.fallbackUsed).toBe(true);
      expect(response.source).toBe('google-vision');
    });
  });
});
