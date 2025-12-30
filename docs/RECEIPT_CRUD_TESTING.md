# Receipt CRUD API Testing Guide

This document provides comprehensive testing scenarios for the Receipt CRUD API.

## Prerequisites

- Backend server running locally or in a test environment
- Valid Firebase authentication token
- API client (curl, Postman, or similar)
- Test data for receipts

## Environment Setup

```bash
# Start the development server
npm run dev
```

The server will start on `http://localhost:3000`

## Test Scenarios

### 1. Authentication Test

**Objective:** Verify authentication is required for all endpoints

```bash
# Test without auth token - should return 401
curl -X GET http://localhost:3000/api/v1/receipts
# Expected: 401 Unauthorized

# Test with invalid token - should return 401
curl -X GET http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized
```

### 2. Create Receipt

**Objective:** Test creating a new receipt with valid data

```bash
# Create a receipt
curl -X POST http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "Test Store",
    "date": "2024-01-15T00:00:00.000Z",
    "total": 100.50,
    "tax": 8.50,
    "currency": "USD",
    "category": "Food & Dining",
    "tags": ["groceries", "test"],
    "status": "completed"
  }'
```

**Expected Response:**
- Status: 201 Created
- Response includes receipt with generated ID
- Receipt has `createdAt`, `updatedAt` timestamps
- `deletedAt` is null

**Test Cases:**
- ✅ Valid receipt creation
- ✅ Validation error for missing required fields (merchant, date, total, currency, category)
- ✅ Validation error for negative total
- ✅ Validation error for invalid currency code
- ✅ Validation error for too many tags (> 20)
- ✅ Validation error for too many lineItems (> 100)

### 3. Get Receipt by ID

**Objective:** Test retrieving a single receipt

```bash
# Get receipt by ID
curl -X GET http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <valid-token>"
```

**Expected Response:**
- Status: 200 OK
- Receipt data matches created receipt
- Receipt belongs to authenticated user

**Test Cases:**
- ✅ Get existing receipt
- ✅ 404 error for non-existent receipt ID
- ✅ 403 error when trying to access another user's receipt
- ✅ 404 error for soft-deleted receipt

### 4. List Receipts (No Filters)

**Objective:** Test basic listing without filters

```bash
# List all receipts
curl -X GET http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>"
```

**Expected Response:**
- Status: 200 OK
- Array of receipts (max 20 by default)
- Pagination object with total, limit, hasMore, nextCursor
- Receipts sorted by date DESC (default)
- Only user's receipts returned
- Soft-deleted receipts excluded

**Test Cases:**
- ✅ Default listing (20 receipts, sorted by date DESC)
- ✅ Empty array when user has no receipts
- ✅ Correct pagination metadata

### 5. List Receipts with Pagination

**Objective:** Test cursor-based pagination

```bash
# First page
curl -X GET "http://localhost:3000/api/v1/receipts?limit=5" \
  -H "Authorization: Bearer <valid-token>"

# Next page using cursor from previous response
curl -X GET "http://localhost:3000/api/v1/receipts?limit=5&startAfter=<last-receipt-id>" \
  -H "Authorization: Bearer <valid-token>"
```

**Test Cases:**
- ✅ First page returns 5 receipts
- ✅ `hasMore` is true when more receipts exist
- ✅ `nextCursor` contains last receipt ID
- ✅ Second page starts after cursor
- ✅ Last page has `hasMore: false`
- ✅ Invalid cursor returns empty results or error

### 6. List Receipts with Filters

**Objective:** Test filtering capabilities

```bash
# Filter by category
curl -X GET "http://localhost:3000/api/v1/receipts?category=Food+%26+Dining" \
  -H "Authorization: Bearer <valid-token>"

# Filter by date range
curl -X GET "http://localhost:3000/api/v1/receipts?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <valid-token>"

# Filter by merchant
curl -X GET "http://localhost:3000/api/v1/receipts?merchant=Test+Store" \
  -H "Authorization: Bearer <valid-token>"

# Filter by status
curl -X GET "http://localhost:3000/api/v1/receipts?status=completed" \
  -H "Authorization: Bearer <valid-token>"

# Filter by tags (comma-separated)
curl -X GET "http://localhost:3000/api/v1/receipts?tags=groceries,test" \
  -H "Authorization: Bearer <valid-token>"

# Combined filters
curl -X GET "http://localhost:3000/api/v1/receipts?category=Food+%26+Dining&startDate=2024-01-01&status=completed" \
  -H "Authorization: Bearer <valid-token>"
```

**Test Cases:**
- ✅ Category filter returns only matching receipts
- ✅ Date range filter (inclusive)
- ✅ Merchant filter (exact match)
- ✅ Status filter
- ✅ Tags filter (array-contains-any, max 10 tags)
- ✅ Multiple filters work together
- ✅ Invalid filter values handled gracefully

### 7. List Receipts with Sorting

**Objective:** Test sorting options

```bash
# Sort by date ascending
curl -X GET "http://localhost:3000/api/v1/receipts?sortBy=date&sortOrder=asc" \
  -H "Authorization: Bearer <valid-token>"

# Sort by total descending
curl -X GET "http://localhost:3000/api/v1/receipts?sortBy=total&sortOrder=desc" \
  -H "Authorization: Bearer <valid-token>"

# Sort by merchant
curl -X GET "http://localhost:3000/api/v1/receipts?sortBy=merchant&sortOrder=asc" \
  -H "Authorization: Bearer <valid-token>"

# Sort by createdAt
curl -X GET "http://localhost:3000/api/v1/receipts?sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer <valid-token>"
```

**Test Cases:**
- ✅ Sort by date (ASC/DESC)
- ✅ Sort by total (ASC/DESC)
- ✅ Sort by merchant (ASC/DESC)
- ✅ Sort by createdAt (ASC/DESC)
- ✅ Sort by updatedAt (ASC/DESC)
- ✅ Default sort (date DESC)
- ✅ Invalid sortBy value returns validation error

### 8. Search Receipts

**Objective:** Test search functionality

```bash
# Search by merchant name
curl -X GET "http://localhost:3000/api/v1/receipts?search=walmart" \
  -H "Authorization: Bearer <valid-token>"

# Search by tag
curl -X GET "http://localhost:3000/api/v1/receipts?search=groceries" \
  -H "Authorization: Bearer <valid-token>"
```

**Test Cases:**
- ✅ Search matches merchant name (case-insensitive)
- ✅ Search matches tags (case-insensitive)
- ✅ Search returns receipts containing search term
- ✅ Empty search term returns all receipts
- ✅ Search combined with other filters

### 9. Update Receipt

**Objective:** Test partial update of receipt fields

```bash
# Update merchant and total
curl -X PATCH http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "Updated Store Name",
    "total": 150.00
  }'

# Update tags only
curl -X PATCH http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["updated", "tags"]
  }'

# Update category
curl -X PATCH http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Office Supplies"
  }'
```

**Expected Response:**
- Status: 200 OK
- Updated receipt with new values
- `updatedAt` timestamp changed
- Other fields unchanged

**Test Cases:**
- ✅ Update single field
- ✅ Update multiple fields
- ✅ Validation for invalid values
- ✅ 404 error for non-existent receipt
- ✅ 403 error for another user's receipt
- ✅ 400 error when no fields provided
- ✅ Cannot update read-only fields (id, userId, createdAt)

### 10. Soft Delete Receipt

**Objective:** Test soft delete functionality

```bash
# Delete receipt
curl -X DELETE http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <valid-token>"

# Try to get deleted receipt
curl -X GET http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <valid-token>"
# Expected: 404 Not Found

# Verify deleted receipt not in list
curl -X GET http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>"
# Expected: Deleted receipt not in results
```

**Expected Response:**
- Status: 200 OK
- Success message
- Receipt marked with `deletedAt` timestamp in database
- Receipt excluded from future queries

**Test Cases:**
- ✅ Successful soft delete
- ✅ Deleted receipt not accessible via GET
- ✅ Deleted receipt not in list results
- ✅ 404 error for non-existent receipt
- ✅ 403 error for another user's receipt
- ✅ 400 error when trying to delete already deleted receipt

### 11. Receipt Statistics

**Objective:** Test statistics aggregation

```bash
# Overall statistics
curl -X GET http://localhost:3000/api/v1/receipts/stats \
  -H "Authorization: Bearer <valid-token>"

# Statistics by category
curl -X GET "http://localhost:3000/api/v1/receipts/stats?groupBy=category" \
  -H "Authorization: Bearer <valid-token>"

# Statistics by month
curl -X GET "http://localhost:3000/api/v1/receipts/stats?groupBy=month" \
  -H "Authorization: Bearer <valid-token>"

# Statistics with date range
curl -X GET "http://localhost:3000/api/v1/receipts/stats?startDate=2024-01-01&endDate=2024-12-31&groupBy=category" \
  -H "Authorization: Bearer <valid-token>"
```

**Expected Response:**
- Status: 200 OK
- Overall: `{ totalAmount, count }`
- By category: includes `byCategory` object with amounts per category
- By month: includes `byPeriod` object with amounts per month (YYYY-MM format)
- Soft-deleted receipts excluded from calculations

**Test Cases:**
- ✅ Overall statistics (total amount and count)
- ✅ Statistics grouped by category
- ✅ Statistics grouped by month
- ✅ Statistics with date range filter
- ✅ Statistics exclude soft-deleted receipts
- ✅ Empty statistics when no receipts
- ✅ Invalid groupBy value returns validation error

### 12. Rate Limiting

**Objective:** Test rate limiting enforcement

```bash
# Send 11 requests quickly (rate limit is 10/minute)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/v1/receipts \
    -H "Authorization: Bearer <valid-token>" \
    -H "Content-Type: application/json" \
    -d '{...}'
done
```

**Expected Response:**
- First 10 requests succeed
- 11th request returns 429 Too Many Requests
- Rate limit resets after 1 minute

**Test Cases:**
- ✅ Rate limit enforced (10 requests per minute)
- ✅ Rate limit per user (different users have separate limits)
- ✅ Rate limit resets after time window
- ✅ GET single receipt not rate-limited

### 13. Authorization Tests

**Objective:** Verify users can only access their own receipts

```bash
# Create receipt as User A
curl -X POST http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <user-a-token>" \
  -d '{...}'
# Note the receipt ID

# Try to access as User B - should fail
curl -X GET http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <user-b-token>"
# Expected: 403 Forbidden

# Try to update as User B - should fail
curl -X PATCH http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <user-b-token>" \
  -d '{...}'
# Expected: 403 Forbidden

# Try to delete as User B - should fail
curl -X DELETE http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <user-b-token>"
# Expected: 403 Forbidden
```

**Test Cases:**
- ✅ Users can only get their own receipts
- ✅ Users can only update their own receipts
- ✅ Users can only delete their own receipts
- ✅ Users only see their own receipts in list
- ✅ Statistics only include user's own receipts

### 14. Data Validation Tests

**Objective:** Test all validation rules

```bash
# Invalid merchant (too short)
curl -X POST http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>" \
  -d '{ "merchant": "", ... }'
# Expected: 400 Validation error

# Invalid total (negative)
curl -X POST http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>" \
  -d '{ "total": -10, ... }'
# Expected: 400 Validation error

# Invalid currency
curl -X POST http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>" \
  -d '{ "currency": "INVALID", ... }'
# Expected: 400 Validation error

# Too many tags
curl -X POST http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>" \
  -d '{ "tags": ["tag1", "tag2", ... "tag21"], ... }'
# Expected: 400 Validation error

# Invalid query parameters
curl -X GET "http://localhost:3000/api/v1/receipts?limit=200" \
  -H "Authorization: Bearer <valid-token>"
# Expected: 400 Validation error (max 100)
```

**Test Cases:**
- ✅ All required fields validated
- ✅ String length constraints enforced
- ✅ Number range constraints enforced
- ✅ Enum values validated
- ✅ Array size limits enforced
- ✅ Date format validated
- ✅ URL format validated (imageUrl)

### 15. Edge Cases

**Objective:** Test edge cases and boundary conditions

```bash
# Create receipt with minimal data
curl -X POST http://localhost:3000/api/v1/receipts \
  -H "Authorization: Bearer <valid-token>" \
  -d '{
    "merchant": "A",
    "date": "2024-01-15T00:00:00.000Z",
    "total": 0,
    "currency": "USD",
    "category": "Other"
  }'

# List with limit=1
curl -X GET "http://localhost:3000/api/v1/receipts?limit=1" \
  -H "Authorization: Bearer <valid-token>"

# Search with empty string
curl -X GET "http://localhost:3000/api/v1/receipts?search=" \
  -H "Authorization: Bearer <valid-token>"

# Update with empty object
curl -X PATCH http://localhost:3000/api/v1/receipts/<receipt-id> \
  -H "Authorization: Bearer <valid-token>" \
  -d '{}'
# Expected: 400 error (at least one field required)
```

**Test Cases:**
- ✅ Minimal valid receipt
- ✅ Maximum valid values (200 char merchant, 100 lineItems, etc.)
- ✅ Pagination with limit=1
- ✅ Empty search returns all
- ✅ Date boundary values (very old, future dates)
- ✅ Special characters in merchant name
- ✅ Unicode in text fields

## Performance Tests

### 1. Pagination Performance

Create 1000 receipts and test pagination:
- First page should be fast (< 500ms)
- Subsequent pages should be equally fast
- Cursor-based pagination should maintain constant speed

### 2. Filtering Performance

Test with 1000 receipts:
- Category filter should use index (< 300ms)
- Date range filter should use index (< 300ms)
- Multiple filters should be efficient (< 500ms)

### 3. Statistics Performance

Test with 1000 receipts:
- Overall stats (< 500ms)
- Stats by category (< 1s)
- Stats by month (< 1s)

## Security Checklist

- ✅ All endpoints require authentication
- ✅ Users can only access their own data
- ✅ Input validation prevents injection attacks
- ✅ Rate limiting prevents abuse
- ✅ Soft delete preserves data integrity
- ✅ Error messages don't leak sensitive information
- ✅ Authorization checked on every request

## Firestore Index Verification

Verify all required indexes are deployed:

```bash
firebase deploy --only firestore:indexes
```

Required indexes:
1. userId + deletedAt + date (ASC/DESC)
2. userId + deletedAt + category + date
3. userId + deletedAt + merchant (ASC/DESC)
4. userId + deletedAt + status + updatedAt
5. userId + deletedAt + createdAt
6. userId + deletedAt + total (ASC/DESC)
7. userId + deletedAt + tags (CONTAINS) + date

## Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| Authentication required | ✅/❌ | |
| Create receipt | ✅/❌ | |
| Get receipt by ID | ✅/❌ | |
| List receipts | ✅/❌ | |
| Pagination | ✅/❌ | |
| Filtering | ✅/❌ | |
| Sorting | ✅/❌ | |
| Search | ✅/❌ | |
| Update receipt | ✅/❌ | |
| Soft delete | ✅/❌ | |
| Statistics | ✅/❌ | |
| Rate limiting | ✅/❌ | |
| Authorization | ✅/❌ | |
| Data validation | ✅/❌ | |
| Edge cases | ✅/❌ | |

## Automated Testing

For automated testing, consider:
1. Unit tests for service layer
2. Integration tests for repository layer
3. E2E tests for API endpoints
4. Load tests for performance validation

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check Firebase token validity
2. **403 Forbidden**: Verify receipt ownership
3. **404 Not Found**: Check receipt ID or soft delete status
4. **429 Rate Limit**: Wait 1 minute or use different user
5. **500 Server Error**: Check logs for details

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

Check logs in console for detailed error information.
