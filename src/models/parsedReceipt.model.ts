/**
 * Parsed receipt data models with confidence scores
 */

import { Currency, LineItem } from './receipt.model';

export interface ContactInfo {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface PaymentDetails {
  method?: string;
  cardNetwork?: string;
  last4?: string;
}

/**
 * Confidence level for extracted fields
 */
export enum ConfidenceLevel {
  HIGH = 'high', // > 0.8
  MEDIUM = 'medium', // 0.5 - 0.8
  LOW = 'low', // < 0.5
}

/**
 * Field with confidence score
 */
export interface ConfidentField<T> {
  value: T;
  confidence: number; // 0-1
  confidenceLevel: ConfidenceLevel;
}

/**
 * Parsed line item with confidence
 */
export interface ParsedLineItem extends LineItem {
  confidence?: number;
}

/**
 * Parsed receipt with confidence scores for each field
 */
export interface ParsedReceipt {
  merchant: ConfidentField<ContactInfo>;
  customer?: ConfidentField<ContactInfo>;
  date: ConfidentField<Date>;
  subtotal?: ConfidentField<number>;
  total: ConfidentField<number>;
  tax?: ConfidentField<number>;
  tip?: ConfidentField<number>;
  currency: ConfidentField<Currency>;
  category?: ConfidentField<string>;
  payment?: ConfidentField<PaymentDetails>;
  lineItems: ParsedLineItem[];
  overallConfidence: number; // Average confidence across all fields
  rawResponse?: string; // Raw AI response for debugging
  processingTime?: number; // Time taken to parse in ms
}

/**
 * Parse request data
 */
export interface ParseReceiptRequest {
  imageUrl: string;
  userId: string;
  receiptId?: string; // Optional receipt ID if updating existing
}

/**
 * Parse response data
 */
export interface ParseReceiptResponse {
  success: boolean;
  parsedData?: ParsedReceipt;
  error?: string;
  fallbackUsed?: boolean; // Whether fallback service was used
  source: 'openai' | 'google-vision' | 'failed';
}

/**
 * Helper function to calculate confidence level
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence > 0.8) return ConfidenceLevel.HIGH;
  if (confidence >= 0.5) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}

/**
 * Helper function to create confident field
 */
export function createConfidentField<T>(value: T, confidence: number): ConfidentField<T> {
  return {
    value,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
  };
}
