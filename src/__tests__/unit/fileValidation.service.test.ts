/**
 * Unit tests for file validation service
 */

import { FileValidationService, FILE_UPLOAD_CONFIG } from '../../services/fileValidation.service';

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(() => {
    service = new FileValidationService();
  });

  describe('validateFileExtension', () => {
    it('should accept .jpg files with uppercase extension', () => {
      expect(() => service.validateFileExtension('IMG_7242.JPG')).not.toThrow();
    });

    it('should accept .jpg files with lowercase extension', () => {
      expect(() => service.validateFileExtension('IMG_7242.jpg')).not.toThrow();
    });

    it('should accept .jpeg extension', () => {
      expect(() => service.validateFileExtension('receipt.JPEG')).not.toThrow();
    });

    it('should accept .png extension', () => {
      expect(() => service.validateFileExtension('document.png')).not.toThrow();
    });

    it('should accept .pdf extension', () => {
      expect(() => service.validateFileExtension('invoice.pdf')).not.toThrow();
    });

    it('should reject files without extension', () => {
      expect(() => service.validateFileExtension('IMG_7242')).toThrow(
        'File must have a valid extension'
      );
    });

    it('should reject files with invalid extension', () => {
      expect(() => service.validateFileExtension('IMG_7242.txt')).toThrow();
      expect(() => service.validateFileExtension('IMG_7242.doc')).toThrow();
    });

    it('should handle filename with multiple dots', () => {
      expect(() => service.validateFileExtension('IMG.7242.jpg')).not.toThrow();
    });

    it('should reject when filename is undefined', () => {
      expect(() => service.validateFileExtension(undefined as any)).toThrow();
    });

    it('should reject when filename is null', () => {
      expect(() => service.validateFileExtension(null as any)).toThrow();
    });

    it('should reject when filename is empty string', () => {
      expect(() => service.validateFileExtension('')).toThrow();
    });

    it('should reject when filename is not a string', () => {
      expect(() => service.validateFileExtension(123 as any)).toThrow();
    });
  });

  describe('validateMimeType', () => {
    it('should accept image/jpeg MIME type', () => {
      expect(() => service.validateMimeType('image/jpeg')).not.toThrow();
    });

    it('should accept image/jpg MIME type', () => {
      expect(() => service.validateMimeType('image/jpg')).not.toThrow();
    });

    it('should accept image/png MIME type', () => {
      expect(() => service.validateMimeType('image/png')).not.toThrow();
    });

    it('should accept application/pdf MIME type', () => {
      expect(() => service.validateMimeType('application/pdf')).not.toThrow();
    });

    it('should reject invalid MIME types', () => {
      expect(() => service.validateMimeType('text/plain')).toThrow();
      expect(() => service.validateMimeType('application/json')).toThrow();
    });
  });

  describe('validateFile', () => {
    const validFile = {
      originalname: 'IMG_7242.JPG',
      size: 1024000,
      mimetype: 'image/jpeg',
    };

    it('should accept valid file object', () => {
      expect(() => service.validateFile(validFile)).not.toThrow();
    });

    it('should accept file without extension if MIME type is valid (fallback)', () => {
      const fileNoExtension = { ...validFile, originalname: 'IMG_7242' };
      // This should pass now because we have valid MIME type
      expect(() => service.validateFile(fileNoExtension)).not.toThrow();
    });

    it('should reject file with no extension and invalid MIME type', () => {
      const invalidFile = { ...validFile, originalname: 'IMG_7242', mimetype: 'text/plain' };
      expect(() => service.validateFile(invalidFile)).toThrow();
    });

    it('should reject file with invalid extension', () => {
      const invalidFile = { ...validFile, originalname: 'IMG_7242.txt' };
      expect(() => service.validateFile(invalidFile)).toThrow();
    });

    it('should reject file with invalid MIME type', () => {
      const invalidFile = { ...validFile, mimetype: 'text/plain' };
      expect(() => service.validateFile(invalidFile)).toThrow();
    });

    it('should reject null file', () => {
      expect(() => service.validateFile(null as any)).toThrow('No file provided');
    });

    it('should reject file exceeding size limit', () => {
      const largeFile = { ...validFile, size: FILE_UPLOAD_CONFIG.maxFileSize + 1 };
      expect(() => service.validateFile(largeFile)).toThrow();
    });
  });

  describe('generateFilePath', () => {
    it('should generate valid file path', () => {
      const path = service.generateFilePath('user-123', 'receipt-456', 'IMG_7242.JPG');
      expect(path).toMatch(/^receipts\/user-123\/receipt-456\/\d+-IMG_7242\.JPG$/);
    });

    it('should sanitize filename with special characters', () => {
      const path = service.generateFilePath('user-123', 'receipt-456', 'IMG@7242#test.JPG');
      expect(path).toMatch(/^receipts\/user-123\/receipt-456\/\d+-IMG_7242_test\.JPG$/);
    });

    it('should preserve extension case', () => {
      const path = service.generateFilePath('user-123', 'receipt-456', 'receipt.PDF');
      expect(path).toContain('.PDF');
    });

    it('should handle filename without extension gracefully', () => {
      const path = service.generateFilePath('user-123', 'receipt-456', 'IMG_7242');
      expect(path).toMatch(/^receipts\/user-123\/receipt-456\/\d+-IMG_7242$/);
    });
  });
});
