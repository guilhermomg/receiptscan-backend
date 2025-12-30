import { ValidationUtils } from '../../src/utils/validation.utils';

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@company.org',
        'email123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        expect(ValidationUtils.isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        expect(ValidationUtils.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidCurrency', () => {
    it('should return true for valid currency codes', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'BRL', 'JPY', 'CAD', 'AUD'];

      validCurrencies.forEach((currency) => {
        expect(ValidationUtils.isValidCurrency(currency)).toBe(true);
      });
    });

    it('should handle lowercase currency codes', () => {
      expect(ValidationUtils.isValidCurrency('usd')).toBe(true);
      expect(ValidationUtils.isValidCurrency('eur')).toBe(true);
    });

    it('should return false for invalid currency codes', () => {
      const invalidCurrencies = ['XXX', 'ABC', 'US', 'EURO', '123'];

      invalidCurrencies.forEach((currency) => {
        expect(ValidationUtils.isValidCurrency(currency)).toBe(false);
      });
    });
  });

  describe('sanitizeString', () => {
    it('should remove leading and trailing whitespace', () => {
      expect(ValidationUtils.sanitizeString('  hello  ')).toBe('hello');
      expect(ValidationUtils.sanitizeString('\n\ttest\t\n')).toBe('test');
    });

    it('should remove angle brackets to prevent XSS', () => {
      expect(ValidationUtils.sanitizeString('<script>alert("xss")</script>')).toBe(
        'scriptalert("xss")/script'
      );
      expect(ValidationUtils.sanitizeString('hello <b>world</b>')).toBe('hello bworld/b');
    });

    it('should handle empty strings', () => {
      expect(ValidationUtils.sanitizeString('')).toBe('');
      expect(ValidationUtils.sanitizeString('   ')).toBe('');
    });

    it('should preserve other special characters', () => {
      expect(ValidationUtils.sanitizeString('hello@world.com')).toBe('hello@world.com');
      expect(ValidationUtils.sanitizeString('price: $100')).toBe('price: $100');
    });
  });

  describe('isValidDateRange', () => {
    it('should return true when start date is before end date', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      expect(ValidationUtils.isValidDateRange(startDate, endDate)).toBe(true);
    });

    it('should return true when start date equals end date', () => {
      const date = new Date('2025-06-15');

      expect(ValidationUtils.isValidDateRange(date, date)).toBe(true);
    });

    it('should return false when start date is after end date', () => {
      const startDate = new Date('2025-12-31');
      const endDate = new Date('2025-01-01');

      expect(ValidationUtils.isValidDateRange(startDate, endDate)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const result = ValidationUtils.formatCurrency(100.5, 'USD');
      expect(result).toBe('$100.50');
    });

    it('should format EUR correctly', () => {
      const result = ValidationUtils.formatCurrency(50.99, 'EUR');
      expect(result).toBe('€50.99');
    });

    it('should handle zero amounts', () => {
      const result = ValidationUtils.formatCurrency(0, 'USD');
      expect(result).toBe('$0.00');
    });

    it('should handle large amounts', () => {
      const result = ValidationUtils.formatCurrency(1234567.89, 'USD');
      expect(result).toBe('$1,234,567.89');
    });

    it('should round to two decimal places', () => {
      const result = ValidationUtils.formatCurrency(10.999, 'USD');
      expect(result).toBe('$11.00');
    });
  });
});
