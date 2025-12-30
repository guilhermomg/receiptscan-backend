/**
 * OpenAI service for receipt parsing using GPT-4 Vision API
 */

import OpenAI from 'openai';
import config from '../config';
import logger from '../config/logger';
import { ParsedReceipt, ParsedLineItem, createConfidentField } from '../models/parsedReceipt.model';
import { Currency } from '../models/receipt.model';

/**
 * OpenAI receipt parsing service
 */
export class OpenAIService {
  private client: OpenAI | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize OpenAI client with lazy loading
   */
  private initializeClient(): void {
    try {
      if (!config.openai.apiKey) {
        logger.warn('OpenAI API key not configured. Receipt parsing will not be available.');
        return;
      }

      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
      });

      logger.info('OpenAI client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI client', { error });
    }
  }

  /**
   * Check if OpenAI is available
   */
  isAvailable(): boolean {
    return this.client !== null && config.openai.apiKey !== '';
  }

  /**
   * Parse receipt from image URL using GPT-4 Vision
   */
  async parseReceipt(imageUrl: string): Promise<ParsedReceipt> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI service is not available. Please configure OPENAI_API_KEY.');
    }

    const startTime = Date.now();

    try {
      logger.info('Starting receipt parsing with OpenAI', { imageUrl });

      const response = await this.callOpenAIWithRetry(imageUrl);
      const parsedData = this.parseOpenAIResponse(response);
      const processingTime = Date.now() - startTime;

      logger.info('Receipt parsed successfully', {
        overallConfidence: parsedData.overallConfidence,
        processingTime,
      });

      return {
        ...parsedData,
        processingTime,
      };
    } catch (error) {
      logger.error('Failed to parse receipt with OpenAI', { error, imageUrl });
      throw error;
    }
  }

  /**
   * Call OpenAI API with retry logic
   */
  private async callOpenAIWithRetry(imageUrl: string, attempt = 1): Promise<string> {
    try {
      const completion = await this.client!.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are a receipt data extraction expert. Analyze the receipt image and extract structured information in JSON format. Be precise and accurate.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.getPrompt(),
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return content;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`OpenAI API call attempt ${attempt} failed`, { error: errorMessage });

      if (attempt < this.maxRetries) {
        await this.sleep(this.retryDelay * attempt);
        return this.callOpenAIWithRetry(imageUrl, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Get the prompt for receipt extraction
   */
  private getPrompt(): string {
    return `Extract the following information from this receipt image and return it as a valid JSON object:

{
  "merchant": "Store/restaurant name",
  "date": "Transaction date in ISO 8601 format (YYYY-MM-DD)",
  "total": "Total amount as a number",
  "tax": "Tax amount as a number (if visible)",
  "currency": "ISO 4217 currency code (USD, EUR, BRL, GBP, JPY, CAD, AUD, CHF, or CNY)",
  "category": "Receipt category (Food & Dining, Transportation, Office Supplies, Travel, Healthcare, or Other)",
  "items": [
    {
      "description": "Item name",
      "quantity": "Quantity as a number",
      "unitPrice": "Price per unit as a number",
      "total": "Total price for this item as a number"
    }
  ],
  "confidence": {
    "merchant": "confidence score between 0 and 1",
    "date": "confidence score between 0 and 1",
    "total": "confidence score between 0 and 1",
    "tax": "confidence score between 0 and 1",
    "currency": "confidence score between 0 and 1",
    "category": "confidence score between 0 and 1",
    "items": "confidence score between 0 and 1"
  }
}

Requirements:
- Return ONLY valid JSON, no additional text or markdown formatting
- All confidence scores should be between 0 and 1
- Date must be in ISO 8601 format (YYYY-MM-DD)
- Currency must be one of: USD, EUR, BRL, GBP, JPY, CAD, AUD, CHF, CNY
- If information is unclear or not visible, use your best estimate and lower the confidence score
- Category should match predefined categories when possible
- Items array can be empty if line items are not clearly visible`;
  }

  /**
   * Parse OpenAI response into structured data
   */
  private parseOpenAIResponse(response: string): ParsedReceipt {
    try {
      // Remove markdown code block formatting if present
      let jsonString = response.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\n?/g, '');
      }

      const data = JSON.parse(jsonString);

      // Validate required fields
      if (!data.merchant || !data.date || data.total === undefined || !data.currency) {
        throw new Error('Missing required fields in OpenAI response');
      }

      // Parse date
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format in OpenAI response');
      }

      // Validate currency
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
      const currency = validCurrencies.includes(data.currency) ? data.currency : 'USD';
      const currencyConfidence = validCurrencies.includes(data.currency)
        ? data.confidence?.currency || 0.9
        : 0.5;

      if (!validCurrencies.includes(data.currency)) {
        logger.warn('Invalid currency in response, defaulting to USD', { currency: data.currency });
      }

      // Extract confidence scores
      const confidence = data.confidence || {};
      const merchantConf = confidence.merchant || 0.8;
      const dateConf = confidence.date || 0.8;
      const totalConf = confidence.total || 0.9;
      const taxConf = confidence.tax || 0.7;
      const categoryConf = confidence.category || 0.7;
      const itemsConf = confidence.items || 0.6;

      // Parse line items
      const lineItems: ParsedLineItem[] = (data.items || []).map(
        (item: {
          description?: string;
          quantity?: number;
          unitPrice?: number;
          total?: number;
          category?: string;
        }) => ({
          description: item.description || 'Unknown item',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: Number(item.total) || 0,
          category: item.category,
          confidence: itemsConf,
        })
      );

      // Calculate overall confidence
      const confidenceScores = [merchantConf, dateConf, totalConf, currencyConfidence];
      if (data.tax !== undefined) confidenceScores.push(taxConf);
      if (data.category) confidenceScores.push(categoryConf);
      if (lineItems.length > 0) confidenceScores.push(itemsConf);

      const overallConfidence =
        confidenceScores.reduce((sum, val) => sum + val, 0) / confidenceScores.length;

      // Build parsed receipt
      const parsedReceipt: ParsedReceipt = {
        merchant: createConfidentField(data.merchant, merchantConf),
        date: createConfidentField(parsedDate, dateConf),
        total: createConfidentField(Number(data.total), totalConf),
        currency: createConfidentField(currency as Currency, currencyConfidence),
        lineItems,
        overallConfidence,
        rawResponse: response,
      };

      // Add optional fields
      if (data.tax !== undefined) {
        parsedReceipt.tax = createConfidentField(Number(data.tax), taxConf);
      }

      if (data.category) {
        parsedReceipt.category = createConfidentField(data.category, categoryConf);
      }

      return parsedReceipt;
    } catch (error) {
      logger.error('Failed to parse OpenAI response', { error, response });
      throw new Error(
        `Failed to parse OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
