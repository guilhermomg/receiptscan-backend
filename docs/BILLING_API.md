# Billing API Documentation

This document describes the Stripe billing integration endpoints for the receiptscan-backend API.

## Base URL

```
https://api.receiptscan.ai/api/v1/billing
```

## Authentication

All billing endpoints (except webhooks) require Firebase authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

---

## Endpoints

### POST /create-checkout

Create a Stripe checkout session for Pro subscription signup.

**Authentication:** Required

**Request:**
```http
POST /api/v1/billing/create-checkout
Authorization: Bearer <firebase-id-token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `503 Service Unavailable` - Billing service not configured
- `500 Internal Server Error` - Failed to create checkout session

**Usage:**
```bash
curl -X POST https://api.receiptscan.ai/api/v1/billing/create-checkout \
  -H "Authorization: Bearer <firebase-id-token>"
```

---

### POST /create-portal

Create a Stripe customer portal session for subscription management (cancel, update payment method, view invoices).

**Authentication:** Required

**Request:**
```http
POST /api/v1/billing/create-portal
Authorization: Bearer <firebase-id-token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "portalUrl": "https://billing.stripe.com/p/session/test_..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `400 Bad Request` - No Stripe customer found for this user
- `404 Not Found` - User not found
- `503 Service Unavailable` - Billing service not configured
- `500 Internal Server Error` - Failed to create portal session

**Usage:**
```bash
curl -X POST https://api.receiptscan.ai/api/v1/billing/create-portal \
  -H "Authorization: Bearer <firebase-id-token>"
```

---

### GET /subscription

Get current user's subscription details, including tier, status, usage, and limits.

**Authentication:** Required

**Request:**
```http
GET /api/v1/billing/subscription
Authorization: Bearer <firebase-id-token>
```

**Response (200 OK):**
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

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tier` | string | Subscription tier: `free` or `pro` |
| `status` | string | Subscription status: `active`, `canceled`, `past_due`, `trialing`, `unpaid`, `incomplete` |
| `currentPeriodEnd` | string (ISO 8601) | End date of current billing period (null for free tier) |
| `receiptUsageThisMonth` | number | Number of receipts processed this billing period |
| `receiptLimit` | number or null | Monthly receipt limit (10 for free, null for pro/unlimited) |

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Failed to retrieve subscription

**Usage:**
```bash
curl -X GET https://api.receiptscan.ai/api/v1/billing/subscription \
  -H "Authorization: Bearer <firebase-id-token>"
```

---

### POST /webhook

Stripe webhook endpoint for processing subscription events. This endpoint is public but secured with Stripe webhook signature verification.

**Authentication:** Not required (verified by Stripe signature)

**Request:**
```http
POST /api/v1/billing/webhook
Content-Type: application/json
Stripe-Signature: t=...,v1=...,v0=...

{
  "id": "evt_...",
  "type": "customer.subscription.updated",
  "data": { ... }
}
```

**Response (200 OK):**
```json
{
  "received": true
}
```

**Handled Event Types:**

| Event | Description |
|-------|-------------|
| `checkout.session.completed` | User completed checkout - activates Pro subscription |
| `customer.subscription.updated` | Subscription status changed - updates user tier and status |
| `customer.subscription.deleted` | Subscription canceled - downgrades to Free tier |
| `invoice.payment_succeeded` | Payment received - resets monthly usage counter |
| `invoice.payment_failed` | Payment failed - marks subscription as past_due |

**Error Responses:**
- `400 Bad Request` - Missing Stripe signature or invalid webhook payload
- `503 Service Unavailable` - Webhook secret not configured
- `500 Internal Server Error` - Error processing webhook

**Webhook Setup:**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/v1/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable

---

## Subscription Tiers

### Free Tier
- **Price:** $0/month
- **Receipt Limit:** 10 receipts/month
- **Features:** Basic receipt scanning and expense tracking
- **Usage Reset:** Monthly, on the anniversary of account creation

### Pro Tier
- **Price:** $9/month
- **Receipt Limit:** Unlimited
- **Features:** 
  - Unlimited receipt scanning
  - All Free tier features
  - Priority support
- **Billing Cycle:** Monthly subscription
- **Usage Reset:** Monthly, on subscription renewal date

---

## Subscription Workflows

### Upgrading to Pro

1. User calls `POST /create-checkout`
2. Frontend redirects user to `checkoutUrl`
3. User completes payment on Stripe Checkout
4. Stripe sends `checkout.session.completed` webhook
5. Backend activates Pro subscription and resets usage counter
6. User redirected to `FRONTEND_URL/billing/success`

### Managing Subscription

1. User calls `POST /create-portal`
2. Frontend redirects user to `portalUrl`
3. User can:
   - Cancel subscription
   - Update payment method
   - View billing history
   - Download invoices
4. Changes trigger webhooks that update backend

### Subscription Cancellation

1. User cancels via Stripe portal or subscription expires
2. Stripe sends `customer.subscription.deleted` webhook
3. Backend downgrades user to Free tier
4. User can still use Free tier features (10 receipts/month)

### Failed Payment

1. Payment fails due to expired card or insufficient funds
2. Stripe sends `invoice.payment_failed` webhook
3. Backend marks subscription as `past_due`
4. User receives grace period (configured in Stripe)
5. If payment succeeds during grace period, subscription continues
6. If grace period expires, subscription is canceled

---

## Usage Limit Enforcement

The API enforces subscription limits on receipt upload endpoints:

### Free Tier Limits

- **Endpoint:** `POST /api/v1/receipts/upload`
- **Limit:** 10 receipts per month
- **Reset:** Monthly on usage period start date
- **Exceeded Response:**
  ```json
  {
    "status": "error",
    "message": "Free tier limit of 10 receipts per month reached. Upgrade to Pro for unlimited access."
  }
  ```
- **HTTP Status:** `403 Forbidden`

### Pro Tier

- No limits on receipt uploads
- Unlimited access to all features

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters or missing required fields |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Subscription limit reached or insufficient permissions |
| 404 | Not Found - Resource not found (user, subscription, etc.) |
| 500 | Internal Server Error - Server-side error |
| 503 | Service Unavailable - Billing service not configured |

---

## Security

### Webhook Signature Verification

All webhook requests are verified using Stripe's signature verification:

1. Webhook payload is received with `Stripe-Signature` header
2. Backend validates signature using `STRIPE_WEBHOOK_SECRET`
3. Only verified webhooks are processed
4. Invalid signatures are rejected with 400 error

### Idempotency

- Stripe webhooks may be delivered multiple times
- Webhook events are processed idempotently using event IDs
- Duplicate events are safely ignored

### Data Privacy

- Stripe customer IDs are stored in Firestore
- No payment card data is stored in the backend
- All payment data is handled by Stripe PCI-compliant infrastructure

---

## Testing

### Test Mode

Use Stripe test keys for development:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRO_PRICE_ID=price_test_...
```

### Test Cards

Use [Stripe test cards](https://stripe.com/docs/testing#cards):

- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Webhook Testing

Test webhooks locally using [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/billing/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

---

## Configuration

Required environment variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

# Frontend URL for redirects
FRONTEND_URL=https://your-frontend.com
```

---

## Support

For billing-related issues:
- Check subscription status with `GET /subscription`
- Review Stripe Dashboard for payment history
- Contact support with user ID and timestamp

For webhook issues:
- Verify webhook secret is correct
- Check Stripe Dashboard → Webhooks for delivery status
- Review application logs for error details
