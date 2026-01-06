/**
 * Receipt parsing service - orchestrates AI-powered receipt extraction
 */

import logger from '../config/logger';
import { OpenAIService } from './openai.service';
import { ParseReceiptRequest, ParseReceiptResponse } from '../models/parsedReceipt.model';
import { ReceiptService } from './receipt.service';
import { ReceiptStatus } from '../models/receipt.model';

/**
 * Receipt parsing service
 * Handles receipt data extraction with fallback logic
 */
export class ReceiptParsingService {
  private openAIService: OpenAIService;
  private receiptService: ReceiptService;

  constructor() {
    this.openAIService = new OpenAIService();
    this.receiptService = new ReceiptService();
  }

  /**
   * Parse receipt from image URL
   * Attempts OpenAI first, with option to fallback to Google Cloud Vision
   */
  async parseReceipt(request: ParseReceiptRequest): Promise<ParseReceiptResponse> {
    const { imageUrl, userId, receiptId } = request;

    logger.info('Starting receipt parsing', {
      userId,
      receiptId,
      imageUrl,
    });

    try {
      if (receiptId) {
        await this.receiptService.updateReceipt(receiptId, userId, {
          status: ReceiptStatus.PARSING,
        });
      }

      // Try OpenAI first
      if (this.openAIService.isAvailable()) {
        try {
          const parsedData = await this.openAIService.parseReceipt(imageUrl);

          if (receiptId) {
            const merchantName =
              parsedData.merchant.value.name ||
              parsedData.merchant.value.email ||
              'Unknown merchant';

            // Strip confidence field and undefined values from line items for Firestore
            const lineItems = parsedData.lineItems.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { confidence, ...lineItem } = item;
              // Remove undefined values as Firestore doesn't accept them
              return Object.fromEntries(
                Object.entries(lineItem).filter(([, value]) => value !== undefined)
              ) as Omit<typeof item, 'confidence'>;
            });

            // Build confidence scores object
            const confidenceScores = {
              merchant: parsedData.merchant.confidence,
              date: parsedData.date.confidence,
              total: parsedData.total.confidence,
              tax: parsedData.tax?.confidence,
              subtotal: parsedData.subtotal?.confidence,
              tip: parsedData.tip?.confidence,
              currency: parsedData.currency.confidence,
              category: parsedData.category?.confidence,
              payment: parsedData.payment?.confidence,
              lineItems:
                parsedData.lineItems.length > 0 ? parsedData.lineItems[0].confidence : undefined,
              overall: parsedData.overallConfidence,
            };

            await this.receiptService.updateReceipt(receiptId, userId, {
              merchant: merchantName,
              merchantDetails: parsedData.merchant.value,
              date: parsedData.date.value,
              total: parsedData.total.value,
              subtotal: parsedData.subtotal?.value,
              tip: parsedData.tip?.value,
              tax: parsedData.tax?.value,
              currency: parsedData.currency.value,
              category: parsedData.category?.value,
              paymentMethod: parsedData.payment?.value.method,
              lineItems,
              confidenceScores,
              status: ReceiptStatus.COMPLETED,
            });
          }

          logger.info('Receipt parsed successfully with OpenAI', {
            userId,
            receiptId,
            confidence: parsedData.overallConfidence,
          });

          return {
            success: true,
            parsedData,
            source: 'openai',
          };
        } catch (error) {
          logger.error('OpenAI parsing failed, attempting fallback', {
            userId,
            receiptId,
            error,
          });

          if (receiptId) {
            await this.receiptService.updateReceipt(receiptId, userId, {
              status: ReceiptStatus.FAILED,
            });
          }

          // Could implement Google Cloud Vision fallback here
          // For now, return error
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown parsing error',
            source: 'failed',
          };
        }
      } else {
        logger.error('OpenAI service not available', { userId, receiptId });
        return {
          success: false,
          error:
            'OpenAI service is not configured. Please add OPENAI_API_KEY to environment variables.',
          source: 'failed',
        };
      }
    } catch (error) {
      logger.error('Receipt parsing failed', {
        userId,
        receiptId,
        error,
      });

      if (receiptId) {
        await this.receiptService.updateReceipt(receiptId, userId, {
          status: ReceiptStatus.FAILED,
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during receipt parsing',
        source: 'failed',
      };
    }
  }

  /**
   * Validate image URL is accessible
   */
  async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      logger.error('Image URL validation failed', { imageUrl, error });
      return false;
    }
  }

  /**
   * Parse receipt with async processing
   * This method can be used for background job processing
   */
  async parseReceiptAsync(request: ParseReceiptRequest): Promise<void> {
    try {
      const result = await this.parseReceipt(request);

      if (result.success && result.parsedData) {
        // Here you would typically update the receipt in Firestore
        // with the parsed data and status = 'completed'
        logger.info('Async receipt parsing completed', {
          userId: request.userId,
          receiptId: request.receiptId,
          confidence: result.parsedData.overallConfidence,
        });
      } else {
        // Update receipt status to 'failed'
        logger.error('Async receipt parsing failed', {
          userId: request.userId,
          receiptId: request.receiptId,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('Async receipt parsing error', {
        userId: request.userId,
        receiptId: request.receiptId,
        error,
      });
    }
  }
}
