# receiptscan-backend

AI-powered receipt scanning and expense tracking API for receiptscan.ai

## 🚀 Features

- RESTful API built with Express.js and TypeScript
- **Firebase Authentication with JWT token verification**
- **Role-Based Access Control (RBAC) for admin/user roles**
- **Subscription tier management for billing integration**
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

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/test/production) | development |
| `PORT` | Server port | 3000 |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |
| `API_PREFIX` | API route prefix | /api/v1 |
| `FIREBASE_PROJECT_ID` | Firebase project ID | - |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | - |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | - |

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

