# ReceiptScan Backend API

AI-powered receipt scanning and expense tracking API for receiptscan.ai

## 🚀 Features

- **Complete REST API** with comprehensive Swagger/OpenAPI documentation
- **Authentication & Authorization** with JWT tokens
- **Receipt Management** - Full CRUD operations with OCR support
- **File Upload** - Multi-part form data support for receipt images
- **Analytics & Reporting** - Expense summaries, trends, and insights
- **Data Export** - CSV, PDF, Excel, JSON, and QuickBooks formats
- **Subscription Management** - Multiple pricing tiers
- **Rate Limiting** - Configurable per endpoint
- **Error Handling** - Standardized error responses

## 📚 API Documentation

The complete API documentation is available via Swagger UI at:

**Local Development:** http://localhost:3000/api/docs

**OpenAPI Spec:** http://localhost:3000/api/docs/swagger.json

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

#### Receipts
- `GET /api/receipts` - List all receipts (with filtering & pagination)
- `POST /api/receipts` - Create new receipt
- `GET /api/receipts/:id` - Get receipt by ID
- `PUT /api/receipts/:id` - Update receipt
- `DELETE /api/receipts/:id` - Delete receipt

#### File Upload
- `POST /api/upload/receipt` - Upload receipt image with OCR
- `POST /api/upload/receipts/batch` - Batch upload multiple receipts
- `POST /api/upload/receipts/:id/attachment` - Add attachment to receipt

#### Billing
- `GET /api/billing/plans` - Get subscription plans
- `GET /api/billing/subscription` - Get current subscription
- `POST /api/billing/subscribe` - Subscribe to plan
- `POST /api/billing/subscription/cancel` - Cancel subscription
- `GET /api/billing/invoices` - Get billing history

#### Analytics
- `GET /api/analytics/summary` - Get expense summary
- `GET /api/analytics/by-category` - Get expenses by category
- `GET /api/analytics/by-date` - Get expenses by date range
- `GET /api/analytics/trends` - Get spending trends

#### Export
- `GET /api/export/csv` - Export receipts as CSV
- `GET /api/export/pdf` - Export receipts as PDF
- `GET /api/export/excel` - Export receipts as Excel
- `GET /api/export/json` - Export receipts as JSON
- `POST /api/export/quickbooks` - Export to QuickBooks format

## 🛠️ Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/guilhermomg/receiptscan-backend.git
cd receiptscan-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## 🔐 Authentication

The API uses JWT Bearer tokens for authentication. To authenticate:

1. Register or login to get access tokens
2. Include the token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

In Swagger UI, click the **Authorize** button and enter your token.

## 📊 Rate Limiting

Rate limits are applied per endpoint:
- Authentication endpoints: 10-50 requests/minute
- Receipt operations: 50-100 requests/minute
- File uploads: 10-30 requests/minute
- Analytics: 50 requests/minute
- Exports: 10-30 requests/minute

## 🗂️ Project Structure

```
receiptscan-backend/
├── src/
│   ├── config/
│   │   └── swagger.js          # Swagger/OpenAPI configuration
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── receipts.js          # Receipt CRUD routes
│   │   ├── upload.js            # File upload routes
│   │   ├── billing.js           # Subscription routes
│   │   ├── analytics.js         # Analytics routes
│   │   └── export.js            # Export routes
│   ├── middleware/              # Custom middleware
│   ├── models/                  # Data models
│   ├── utils/                   # Utility functions
│   └── server.js                # Main application entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing with Swagger UI

1. Navigate to http://localhost:3000/api/docs
2. Click **Authorize** button
3. Enter your Bearer token: `Bearer <token>`
4. Try out any endpoint using the **Try it out** button
5. View request/response examples and schemas

## 📝 API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "details": { ... }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📧 Support

For support, email support@receiptscan.ai or visit https://receiptscan.ai

---

Made with ❤️ by the ReceiptScan team
