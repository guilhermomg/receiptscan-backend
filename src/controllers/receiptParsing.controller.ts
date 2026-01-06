/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { ReceiptParsingService } from '../services/receiptParsing.service';
import { ReceiptService } from '../services/receipt.service';
import { AppError } from '../middleware/errorHandler';
import { receiptIdParamSchema } from '../models/parsedReceipt.validation';
import logger from '../config/logger';
import { ParseReceiptRequest } from '../models/parsedReceipt.model';

/**
 * Receipt parsing controller
 * Handles AI-powered receipt parsing endpoints
 */
export class ReceiptParsingController {
  private parsingService: ReceiptParsingService;
  private receiptService: ReceiptService;

  constructor() {
    this.parsingService = new ReceiptParsingService();
    this.receiptService = new ReceiptService();
  }

  /**
   * POST /api/v1/receipts/{receiptId}/parse
   * Parse receipt from stored image using AI
   */
  parseReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Validate receipt ID from URL param
      const paramValidationResult = receiptIdParamSchema.safeParse(req.params);
      if (!paramValidationResult.success) {
        const errorMessages = paramValidationResult.error.issues
          .map((issue) => issue.message)
          .join(', ');
        throw new AppError(`Invalid request: ${errorMessages}`, 400);
      }

      const receiptId = paramValidationResult.data.receiptId;

      logger.info('Parsing receipt request received', {
        requestId: req.requestId,
        userId: req.user.uid,
        receiptId,
      });

      const receipt = await this.receiptService.getReceiptById(receiptId, req.user.uid);
      if (!receipt || !receipt.imageUrl) {
        throw new AppError('Receipt not found or has no image', 404);
      }

      const imageUrl = receipt.imageUrl;

      // Validate image URL is accessible
      const isValidUrl = await this.parsingService.validateImageUrl(imageUrl);
      if (!isValidUrl) {
        throw new AppError('Receipt image is not accessible', 400);
      }

      // Create parse request
      const parseRequest: ParseReceiptRequest = {
        imageUrl,
        userId: req.user.uid,
        receiptId,
      };

      // Parse receipt
      const result = await this.parsingService.parseReceipt(parseRequest);

      if (result.success && result.parsedData) {
        logger.info('Receipt parsed successfully', {
          requestId: req.requestId,
          userId: req.user.uid,
          confidence: result.parsedData.overallConfidence,
          source: result.source,
        });

        res.status(200).json({
          status: 'success',
          message: 'Receipt parsed successfully',
          data: {
            parsed: {
              merchant: result.parsedData.merchant.value,
              merchantConfidence: result.parsedData.merchant.confidence,
              merchantConfidenceLevel: result.parsedData.merchant.confidenceLevel,
              customer: result.parsedData.customer?.value,
              customerConfidence: result.parsedData.customer?.confidence,
              customerConfidenceLevel: result.parsedData.customer?.confidenceLevel,
              date: result.parsedData.date.value,
              dateConfidence: result.parsedData.date.confidence,
              dateConfidenceLevel: result.parsedData.date.confidenceLevel,
              subtotal: result.parsedData.subtotal?.value,
              subtotalConfidence: result.parsedData.subtotal?.confidence,
              subtotalConfidenceLevel: result.parsedData.subtotal?.confidenceLevel,
              tip: result.parsedData.tip?.value,
              tipConfidence: result.parsedData.tip?.confidence,
              tipConfidenceLevel: result.parsedData.tip?.confidenceLevel,
              total: result.parsedData.total.value,
              totalConfidence: result.parsedData.total.confidence,
              totalConfidenceLevel: result.parsedData.total.confidenceLevel,
              tax: result.parsedData.tax?.value,
              taxConfidence: result.parsedData.tax?.confidence,
              taxConfidenceLevel: result.parsedData.tax?.confidenceLevel,
              currency: result.parsedData.currency.value,
              currencyConfidence: result.parsedData.currency.confidence,
              currencyConfidenceLevel: result.parsedData.currency.confidenceLevel,
              category: result.parsedData.category?.value,
              categoryConfidence: result.parsedData.category?.confidence,
              categoryConfidenceLevel: result.parsedData.category?.confidenceLevel,
              payment: result.parsedData.payment?.value,
              paymentConfidence: result.parsedData.payment?.confidence,
              paymentConfidenceLevel: result.parsedData.payment?.confidenceLevel,
              lineItems: result.parsedData.lineItems,
              overallConfidence: result.parsedData.overallConfidence,
            },
            metadata: {
              source: result.source,
              processingTime: result.parsedData.processingTime,
              fallbackUsed: result.fallbackUsed || false,
            },
          },
        });
      } else {
        logger.error('Receipt parsing failed', {
          requestId: req.requestId,
          userId: req.user.uid,
          error: result.error,
        });

        throw new AppError(result.error || 'Failed to parse receipt', 500);
      }
    } catch (error) {
      logger.error('Parse receipt endpoint error', {
        requestId: req.requestId,
        userId: req.user?.uid,
        error,
      });
      next(error);
    }
  };
}
