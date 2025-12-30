# receiptscan-backend

AI-powered receipt scanning and expense tracking API for receiptscan.ai

## 🚀 Features

- RESTful API built with Express.js and TypeScript
- **Firebase Authentication with JWT token verification**
- **Role-Based Access Control (RBAC) for admin/user roles**
- **Stripe subscription billing with tiered pricing (Free/Pro)**
- **Usage tracking and limit enforcement**
- **Subscription tier management for billing integration**
- **Comprehensive security hardening:**
  - Request sanitization and input validation
  - Rate limiting per endpoint and IP-based abuse detection
  - Enhanced security headers (CSP, HSTS, X-Frame-Options)
  - CORS configuration with allowed origins
  - Audit logging for sensitive operations
  - API key authentication support
- Structured logging with Winston (includes request IDs)
- Environment-based configuration
- Security middleware (Helmet, CORS)
- Health check endpoint
- Layered architecture (Controller → Service → Repository)
- Code quality tools (ESLint, Prettier)
- Hot-reload development with nodemon

## 📋 Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- **Firebase project with Admin SDK credentials**
- **Firestore database enabled**
- **Stripe account for billing (optional)**

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/guilhermomg/receiptscan-backend.git
cd receiptscan-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example environment file
cp .env.example .env.development

# Edit .env.development with your configuration
```

4. Set up Firebase credentials:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Generate a new private key
   - Add the credentials to your `.env.development` file:
     ```env
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
     ```
   - **Note:** Replace `\n` with `\\n` in the private key for environment files

5. Set up Stripe (optional, for billing features):
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Get your API keys from Developers → API keys
   - Create a product and price for Pro subscription:
     - Go to Products → Add Product
     - Create a "Pro Subscription" product with $9/month recurring price
     - Copy the Price ID (starts with `price_`)
   - Set up webhook endpoint:
     - Go to Developers → Webhooks → Add endpoint
     - Endpoint URL: `https://your-domain.com/api/v1/billing/webhook`
     - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
     - Copy the webhook signing secret
   - Add credentials to your `.env.development` file:
     ```env
     STRIPE_SECRET_KEY=sk_test_your_secret_key
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
     STRIPE_PRO_PRICE_ID=price_your_price_id
     FRONTEND_URL=http://localhost:3001
     ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:3000` with hot-reload enabled.

### Production Build
```bash
# Build the project
npm run build

# Start the production server
npm run start:prod
```

## 📁 Project Structure

```
receiptscan-backend/
├── src/
│   ├── config/          # Configuration files (env, logger)
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic layer
│   ├── models/          # Data models
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   ├── routes/          # API routes
│   ├── app.ts           # Express app setup
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── logs/                # Log files (production)
├── .env.example         # Example environment variables
├── .env.development     # Development environment
├── .env.test            # Test environment
├── .env.production      # Production environment
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint configuration
├── .prettierrc.json     # Prettier configuration
└── nodemon.json         # Nodemon configuration
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run start:dev` | Start in development mode |
| `npm run start:prod` | Start in production mode |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## 🔍 API Endpoints

### Health Check
- **GET** `/api/v1/health`
  
  Returns the health status of the API.

  **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2025-12-30T16:00:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0"
  }
  ```

### Authentication

All authentication endpoints require a valid Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

#### POST /api/v1/auth/register
Register a new user profile.

**Request Body:**
```json
{
  "displayName": "John Doe"  // optional
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "userId": "firebase-uid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "user",
      "subscriptionTier": "free",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### GET /api/v1/auth/me
Get current user profile.

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "userId": "firebase-uid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "user",
      "subscriptionTier": "free",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PATCH /api/v1/auth/profile
Update user profile.

**Request Body:**
```json
{
  "displayName": "Jane Doe",
  "subscriptionTier": "premium"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "userId": "firebase-uid",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "role": "user",
      "subscriptionTier": "premium",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

For detailed authentication flow and usage examples, see [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md).

### Billing & Subscriptions

The API integrates with Stripe for subscription management with tiered pricing.

#### Subscription Tiers

| Tier | Price | Receipt Limit |
|------|-------|---------------|
| **Free** | $0/month | 10 receipts/month |
| **Pro** | $9/month | Unlimited |

#### POST /api/v1/billing/create-checkout

Create a Stripe checkout session for Pro subscription signup.

**Request:**
```bash
curl -X POST https://api.receiptscan.ai/api/v1/billing/create-checkout \
  -H "Authorization: Bearer <firebase-id-token>"
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

#### POST /api/v1/billing/create-portal

Create a Stripe customer portal session for subscription management.

**Request:**
```bash
curl -X POST https://api.receiptscan.ai/api/v1/billing/create-portal \
  -H "Authorization: Bearer <firebase-id-token>"
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "portalUrl": "https://billing.stripe.com/p/session/test_..."
  }
}
```

#### GET /api/v1/billing/subscription

Get current user subscription details and usage.

**Request:**
```bash
curl -X GET https://api.receiptscan.ai/api/v1/billing/subscription \
  -H "Authorization: Bearer <firebase-id-token>"
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "subscription": {
      "tier": "pro",
      "status": "active",
      "currentPeriodEnd": "2024-02-15T00:00:00.000Z",
      "receiptUsageThisMonth": 25,
      "receiptLimit": null
    }
  }
}
```

#### POST /api/v1/billing/webhook

Stripe webhook endpoint for processing subscription events. This endpoint is public but secured with Stripe webhook signature verification.

**Handled Events:**
- `checkout.session.completed` - Activates Pro subscription
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Downgrades to Free tier
- `invoice.payment_succeeded` - Resets monthly usage
- `invoice.payment_failed` - Marks subscription as past_due

**Billing Features:**
- Hosted Stripe Checkout for secure payment processing
- Customer portal for subscription management
- Automatic webhook processing with idempotency
- Usage tracking and limit enforcement
- Monthly usage reset on billing cycle
- Grace period for failed payments

### File Upload

All file upload endpoints require authentication.

#### POST /api/v1/receipts/upload
Upload a receipt file (image or PDF).

**Requirements:**
- Authentication: Required (Bearer token)
- Content-Type: `multipart/form-data`
- Field name: `receipt`
- Max file size: 10MB
- Allowed types: images (JPEG, PNG, GIF, WebP, BMP, TIFF) and PDF
- Rate limit: 10 uploads per minute per user

**Request:**
```bash
curl -X POST https://api.receiptscan.ai/api/v1/receipts/upload \
  -H "Authorization: Bearer <firebase-id-token>" \
  -F "receipt=@/path/to/receipt.jpg"
```

**Response (201):**
```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "data": {
    "receiptId": "uuid-v4",
    "fileName": "receipt.jpg",
    "filePath": "receipts/user-id/receipt-id/timestamp-filename.jpg",
    "fileUrl": "https://storage.googleapis.com/bucket/...",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type, size exceeds limit, or no file provided
- `401 Unauthorized`: Missing or invalid authentication token
- `429 Too Many Requests`: Rate limit exceeded (10 uploads per minute)
- `500 Internal Server Error`: Server error during upload

#### DELETE /api/v1/receipts/file
Delete a receipt file from storage.

**Request Body:**
```json
{
  "filePath": "receipts/user-id/receipt-id/timestamp-filename.jpg"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "File deleted successfully"
}
```

#### POST /api/v1/receipts/file-url
Generate a new signed URL for an existing file.

**Request Body:**
```json
{
  "filePath": "receipts/user-id/receipt-id/timestamp-filename.jpg"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "fileUrl": "https://storage.googleapis.com/bucket/...",
    "expiresIn": "1 hour"
  }
}
```

**File Upload Features:**
- Automatic file validation (size, type, extension)
- Secure file storage in Firebase Cloud Storage
- Signed URLs with 1-hour expiration
- File naming strategy: `receipts/{userId}/{receiptId}/{timestamp}-{filename}`
- Rate limiting to prevent abuse
- Comprehensive error handling

### Receipt Parsing

All receipt parsing endpoints require authentication.

#### POST /api/v1/receipts/parse
Parse receipt data from an image URL using AI (OpenAI GPT-4 Vision).

**Requirements:**
- Authentication: Required (Bearer token)
- Content-Type: `application/json`
- Rate limit: 10 requests per minute per user

**Request Body:**
```json
{
  "imageUrl": "https://storage.googleapis.com/bucket/receipts/...",
  "receiptId": "uuid-v4" // optional - if updating existing receipt
}
```

**Request Example:**
```bash
curl -X POST https://api.receiptscan.ai/api/v1/receipts/parse \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://storage.googleapis.com/bucket/receipts/user-id/receipt-id/receipt.jpg"
  }'
```

**Response (200):**
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
        },
        {
          "description": "Greek Yogurt",
          "quantity": 1,
          "unitPrice": 5.99,
          "total": 5.99,
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

**Confidence Levels:**
- `high` - Confidence > 0.8 (Highly accurate)
- `medium` - Confidence 0.5-0.8 (May need review)
- `low` - Confidence < 0.5 (Should be verified)

**Error Responses:**
- `400 Bad Request`: Invalid image URL or missing required fields
- `401 Unauthorized`: Missing or invalid authentication token
- `429 Too Many Requests`: Rate limit exceeded (10 requests per minute)
- `500 Internal Server Error`: Parsing failed or OpenAI service unavailable

**Parsing Features:**
- AI-powered data extraction using OpenAI GPT-4 Vision
- Extracts merchant, date, total, tax, currency, category, and line items
- Confidence scoring for all extracted fields
- Retry logic for transient failures
- Detailed error messages for troubleshooting
- Processing time tracking

### Receipt CRUD Operations

All receipt CRUD endpoints require authentication. See [docs/RECEIPT_CRUD_API.md](docs/RECEIPT_CRUD_API.md) for comprehensive documentation.

#### POST /api/v1/receipts
Create a new receipt.

**Request Body:**
```json
{
  "merchant": "Whole Foods Market",
  "date": "2024-01-15T00:00:00.000Z",
  "total": 127.45,
  "tax": 11.25,
  "currency": "USD",
  "category": "Food & Dining",
  "tags": ["groceries", "organic"],
  "lineItems": [...],
  "imageUrl": "https://storage.googleapis.com/...",
  "status": "completed"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Receipt created successfully",
  "data": {
    "receipt": { ... }
  }
}
```

#### GET /api/v1/receipts/:id
Get a single receipt by ID.

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "receipt": { ... }
  }
}
```

#### GET /api/v1/receipts
List receipts with filtering, sorting, and cursor-based pagination.

**Query Parameters:**
- `startDate`, `endDate` - Date range filter
- `category`, `merchant`, `status` - Field filters
- `tags` - Comma-separated tags
- `search` - Search merchant and tags
- `limit` (default: 20, max: 100) - Results per page
- `startAfter` - Cursor for pagination
- `sortBy` (date, total, merchant, createdAt, updatedAt) - Sort field
- `sortOrder` (asc, desc) - Sort direction

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "receipts": [...],
    "pagination": {
      "total": 150,
      "limit": 20,
      "hasMore": true,
      "nextCursor": "receipt-id"
    }
  }
}
```

#### PATCH /api/v1/receipts/:id
Update a receipt (partial update).

**Request Body:**
```json
{
  "merchant": "Updated Name",
  "total": 150.00,
  "tags": ["updated", "tags"]
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Receipt updated successfully",
  "data": {
    "receipt": { ... }
  }
}
```

#### DELETE /api/v1/receipts/:id
Soft delete a receipt (sets `deletedAt` timestamp).

**Response (200):**
```json
{
  "status": "success",
  "message": "Receipt deleted successfully"
}
```

#### GET /api/v1/receipts/stats
Get receipt statistics with optional grouping.

**Query Parameters:**
- `startDate`, `endDate` - Date range filter
- `groupBy` - Group by 'category' or 'month'

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalAmount": 5234.56,
      "count": 42,
      "byCategory": {
        "Food & Dining": { "amount": 2100.00, "count": 25 }
      }
    }
  }
}
```

#### GET /api/v1/receipts/export

Export receipts in CSV or PDF format.

**Query Parameters:**
- `format` (required) - Export format: `csv` or `pdf`
- `startDate` (optional) - Start date for filtering (ISO 8601)
- `endDate` (optional) - End date for filtering (ISO 8601)
- `category` (optional) - Filter by category
- `merchant` (optional) - Filter by merchant
- `tags` (optional) - Comma-separated tags to filter

**Rate Limit:** 5 exports per hour per user

**Response (200):**
```json
{
  "status": "success",
  "message": "Export generated successfully",
  "data": {
    "downloadUrl": "https://storage.googleapis.com/...",
    "fileName": "receipts-export-1234567890.csv",
    "fileSize": 2048,
    "recordCount": 25,
    "expiresIn": "24 hours"
  }
}
```

**CSV Format:**
- Columns: Date, Merchant, Amount, Tax, Currency, Category, Tags, Status, Line Items
- Comma-separated values with headers
- UTF-8 encoding

**PDF Format:**
- Professional formatted report with summary section
- Complete receipts list with details
- Totals and statistics
- Pagination with page numbers

#### GET /api/v1/receipts/analytics

Get spending analytics and insights.

**Query Parameters:**
- `period` (optional) - Time period: `this_month`, `last_month`, `ytd`, `custom` (default: `this_month`)
- `startDate` (required for custom) - Start date for custom period (ISO 8601)
- `endDate` (required for custom) - End date for custom period (ISO 8601)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "summary": {
        "totalAmount": 5234.56,
        "totalReceipts": 42,
        "avgAmount": 124.63,
        "period": {
          "start": "2024-12-01T00:00:00.000Z",
          "end": "2024-12-31T23:59:59.000Z"
        }
      },
      "byCategory": [
        {
          "category": "Food & Dining",
          "amount": 2100.00,
          "count": 25,
          "percentage": 40.1
        },
        {
          "category": "Transportation",
          "amount": 850.00,
          "count": 8,
          "percentage": 16.2
        }
      ],
      "monthlyTrends": [
        {
          "month": "2024-11",
          "amount": 4120.00,
          "count": 35
        },
        {
          "month": "2024-12",
          "amount": 5234.56,
          "count": 42
        }
      ],
      "topMerchants": [
        {
          "merchant": "Whole Foods Market",
          "amount": 850.00,
          "count": 12,
          "avgAmount": 70.83
        },
        {
          "merchant": "Shell Gas Station",
          "amount": 450.00,
          "count": 6,
          "avgAmount": 75.00
        }
      ]
    }
  }
}
```

**Export & Analytics Features:**
- CSV and PDF export in multiple formats
- Date range filtering for targeted exports
- Signed URLs with 24-hour expiration for security
- Comprehensive spending analytics with multiple dimensions
- Category breakdown with percentages
- Monthly spending trends over time
- Top merchants by total spending
- Rate limiting to prevent abuse (5 exports per hour)
- Efficient pagination for large datasets

**Receipt CRUD Features:**
- Full CRUD operations with proper authorization
- Cursor-based pagination for efficient scrolling
- Advanced filtering (date range, category, merchant, tags, status)
- Search across merchant names and tags
- Soft delete preserves data with `deletedAt` timestamp
- Statistics and aggregations by category or time period
- Rate limiting (10 requests per minute per user)
- Comprehensive Firestore indexes for optimal performance

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/test/production) | development |
| `PORT` | Server port | 3000 |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |
| `API_PREFIX` | API route prefix | /api/v1 |
| **Security Configuration** | | |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins | http://localhost:3001,http://localhost:3000 |
| `MAX_REQUEST_SIZE` | Maximum request body size (prevents payload attacks) | 10mb |
| **Firebase Configuration** | | |
| `FIREBASE_PROJECT_ID` | Firebase project ID | - |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | - |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | - |
| `FIREBASE_STORAGE_BUCKET` | Firebase Cloud Storage bucket name | - |
| **OpenAI Configuration** | | |
| `OPENAI_API_KEY` | OpenAI API key for receipt parsing | - |
| `OPENAI_MODEL` | OpenAI model to use | gpt-4o |
| `OPENAI_MAX_TOKENS` | Maximum tokens for OpenAI response | 2000 |
| `OPENAI_TEMPERATURE` | Temperature for AI responses (0-1) | 0.1 |
| **Stripe Configuration** | | |
| `STRIPE_SECRET_KEY` | Stripe secret key for billing | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | - |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro subscription | - |
| `FRONTEND_URL` | Frontend URL for redirect URLs | http://localhost:3001 |

## 📝 Logging

The application uses Winston for structured logging with the following features:
- Request IDs for tracing requests
- Different log levels per environment
- Console logging in development
- File logging in production (logs/error.log, logs/combined.log)
- Timestamps and metadata support

## 🏗️ Architecture

The project follows a layered architecture pattern:

1. **Controllers**: Handle HTTP requests and responses
2. **Services**: Contain business logic
3. **Repositories**: Handle data persistence operations
4. **Models**: Define data structures
5. **Middleware**: Process requests before reaching controllers

This separation ensures:
- Clear separation of concerns
- Easy testing and maintenance
- Scalable codebase

## 📦 Data Models

### Receipt Data Model

The receipt data model is designed to support AI-powered receipt extraction with comprehensive fields for expense tracking.

#### Receipt Schema

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | string (UUID) | Unique receipt identifier | Yes |
| `userId` | string | Owner of the receipt | Yes |
| `merchant` | string | Merchant/store name | Yes |
| `date` | Date | Receipt transaction date | Yes |
| `total` | number | Total amount | Yes |
| `tax` | number | Tax amount | No |
| `currency` | Currency | ISO 4217 currency code | Yes |
| `category` | string | Receipt category | Yes |
| `tags` | string[] | Custom tags for organization | No |
| `lineItems` | LineItem[] | Individual items on receipt | No |
| `imageUrl` | string | URL to receipt image | No |
| `status` | ReceiptStatus | Processing status | Yes |
| `createdAt` | Date | Creation timestamp | Yes |
| `updatedAt` | Date | Last update timestamp | Yes |

#### LineItem Schema

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `description` | string | Item description | Yes |
| `quantity` | number | Item quantity | Yes |
| `unitPrice` | number | Price per unit | Yes |
| `total` | number | Total item price | Yes |
| `category` | string | Item category | No |

#### Receipt Status Values

- `pending` - Receipt uploaded, awaiting processing
- `processing` - AI extraction in progress
- `completed` - Processing complete
- `failed` - Processing failed

#### Receipt Categories

Predefined categories (custom categories also supported):
- Food & Dining
- Transportation
- Office Supplies
- Travel
- Healthcare
- Other

#### Supported Currencies

ISO 4217 currency codes: USD, EUR, BRL, GBP, JPY, CAD, AUD, CHF, CNY

### Firestore Collections

#### receipts/{receiptId}

Main collection storing all receipt documents.

**Indexes:**

The following composite indexes are configured for efficient queries:

1. `userId` (ASC) + `date` (DESC) - List user receipts by date
2. `userId` (ASC) + `date` (ASC) - Date range queries
3. `userId` (ASC) + `category` (ASC) + `date` (DESC) - Category filtering
4. `userId` (ASC) + `status` (ASC) + `updatedAt` (DESC) - Status filtering
5. `userId` (ASC) + `createdAt` (DESC) - Recent receipts
6. `userId` (ASC) + `total` (DESC) - Sort by amount
7. `userId` (ASC) + `tags` (CONTAINS) + `date` (DESC) - Tag filtering

To deploy indexes to Firestore:
```bash
firebase deploy --only firestore:indexes
```

### Repository Layer

The `ReceiptRepository` class provides the following operations:

- `createReceipt(userId, receiptData)` - Create new receipt
- `getReceiptById(receiptId, userId)` - Get single receipt
- `getReceiptsByUserId(params)` - Get receipts with filtering/pagination
- `getReceiptsByDateRange(userId, startDate, endDate)` - Date range query
- `getReceiptsByCategory(userId, category)` - Category filter
- `getReceiptsByTags(userId, tags)` - Tag filter
- `getReceiptsByStatus(userId, status)` - Status filter
- `updateReceipt(receiptId, userId, updates)` - Update receipt
- `deleteReceipt(receiptId, userId)` - Delete receipt

All repository methods include:
- Ownership verification
- Error handling with logging
- Type-safe interfaces
- Pagination support

### Data Validation

Receipt data is validated using Zod schemas before persistence:

```typescript
import { createReceiptSchema, updateReceiptSchema } from './models/receipt.validation';

// Validate create data
const validatedData = createReceiptSchema.parse(requestData);

// Validate update data
const validatedUpdates = updateReceiptSchema.parse(requestData);
```

## 🔒 Security

The API implements comprehensive security hardening to protect against common attacks and abuse.

### Security Headers

All API responses include the following security headers via Helmet.js:

- **Content-Security-Policy (CSP)**: Prevents XSS attacks by controlling which resources can be loaded
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS connections for 1 year
- **X-Frame-Options**: Set to `DENY` to prevent clickjacking attacks
- **X-Content-Type-Options**: Set to `nosniff` to prevent MIME type sniffing
- **X-XSS-Protection**: Enables browser XSS protection
- **Referrer-Policy**: Set to `strict-origin-when-cross-origin` for privacy

### CORS Configuration

CORS is configured to only allow requests from trusted origins:

```env
CORS_ORIGINS=http://localhost:3001,https://receiptscan.ai
```

The CORS configuration includes:
- Explicit origin validation
- Credentials support
- Exposed rate limit headers
- 10-minute preflight cache

### Rate Limiting

Different rate limits are applied per endpoint type:

| Endpoint Type | Rate Limit | Window | Key |
|--------------|------------|--------|-----|
| **General API** | 100 requests | 1 minute | IP address |
| **Uploads** | 10 requests | 1 minute | User ID or IP |
| **Exports** | 5 requests | 1 hour | User ID or IP |
| **Billing** | 10 requests | 1 minute | User ID or IP |

Rate limit information is returned in response headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Unix timestamp when limit resets

### IP-Based Abuse Detection

The API tracks failed authentication attempts and automatically blocks IPs that exceed thresholds:

- **Threshold**: 10 failed attempts within 15 minutes
- **Block Duration**: Starts at 15 minutes, increases exponentially with repeated violations (max 24 hours)
- **Tracking Window**: 15 minutes
- **Auto-cleanup**: Old entries are automatically removed

Blocked IPs receive a `403 Forbidden` response with a clear message.

### Input Validation & Sanitization

All requests are sanitized to prevent injection attacks:

- **SQL Injection**: Removes SQL keywords and dangerous characters
- **NoSQL Injection**: Strips MongoDB operators like `$where`, `$ne`
- **XSS Prevention**: Removes script tags and event handlers
- **Command Injection**: Blocks shell metacharacters
- **Prototype Pollution**: Rejects `__proto__`, `constructor`, `prototype` keys

Validation is performed on:
- Request body
- Query parameters
- URL parameters

### Request Size Limits

To prevent payload attacks, request body sizes are limited:

```env
MAX_REQUEST_SIZE=10mb
```

Applies to:
- JSON payloads
- URL-encoded data
- Multipart form data (file uploads)

### Audit Logging

All sensitive operations are logged to a dedicated Firestore collection (`auditLogs`) for compliance and security monitoring:

**Logged Operations:**
- User registration and profile updates
- Receipt creation and deletion
- Export generation
- Billing operations (checkout, portal)
- Security events (rate limits, invalid tokens, blocked IPs)

**Audit Log Fields:**
```typescript
{
  timestamp: Date,
  action: string,           // e.g., 'receipt.create'
  userId: string,
  userEmail: string,
  ip: string,
  userAgent: string,
  requestId: string,
  resource: {
    type: string,           // e.g., 'receipt'
    id: string
  },
  metadata: object,
  success: boolean,
  errorMessage?: string
}
```

### API Key Authentication

The API supports API key authentication in addition to Firebase Auth tokens for future API product offerings:

**Using API Keys:**
```bash
curl -X GET https://api.receiptscan.ai/api/v1/receipts \
  -H "X-API-Key: rsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**API Key Features:**
- Cryptographically secure key generation
- SHA-256 hashed storage
- Scope-based permissions
- Expiration support
- Usage tracking (last used timestamp)
- Rate limiting per key

**Key Format:** `rsk_[live|test]_[48-character-hex]`

### Authentication Security

**Token Verification:**
- Firebase ID tokens are verified on every authenticated request
- Invalid or expired tokens are rejected with `401 Unauthorized`
- Failed authentication attempts are tracked for abuse detection

**User Context:**
- Authenticated requests include user ID, email, role, and subscription tier
- Authorization checks ensure users can only access their own resources

### Best Practices

When deploying to production:

1. **Environment Variables**: Use strong, unique values for all secrets
2. **CORS Origins**: Restrict to only your production domains
3. **HTTPS Only**: Enable HSTS and serve all traffic over HTTPS
4. **Firestore Security Rules**: Configure strict rules (see Firebase console)
5. **Monitoring**: Set up alerts for security events in audit logs
6. **Regular Updates**: Keep dependencies updated for security patches

### Security Response Headers Example

```http
Content-Security-Policy: default-src 'self'; script-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1704067200
```

## 🧪 Code Quality

### Linting
```bash
npm run lint
npm run lint:fix
```

### Formatting
```bash
npm run format
npm run format:check
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

