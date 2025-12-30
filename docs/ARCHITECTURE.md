# Architecture Documentation

## System Architecture Overview

ReceiptScan Backend is a cloud-native API service built on Node.js/TypeScript that provides AI-powered receipt scanning and expense tracking capabilities.

## High-Level Architecture

```
┌─────────────────┐
│  Client Apps    │
│ (Web/Mobile)    │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────────────────────────────┐
│         API Gateway / Load Balancer      │
│         (Firebase Hosting / Cloud Run)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Express.js API Server               │
│  ┌────────────────────────────────────┐ │
│  │  Controllers (Request Handlers)    │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│  ┌──────────────▼─────────────────────┐ │
│  │  Middleware (Auth, Validation)     │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│  ┌──────────────▼─────────────────────┐ │
│  │  Services (Business Logic)         │ │
│  │  - Receipt Service                 │ │
│  │  - AI Parser Service               │ │
│  │  - Storage Service                 │ │
│  │  - Billing Service                 │ │
│  └──────────────┬─────────────────────┘ │
│                 │                        │
│  ┌──────────────▼─────────────────────┐ │
│  │  Repositories (Data Access)        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐ ┌──────────┐ ┌────────────┐
│  Firebase   │ │ Cloud    │ │  External  │
│  Firestore  │ │ Storage  │ │  APIs      │
│             │ │          │ │            │
│  - Users    │ │ - Images │ │ - OpenAI   │
│  - Receipts │ │ - PDFs   │ │ - Stripe   │
│  - Logs     │ │          │ │            │
└─────────────┘ └──────────┘ └────────────┘
```

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+ (LTS)
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Cloud Platform**: Google Cloud Platform (Firebase)

### Key Dependencies
- **Database**: Firebase Firestore (NoSQL document database)
- **Storage**: Firebase Cloud Storage
- **Authentication**: Firebase Authentication
- **AI/ML**: OpenAI GPT-4 Vision API
- **Payments**: Stripe API
- **Logging**: Winston

### Development Tools
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions

## Layered Architecture

The application follows a clean, layered architecture pattern:

### 1. Controller Layer
**Responsibility**: Handle HTTP requests and responses
- Parse request parameters, query strings, and body
- Validate request data
- Call appropriate service methods
- Format responses
- Handle HTTP status codes

```typescript
// Example: receipt-controller.ts
export class ReceiptController {
  async createReceipt(req: Request, res: Response) {
    const userId = req.user.uid;
    const receiptData = req.body;
    const result = await receiptService.create(userId, receiptData);
    res.status(201).json(result);
  }
}
```

### 2. Middleware Layer
**Responsibility**: Cross-cutting concerns
- Authentication (Firebase token verification)
- Authorization (check user permissions)
- Request validation (Joi/Zod schemas)
- Rate limiting
- Error handling
- Logging
- Security headers

### 3. Service Layer
**Responsibility**: Business logic and orchestration
- Implement business rules
- Coordinate between repositories
- Call external APIs
- Handle complex workflows
- Transaction management

```typescript
// Example: receipt-service.ts
export class ReceiptService {
  async parseAndStore(userId: string, imageUrl: string) {
    // Business logic orchestration
    const parsedData = await aiParserService.parse(imageUrl);
    const receipt = await receiptRepository.create(userId, parsedData);
    await auditLogService.log('receipt_created', userId);
    return receipt;
  }
}
```

### 4. Repository Layer
**Responsibility**: Data access and persistence
- CRUD operations
- Query building
- Data mapping
- Transaction handling
- Cache management

```typescript
// Example: receipt-repository.ts
export class ReceiptRepository {
  async findByUserId(userId: string, limit: number) {
    return await db.collection('receipts')
      .where('userId', '==', userId)
      .limit(limit)
      .get();
  }
}
```

## Data Flow

### Receipt Upload Flow
```
1. Client → POST /api/v1/receipts/upload (with image file)
2. Controller → Validates file type and size
3. Middleware → Verifies authentication token
4. Service → Uploads file to Cloud Storage
5. Service → Generates signed URL
6. Service → Calls OpenAI API to parse receipt
7. Service → Creates receipt record in Firestore
8. Repository → Saves data to database
9. Service → Returns receipt object to client
10. Client ← 201 Created with receipt data
```

### Authentication Flow
```
1. Client → Firebase Auth (sign in/sign up)
2. Client receives Firebase ID token
3. Client → API with Authorization: Bearer <token>
4. Middleware → Verifies token with Firebase Admin SDK
5. Middleware → Extracts user info and adds to request
6. Controller → Access user via req.user
```

## Data Models

### User Model
```typescript
interface User {
  uid: string;              // Firebase user ID
  email: string;
  displayName: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionId?: string;  // Stripe subscription ID
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Receipt Model
```typescript
interface Receipt {
  id: string;
  userId: string;
  merchant: string;
  date: Date;
  total: number;
  tax: number;
  currency: string;         // ISO 4217 (USD, EUR, BRL)
  category: string;
  tags: string[];
  lineItems: LineItem[];
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;       // AI confidence score 0-1
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;         // Soft delete
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}
```

## External Service Integration

### OpenAI Integration
- **Purpose**: Extract structured data from receipt images
- **API**: GPT-4 Vision API
- **Cost**: ~$0.002-0.01 per receipt
- **Fallback**: Google Cloud Vision API
- **Rate Limiting**: Handle 429 errors with exponential backoff

### Stripe Integration
- **Purpose**: Subscription billing and payment processing
- **Webhook Events**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **Security**: Webhook signature verification required

### Firebase Services
- **Firestore**: Primary database
- **Cloud Storage**: File storage with signed URLs
- **Authentication**: User identity and token management
- **Cloud Functions**: Background jobs (optional)

## Security Architecture

### Authentication
- Firebase Authentication for user identity
- JWT tokens verified on every request
- Token expiration: 1 hour (refresh on client)

### Authorization
- Row-level security: Users can only access their own data
- Middleware checks userId matches request.user.uid

### Data Protection
- HTTPS enforced for all API endpoints
- Security headers (Helmet.js)
- CORS configured for trusted origins only
- Input validation and sanitization
- Rate limiting per IP and per user

### Secrets Management
- Environment variables for sensitive config
- Firebase Functions config for cloud secrets
- No secrets committed to source control

## Scalability Considerations

### Horizontal Scaling
- Stateless API design (no session storage)
- Can run multiple instances behind load balancer
- Cloud Run auto-scaling based on request volume

### Database Scaling
- Firestore handles scaling automatically
- Composite indexes for complex queries
- Pagination for large result sets
- Cache frequently accessed data

### File Storage Scaling
- Cloud Storage designed for unlimited scale
- Use signed URLs for direct client uploads
- Implement file size limits (10MB)

### Background Jobs
- Use Firebase Functions or Cloud Tasks for async processing
- Job queue for AI parsing to handle spikes
- Retry logic with exponential backoff

## Monitoring & Observability

### Logging
- Structured JSON logs (Winston)
- Log levels: error, warn, info, http, debug
- Request ID tracking for tracing
- Separate audit logs for sensitive operations

### Metrics
- Firebase Performance Monitoring
- Custom metrics for business KPIs:
  - Receipts processed per day
  - AI parsing success rate
  - API response times
  - Error rates

### Alerting
- Firebase Alerts for critical errors
- Cloud Monitoring for infrastructure alerts
- PagerDuty integration (optional)

## Deployment Architecture

### Environments
- **Development**: `receiptscan-dev` (Firebase project)
- **Testing**: `receiptscan-test` (Firebase project)
- **Production**: `receiptscan-prd` (Firebase project)

### Deployment Pipeline
```
1. Push to feature branch
2. GitHub Actions: Run tests, linting
3. Merge to main branch
4. GitHub Actions: Deploy to development
5. Manual approval for production
6. GitHub Actions: Deploy to production
```

### Rollback Strategy
- Keep previous Cloud Run revisions
- Traffic splitting for canary deployments
- Database migrations are backward compatible
- Quick rollback via Cloud Run console

## Architecture Decision Records (ADRs)

### ADR-001: Use Firebase as Backend Platform
**Status**: Accepted

**Context**: Need a scalable, managed backend platform with authentication, database, and storage.

**Decision**: Use Firebase/Google Cloud Platform as primary backend.

**Consequences**:
- ✅ Reduced operational overhead
- ✅ Built-in authentication
- ✅ Automatic scaling
- ✅ Fast development
- ⚠️ Vendor lock-in to Google Cloud
- ⚠️ Learning curve for Firebase specifics

---

### ADR-002: Use TypeScript for Type Safety
**Status**: Accepted

**Context**: Need to reduce runtime errors and improve code maintainability.

**Decision**: Use TypeScript with strict mode enabled.

**Consequences**:
- ✅ Better IDE support and autocomplete
- ✅ Catch errors at compile time
- ✅ Improved code documentation
- ✅ Easier refactoring
- ⚠️ Additional build step required
- ⚠️ Some learning curve for team

---

### ADR-003: Use OpenAI GPT-4 Vision for Receipt Parsing
**Status**: Accepted

**Context**: Need to extract structured data from receipt images with high accuracy.

**Decision**: Use OpenAI GPT-4 Vision API as primary parsing engine with Google Cloud Vision as fallback.

**Consequences**:
- ✅ High accuracy on complex receipts
- ✅ Understands context and layout
- ✅ Handles multiple languages
- ⚠️ Cost per request ($0.002-0.01)
- ⚠️ API rate limits
- ⚠️ Requires internet connectivity
- ✅ Fallback option available

---

### ADR-004: Use Layered Architecture Pattern
**Status**: Accepted

**Context**: Need a maintainable, testable code structure.

**Decision**: Implement layered architecture with Controllers, Services, and Repositories.

**Consequences**:
- ✅ Clear separation of concerns
- ✅ Easy to test (can mock layers)
- ✅ Follows industry best practices
- ✅ Easier to onboard new developers
- ⚠️ More files and boilerplate
- ⚠️ Can be overkill for simple operations

---

### ADR-005: Use Stripe for Subscription Billing
**Status**: Accepted

**Context**: Need to monetize the service with subscription-based pricing.

**Decision**: Use Stripe for payment processing and subscription management.

**Consequences**:
- ✅ Industry-standard payment platform
- ✅ Excellent documentation and SDKs
- ✅ Built-in fraud protection
- ✅ Handles PCI compliance
- ✅ Flexible pricing models
- ⚠️ Transaction fees (2.9% + $0.30)
- ⚠️ Webhook setup required

---

### ADR-006: Use Jest for Testing Framework
**Status**: Accepted

**Context**: Need comprehensive testing with good TypeScript support.

**Decision**: Use Jest with ts-jest for unit and integration testing.

**Consequences**:
- ✅ Excellent TypeScript support
- ✅ Built-in mocking capabilities
- ✅ Code coverage reporting
- ✅ Fast test execution
- ✅ Large community and ecosystem
- ⚠️ Configuration can be complex

## Future Considerations

### Potential Improvements
1. **GraphQL API**: Consider GraphQL for more flexible queries
2. **Microservices**: Split into separate services as complexity grows
3. **Event-Driven Architecture**: Use Pub/Sub for async operations
4. **ML Model**: Train custom receipt parsing model
5. **Multi-region**: Deploy to multiple regions for low latency
6. **Caching Layer**: Add Redis for improved performance
7. **API Gateway**: Use Apigee or Kong for advanced API management

### Technical Debt Considerations
- Monitor third-party API costs
- Review Firebase pricing as scale increases
- Consider migration path if vendor lock-in becomes concern
- Plan for eventual data archival strategy

---

**Last Updated**: December 2025
**Version**: 1.0
