# Receipt Parsing API - Testing Guide

## Overview
This guide provides examples for testing the receipt parsing endpoint.

## Prerequisites
- Valid Firebase Authentication token
- Receipt image URL (accessible via HTTPS)
- OpenAI API key configured in environment

## Endpoint
```
POST /api/v1/receipts/parse
```

## Testing with cURL

### Basic Request
```bash
curl -X POST http://localhost:3000/api/v1/receipts/parse \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.googleapis.com/your-bucket/receipts/sample-receipt.jpg"
  }'
```

### Request with Receipt ID
```bash
curl -X POST http://localhost:3000/api/v1/receipts/parse \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.googleapis.com/your-bucket/receipts/sample-receipt.jpg",
    "receiptId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

## Expected Response

### Success Response (200 OK)
```json
{
  "status": "success",
  "message": "Receipt parsed successfully",
  "data": {
    "parsed": {
      "merchant": "Whole Foods Market",
      "merchantConfidence": 0.95,
      "merchantConfidenceLevel": "high",
      "date": "2024-01-15T00:00:00.000Z",
      "dateConfidence": 0.92,
      "dateConfidenceLevel": "high",
      "total": 127.45,
      "totalConfidence": 0.98,
      "totalConfidenceLevel": "high",
      "tax": 11.25,
      "taxConfidence": 0.88,
      "taxConfidenceLevel": "high",
      "currency": "USD",
      "currencyConfidence": 0.99,
      "currencyConfidenceLevel": "high",
      "category": "Food & Dining",
      "categoryConfidence": 0.85,
      "categoryConfidenceLevel": "high",
      "lineItems": [
        {
          "description": "Organic Bananas",
          "quantity": 2,
          "unitPrice": 0.79,
          "total": 1.58,
          "confidence": 0.75
        }
      ],
      "overallConfidence": 0.92
    },
    "metadata": {
      "source": "openai",
      "processingTime": 2345,
      "fallbackUsed": false
    }
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "status": "error",
  "message": "Invalid request: Valid image URL is required",
  "statusCode": 400
}
```

### Error Response (401 Unauthorized)
```json
{
  "status": "error",
  "message": "Authentication required",
  "statusCode": 401
}
```

### Error Response (429 Too Many Requests)
```json
{
  "status": "error",
  "message": "Too many upload requests. Please try again later.",
  "statusCode": 429
}
```

### Error Response (500 Internal Server Error)
```json
{
  "status": "error",
  "message": "Failed to parse receipt",
  "statusCode": 500
}
```

## Confidence Levels

The API returns confidence scores for all extracted fields:

- **high** (> 0.8): Highly accurate, can be trusted
- **medium** (0.5 - 0.8): May need review
- **low** (< 0.5): Should be manually verified

## Rate Limiting

- **Limit**: 10 requests per minute per user
- **Window**: 60 seconds
- **Identification**: Based on authenticated user ID

## Test Scenarios

### 1. Valid Receipt Image
- Use a clear receipt image with visible text
- Expected: High confidence scores (> 0.8)
- Status: 200 OK

### 2. Blurry or Low Quality Image
- Use a poor quality receipt image
- Expected: Lower confidence scores (0.5 - 0.8)
- Status: 200 OK with warnings in confidence levels

### 3. Invalid Image URL
- Use a non-existent or inaccessible URL
- Expected: 400 Bad Request
- Message: "Image URL is not accessible or invalid"

### 4. Missing Authentication
- Omit the Authorization header
- Expected: 401 Unauthorized
- Message: "Authentication required"

### 5. Rate Limit Exceeded
- Make more than 10 requests within 1 minute
- Expected: 429 Too Many Requests
- Message: "Too many upload requests. Please try again later."

### 6. Invalid Request Body
- Send invalid JSON or missing imageUrl
- Expected: 400 Bad Request
- Message: "Invalid request: [validation error]"

## Sample Receipt Images for Testing

You can use these public sample receipt images:
1. https://www.receipthero.com/sample-receipt.jpg
2. https://images.example.com/grocery-receipt.png

Or upload your own receipt image to Firebase Storage first using the `/api/v1/receipts/upload` endpoint.

## Environment Configuration

Ensure these environment variables are set:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.1
```

## Troubleshooting

### Issue: "OpenAI service is not configured"
**Solution**: Verify OPENAI_API_KEY is set in your environment

### Issue: "Image URL is not accessible"
**Solution**: 
- Check that the URL is publicly accessible
- Verify the URL returns a valid image
- Ensure HTTPS is used

### Issue: "Failed to parse OpenAI response"
**Solution**: 
- Check OpenAI API status
- Verify image is a valid receipt
- Check application logs for detailed error messages

## Logging

All parsing operations are logged with:
- Request ID for tracing
- User ID
- Image URL
- Processing time
- Confidence scores
- Any errors encountered

Check logs at: `logs/combined.log` (production) or console (development)

## Performance

Expected processing times:
- Simple receipt: 1-3 seconds
- Complex receipt with many items: 3-5 seconds
- Retry attempts: Additional 1-2 seconds per retry

## Next Steps

After successful parsing, you can:
1. Save the parsed data to Firestore
2. Update receipt status to 'completed'
3. Notify the user via webhook/notification
4. Allow user to review and edit low-confidence fields
