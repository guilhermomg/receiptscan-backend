/**
 * Export service - handles CSV and PDF export generation
 */

import { format as csvFormat } from '@fast-csv/format';
import PDFDocument from 'pdfkit';
import { Receipt } from '../models/receipt.model';
import { ReceiptRepository } from '../repositories/receipt.repository';
import { FileStorageService } from './fileStorage.service';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportOptions {
  userId: string;
  format: ExportFormat;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  merchant?: string;
  tags?: string[];
}

export interface ExportResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
}

export class ExportService {
  private receiptRepository: ReceiptRepository;
  private fileStorageService: FileStorageService;

  constructor() {
    this.receiptRepository = new ReceiptRepository();
    this.fileStorageService = new FileStorageService();
  }

  /**
   * Export receipts in specified format
   */
  public async exportReceipts(options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting receipt export', {
        userId: options.userId,
        format: options.format,
      });

      // Fetch receipts with filters
      const receipts = await this.fetchReceiptsForExport(options);

      if (receipts.length === 0) {
        throw new AppError('No receipts found matching the criteria', 404);
      }

      // Generate export file based on format
      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      if (options.format === 'csv') {
        fileBuffer = await this.generateCSV(receipts);
        fileName = `receipts-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (options.format === 'pdf') {
        fileBuffer = await this.generatePDF(receipts);
        fileName = `receipts-export-${Date.now()}.pdf`;
        mimeType = 'application/pdf';
      } else {
        throw new AppError('Invalid export format', 400);
      }

      // Upload to Cloud Storage with auto-deletion after 24 hours
      const filePath = `exports/${options.userId}/${fileName}`;
      await this.fileStorageService.uploadFile(filePath, fileBuffer, mimeType, {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: options.userId,
      });

      // Generate signed URL
      const fileUrl = await this.fileStorageService.generateSignedUrl(filePath);

      logger.info('Export completed successfully', {
        userId: options.userId,
        format: options.format,
        recordCount: receipts.length,
        fileSize: fileBuffer.length,
      });

      return {
        fileUrl,
        fileName,
        fileSize: fileBuffer.length,
        recordCount: receipts.length,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error exporting receipts', { userId: options.userId, error });
      throw new AppError('Failed to export receipts', 500);
    }
  }

  /**
   * Fetch receipts with filters for export
   */
  private async fetchReceiptsForExport(options: ExportOptions): Promise<Receipt[]> {
    const receipts: Receipt[] = [];
    let hasMore = true;
    let startAfter: string | undefined;

    // Fetch all receipts matching criteria (paginated)
    while (hasMore) {
      const result = await this.receiptRepository.getReceiptsByUserId({
        userId: options.userId,
        startDate: options.startDate,
        endDate: options.endDate,
        category: options.category,
        merchant: options.merchant,
        tags: options.tags,
        limit: 100, // Fetch 100 at a time
        startAfter,
        sortBy: 'date',
        sortOrder: 'desc',
      });

      receipts.push(...result.receipts);
      hasMore = result.hasMore;
      startAfter = result.nextCursor;
    }

    return receipts;
  }

  /**
   * Generate CSV export
   */
  private async generateCSV(receipts: Receipt[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const csvStream = csvFormat({
        headers: true,
        delimiter: ',',
      });

      csvStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      csvStream.on('end', () => resolve(Buffer.concat(chunks)));
      csvStream.on('error', reject);

      // Write header and rows
      receipts.forEach((receipt) => {
        csvStream.write({
          Date:
            receipt.date instanceof Date ? receipt.date.toISOString().split('T')[0] : receipt.date,
          Merchant: receipt.merchant,
          Amount: receipt.total.toFixed(2),
          Tax: receipt.tax?.toFixed(2) || '0.00',
          Currency: receipt.currency,
          Category: receipt.category,
          Tags: receipt.tags.join('; '),
          Status: receipt.status,
          'Line Items': receipt.lineItems.length,
        });
      });

      csvStream.end();
    });
  }

  /**
   * Generate PDF export
   */
  private async generatePDF(receipts: Receipt[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
        });

        // Collect PDF chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(20).text('Receipt Export Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Calculate totals
        const totalAmount = receipts.reduce((sum, r) => sum + r.total, 0);
        const totalTax = receipts.reduce((sum, r) => sum + (r.tax || 0), 0);

        // Summary section
        doc.fontSize(14).text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Total Receipts: ${receipts.length}`);
        doc.text(`Total Amount: ${receipts[0]?.currency || 'USD'} ${totalAmount.toFixed(2)}`);
        doc.text(`Total Tax: ${receipts[0]?.currency || 'USD'} ${totalTax.toFixed(2)}`);
        doc.moveDown(2);

        // Receipts list
        doc.fontSize(14).text('Receipts', { underline: true });
        doc.moveDown(0.5);

        receipts.forEach((receipt, index) => {
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fontSize(10);
          doc.text(`${index + 1}. ${receipt.merchant}`, { continued: true });
          doc.text(` - ${receipt.currency} ${receipt.total.toFixed(2)}`, { align: 'right' });

          doc.fontSize(8);
          const receiptDate =
            receipt.date instanceof Date
              ? receipt.date.toLocaleDateString()
              : new Date(receipt.date!).toLocaleDateString();
          doc.text(
            `   Date: ${receiptDate} | Category: ${receipt.category} | Status: ${receipt.status}`
          );

          if (receipt.tags.length > 0) {
            doc.text(`   Tags: ${receipt.tags.join(', ')}`);
          }

          doc.moveDown(0.5);
        });

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, { align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Schedule cleanup of old export files (to be called by a cron job)
   */
  public async cleanupOldExports(userId: string): Promise<void> {
    try {
      logger.info('Cleaning up old export files', { userId });
      // This would be implemented with Cloud Storage lifecycle rules
      // or a scheduled function that lists and deletes old files
    } catch (error) {
      logger.error('Error cleaning up old exports', { userId, error });
    }
  }
}
