# Receipt CRUD API Documentation

This document describes the RESTful API endpoints for managing receipts.

## Authentication

All receipt endpoints require authentication via Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Base URL

All endpoints are prefixed with `/api/v1/receipts`

---

## Endpoints

### 1. Create Receipt

Create a new receipt.

**Endpoint:** `POST /api/v1/receipts`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

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
  "lineItems": [
    {
      "description": "Organic Bananas",
      "quantity": 2,
      "unitPrice": 0.79,
      "total": 1.58,
      "category": "Produce"
    }
  ],
  "imageUrl": "https://storage.googleapis.com/bucket/receipts/...",
  "status": "completed"
}
```

**Response (201 Created):**

```json
{
  "status": "success",
  "message": "Receipt created successfully",
  "data": {
    "receipt": {
      "id": "uuid-v4",
      "userId": "firebase-uid",
      "merchant": "Whole Foods Market",
      "date": "2024-01-15T00:00:00.000Z",
      "total": 127.45,
      "tax": 11.25,
      "currency": "USD",
      "category": "Food & Dining",
      "tags": ["groceries", "organic"],
      "lineItems": [...],
      "imageUrl": "https://storage.googleapis.com/bucket/receipts/...",
      "status": "completed",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "deletedAt": null
    }
  }
}
```

**Validation Rules:**
- `merchant`: Required, 1-200 characters
- `date`: Required, valid date
- `total`: Required, non-negative number
- `tax`: Optional, non-negative number
- `currency`: Required, ISO 4217 code (USD, EUR, BRL, GBP, JPY, CAD, AUD, CHF, CNY)
- `category`: Required, predefined or custom string (max 100 chars)
- `tags`: Optional array of strings (max 20 tags, each max 50 chars)
- `lineItems`: Optional array (max 100 items)
- `status`: Optional, defaults to 'pending'

---

### 2. Get Receipt by ID

Retrieve a single receipt by its ID.

**Endpoint:** `GET /api/v1/receipts/:id`

**Headers:**
- `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Receipt ID (UUID)

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "receipt": {
      "id": "uuid-v4",
      "userId": "firebase-uid",
      "merchant": "Whole Foods Market",
      "date": "2024-01-15T00:00:00.000Z",
      "total": 127.45,
      "tax": 11.25,
      "currency": "USD",
      "category": "Food & Dining",
      "tags": ["groceries", "organic"],
      "lineItems": [...],
      "imageUrl": "https://storage.googleapis.com/bucket/receipts/...",
      "status": "completed",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "deletedAt": null
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Receipt not found or deleted
- `403 Forbidden`: Receipt belongs to another user

---

### 3. List Receipts

List receipts with filtering, sorting, and cursor-based pagination.

**Endpoint:** `GET /api/v1/receipts`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startDate` | Date | Filter by start date (inclusive) | - |
| `endDate` | Date | Filter by end date (inclusive) | - |
| `category` | string | Filter by category | - |
| `merchant` | string | Filter by merchant name | - |
| `status` | string | Filter by status (pending, processing, completed, failed) | - |
| `tags` | string | Comma-separated tags to filter | - |
| `search` | string | Search across merchant and tags | - |
| `limit` | number | Items per page (max 100) | 20 |
| `startAfter` | string | Cursor for next page (receipt ID) | - |
| `sortBy` | string | Sort field (date, total, merchant, createdAt, updatedAt) | date |
| `sortOrder` | string | Sort order (asc, desc) | desc |

**Example Request:**

```
GET /api/v1/receipts?category=Food%20%26%20Dining&limit=20&sortBy=date&sortOrder=desc
```

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "receipts": [
      {
        "id": "uuid-v4",
        "userId": "firebase-uid",
        "merchant": "Whole Foods Market",
        "date": "2024-01-15T00:00:00.000Z",
        "total": 127.45,
        "tax": 11.25,
        "currency": "USD",
        "category": "Food & Dining",
        "tags": ["groceries", "organic"],
        "lineItems": [...],
        "imageUrl": "https://storage.googleapis.com/bucket/receipts/...",
        "status": "completed",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z",
        "deletedAt": null
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "hasMore": true,
      "nextCursor": "uuid-of-last-receipt"
    }
  }
}
```

**Pagination Example:**

To get the next page:
```
GET /api/v1/receipts?startAfter=uuid-of-last-receipt&limit=20
```

---

### 4. Update Receipt

Update specific fields of a receipt.

**Endpoint:** `PATCH /api/v1/receipts/:id`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**URL Parameters:**
- `id`: Receipt ID (UUID)

**Request Body (Partial Update):**

```json
{
  "merchant": "Updated Merchant Name",
  "total": 150.00,
  "category": "Office Supplies",
  "tags": ["office", "supplies", "work"]
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Receipt updated successfully",
  "data": {
    "receipt": {
      "id": "uuid-v4",
      "userId": "firebase-uid",
      "merchant": "Updated Merchant Name",
      "date": "2024-01-15T00:00:00.000Z",
      "total": 150.00,
      "tax": 11.25,
      "currency": "USD",
      "category": "Office Supplies",
      "tags": ["office", "supplies", "work"],
      "lineItems": [...],
      "imageUrl": "https://storage.googleapis.com/bucket/receipts/...",
      "status": "completed",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z",
      "deletedAt": null
    }
  }
}
```

**Validation Rules:**
- All fields are optional
- At least one field must be provided
- Same validation rules as create endpoint for each field

**Error Responses:**
- `400 Bad Request`: No fields provided or validation error
- `404 Not Found`: Receipt not found
- `403 Forbidden`: Receipt belongs to another user

---

### 5. Delete Receipt (Soft Delete)

Soft delete a receipt by setting the `deletedAt` timestamp.

**Endpoint:** `DELETE /api/v1/receipts/:id`

**Headers:**
- `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Receipt ID (UUID)

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Receipt deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Receipt not found
- `400 Bad Request`: Receipt already deleted
- `403 Forbidden`: Receipt belongs to another user

**Note:** Soft deleted receipts are not returned in list/get operations. The data is preserved in the database with a `deletedAt` timestamp.

---

### 6. Get Receipt Statistics

Get aggregated statistics for receipts with optional grouping.

**Endpoint:** `GET /api/v1/receipts/stats`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startDate` | Date | Filter by start date | - |
| `endDate` | Date | Filter by end date | - |
| `groupBy` | string | Group by 'category' or 'month' | - |

**Example Requests:**

1. Overall statistics:
```
GET /api/v1/receipts/stats
```

2. Statistics by category:
```
GET /api/v1/receipts/stats?groupBy=category
```

3. Statistics by month with date range:
```
GET /api/v1/receipts/stats?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
```

**Response (200 OK) - Overall:**

```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalAmount": 5234.56,
      "count": 42
    }
  }
}
```

**Response (200 OK) - Grouped by Category:**

```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalAmount": 5234.56,
      "count": 42,
      "byCategory": {
        "Food & Dining": {
          "amount": 2100.00,
          "count": 25
        },
        "Transportation": {
          "amount": 450.00,
          "count": 8
        },
        "Office Supplies": {
          "amount": 2684.56,
          "count": 9
        }
      }
    }
  }
}
```

**Response (200 OK) - Grouped by Month:**

```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalAmount": 5234.56,
      "count": 42,
      "byPeriod": {
        "2024-01": {
          "amount": 1200.00,
          "count": 12
        },
        "2024-02": {
          "amount": 1534.56,
          "count": 15
        },
        "2024-03": {
          "amount": 2500.00,
          "count": 15
        }
      }
    }
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Validation error: merchant is required",
  "statusCode": 400
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Authentication required",
  "statusCode": 401
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "Unauthorized access to receipt",
  "statusCode": 403
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Receipt not found",
  "statusCode": 404
}
```

### 429 Too Many Requests

```json
{
  "status": "error",
  "message": "Too many requests",
  "statusCode": 429
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Failed to create receipt",
  "statusCode": 500
}
```

---

## Rate Limiting

All receipt endpoints (except GET single receipt) are rate-limited to **10 requests per minute per user**.

---

## Data Models

### Receipt

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique receipt identifier (UUID) |
| `userId` | string | Owner's Firebase UID |
| `merchant` | string | Merchant/store name |
| `date` | Date | Transaction date |
| `total` | number | Total amount |
| `tax` | number | Tax amount (optional) |
| `currency` | Currency | ISO 4217 currency code |
| `category` | string | Receipt category |
| `tags` | string[] | Custom tags |
| `lineItems` | LineItem[] | Individual items |
| `imageUrl` | string | Receipt image URL (optional) |
| `status` | ReceiptStatus | Processing status |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |
| `deletedAt` | Date | Soft delete timestamp (optional) |

### LineItem

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Item description |
| `quantity` | number | Item quantity |
| `unitPrice` | number | Price per unit |
| `total` | number | Total item price |
| `category` | string | Item category (optional) |

### ReceiptStatus

- `pending` - Receipt uploaded, awaiting processing
- `processing` - AI extraction in progress
- `completed` - Processing complete
- `failed` - Processing failed

### ReceiptCategory (Predefined)

- `Food & Dining`
- `Transportation`
- `Office Supplies`
- `Travel`
- `Healthcare`
- `Other`

Custom categories are also supported (max 100 characters).

---

## Firestore Indexes

The following composite indexes are required for optimal performance:

1. `userId` (ASC) + `deletedAt` (ASC) + `date` (DESC/ASC)
2. `userId` (ASC) + `deletedAt` (ASC) + `category` (ASC) + `date` (DESC)
3. `userId` (ASC) + `deletedAt` (ASC) + `merchant` (ASC/DESC)
4. `userId` (ASC) + `deletedAt` (ASC) + `status` (ASC) + `updatedAt` (DESC)
5. `userId` (ASC) + `deletedAt` (ASC) + `createdAt` (DESC)
6. `userId` (ASC) + `deletedAt` (ASC) + `total` (ASC/DESC)
7. `userId` (ASC) + `deletedAt` (ASC) + `tags` (CONTAINS) + `date` (DESC)

Deploy indexes using:
```bash
firebase deploy --only firestore:indexes
```

---

## Best Practices

1. **Pagination**: Always use cursor-based pagination (`startAfter`) for better performance
2. **Filtering**: Combine filters to narrow results before sorting
3. **Search**: Use the `search` parameter for fuzzy matching across merchant and tags
4. **Rate Limits**: Implement exponential backoff for rate limit errors
5. **Caching**: Cache frequently accessed receipts on the client side
6. **Soft Delete**: Use soft delete to preserve data and allow recovery

---

## Examples

### Creating a Receipt from Upload

```bash
# 1. Upload receipt image
curl -X POST https://api.receiptscan.ai/api/v1/receipts/upload \
  -H "Authorization: Bearer <token>" \
  -F "receipt=@receipt.jpg"

# Response: { "data": { "receiptId": "...", "fileUrl": "..." } }

# 2. Parse receipt with AI
curl -X POST https://api.receiptscan.ai/api/v1/receipts/parse \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "...", "receiptId": "..."}'

# Response: { "data": { "parsed": { ... } } }

# 3. Create receipt with parsed data
curl -X POST https://api.receiptscan.ai/api/v1/receipts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "Whole Foods",
    "date": "2024-01-15",
    "total": 127.45,
    "currency": "USD",
    "category": "Food & Dining",
    "imageUrl": "..."
  }'
```

### Paginating Through Results

```bash
# Get first page
curl "https://api.receiptscan.ai/api/v1/receipts?limit=20" \
  -H "Authorization: Bearer <token>"

# Response includes nextCursor: "receipt-id-20"

# Get next page
curl "https://api.receiptscan.ai/api/v1/receipts?limit=20&startAfter=receipt-id-20" \
  -H "Authorization: Bearer <token>"
```

### Searching Receipts

```bash
# Search for "walmart"
curl "https://api.receiptscan.ai/api/v1/receipts?search=walmart" \
  -H "Authorization: Bearer <token>"

# Filter by category and date range
curl "https://api.receiptscan.ai/api/v1/receipts?category=Food%20%26%20Dining&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <token>"
```
