# ReceiptScan Backend 🧾

[![CI](https://github.com/guilhermomg/receiptscan-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/guilhermomg/receiptscan-backend/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

AI-powered receipt scanning and expense tracking API for [receiptscan.ai](https://receiptscan.ai)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running Locally](#running-locally)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🌟 Overview

ReceiptScan Backend is a modern, cloud-native RESTful API built with Node.js and TypeScript that provides intelligent receipt scanning and expense tracking capabilities. The system leverages OpenAI's GPT-4 Vision API to extract structured data from receipt images and PDFs, stores data in Firebase Firestore, and integrates with Stripe for subscription billing.

### Key Capabilities

- 📸 **AI-Powered Receipt Parsing**: Extract merchant, date, total, line items, and more from receipt images
- 🔐 **Secure Authentication**: Firebase Authentication with JWT token verification
- 💳 **Subscription Billing**: Stripe integration with free and pro tiers
- 📊 **Expense Analytics**: Track spending by category, merchant, and time period
- 📤 **Export Functionality**: Export receipts to CSV and PDF formats
- 🔍 **Advanced Search**: Filter and search receipts with pagination support
- 🚀 **Scalable Architecture**: Cloud-native design ready for production scale

## ✨ Features

### Current Features

- ✅ Firebase Authentication integration
- ✅ User profile management
- ✅ File upload to Cloud Storage
- ✅ AI-powered receipt parsing with OpenAI GPT-4 Vision
- ✅ Receipt CRUD operations with soft delete
- ✅ Search and filtering with pagination
- ✅ Subscription management with Stripe
- ✅ Usage tracking and tier limits
- ✅ Export to CSV and PDF
- ✅ Spending analytics and reporting
- ✅ Rate limiting and security headers
- ✅ Comprehensive test coverage
- ✅ CI/CD with GitHub Actions

### Upcoming Features

- 🔄 Webhook notifications for parsing completion
- 🌐 Multi-language support for receipts
- 📱 Mobile SDK for direct integration
- 🤖 Custom ML model for improved accuracy
- 🔔 Real-time notifications
- 📈 Advanced analytics dashboard

## 🏗 Architecture

ReceiptScan follows a clean, layered architecture pattern for maintainability and testability:

```
┌─────────────────────────────────────────┐
│           Client Applications           │
│         (Web, Mobile, Desktop)          │
└────────────────┬────────────────────────┘
                 │ HTTPS/REST API
                 ▼
┌─────────────────────────────────────────┐
│         Express.js API Server           │
│  ┌───────────────────────────────────┐  │
│  │  Controllers (HTTP Handlers)      │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  Services (Business Logic)        │  │
│  └────────────┬──────────────────────┘  │
│               │                          │
│  ┌────────────▼──────────────────────┐  │
│  │  Repositories (Data Access)       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │              │             │
         ▼              ▼             ▼
┌──────────────┐ ┌──────────┐ ┌────────────┐
│   Firebase   │ │  Cloud   │ │  External  │
│   Firestore  │ │  Storage │ │    APIs    │
│              │ │          │ │            │
│   - Users    │ │ - Images │ │ - OpenAI   │
│   - Receipts │ │ - PDFs   │ │ - Stripe   │
└──────────────┘ └──────────┘ └────────────┘
```

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🛠 Tech Stack

### Core Technologies

- **Runtime**: Node.js 18+ (LTS)
- **Language**: TypeScript 5.3
- **Framework**: Express.js 4.x
- **Database**: Firebase Firestore
- **Storage**: Firebase Cloud Storage
- **Authentication**: Firebase Authentication

### Key Integrations

- **AI/ML**: OpenAI GPT-4 Vision API
- **Payments**: Stripe API
- **Logging**: Winston
- **Validation**: Joi

### Development Tools

- **Testing**: Jest + ts-jest + Supertest
- **Linting**: ESLint
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **Firebase CLI**: For local emulator testing (optional)
  ```bash
  npm install -g firebase-tools
  ```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/guilhermomg/receiptscan-backend.git
   cd receiptscan-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Verify installation**

   ```bash
   npm run build
   ```

   This should compile TypeScript without errors.

### Configuration

1. **Copy environment template**

   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**

   Edit `.env` and set the following required variables:

   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Firebase
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_PATH=./serviceAccountKey.json
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

   # OpenAI
   OPENAI_API_KEY=sk-proj-your-api-key

   # Stripe
   STRIPE_SECRET_KEY=sk_test_your-secret-key
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

3. **Setup Firebase credentials**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Navigate to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `serviceAccountKey.json` in the project root

   **Important**: Never commit this file to version control!

4. **Get API keys**

   - **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Stripe**: Get test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

### Running Locally

1. **Start the development server**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000` with hot-reload enabled.

2. **Verify the server is running**

   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-12-30T10:00:00.000Z"
   }
   ```

3. **Optional: Use Firebase Emulator (for local testing)**

   ```bash
   # Start Firebase emulators
   firebase emulators:start

   # In another terminal, run the app
   npm run dev
   ```

   Configure your app to use emulators by setting environment variables:
   ```env
   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for CI/CD)
npm run test:ci
```

### Test Coverage

The project maintains a minimum of **70% test coverage** for all code, with higher coverage (90%+) for core business logic.

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Writing Tests

Tests are located in the `tests/` directory and use Jest with TypeScript support:

```typescript
// Example test
describe('ReceiptService', () => {
  it('should create a new receipt', async () => {
    const receipt = await receiptService.create(userId, receiptData);
    expect(receipt.id).toBeDefined();
    expect(receipt.userId).toBe(userId);
  });
});
```

For more testing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md#testing-standards).

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.receiptscan.ai/api/v1`

### Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | No |
| POST | `/auth/register` | Register user profile | Yes |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/receipts/upload` | Upload receipt image | Yes |
| POST | `/receipts/parse` | Parse receipt with AI | Yes |
| GET | `/receipts` | List user receipts | Yes |
| GET | `/receipts/:id` | Get receipt details | Yes |
| PATCH | `/receipts/:id` | Update receipt | Yes |
| DELETE | `/receipts/:id` | Delete receipt | Yes |
| GET | `/receipts/export` | Export receipts (CSV/PDF) | Yes |
| GET | `/receipts/analytics` | Get spending analytics | Yes |
| POST | `/billing/create-checkout` | Create Stripe checkout | Yes |
| GET | `/billing/subscription` | Get subscription status | Yes |

### Example API Call

```bash
# Get user receipts
curl -X GET \
  http://localhost:3000/api/v1/receipts \
  -H 'Authorization: Bearer <firebase-id-token>' \
  -H 'Content-Type: application/json'
```

For complete API documentation including request/response schemas, see the planned Swagger documentation at `/api/docs` (coming soon).

## 🔐 Authentication

ReceiptScan uses Firebase Authentication with JWT tokens. All protected endpoints require a valid Firebase ID token in the Authorization header.

### Quick Start

```typescript
// Client-side: Sign in and get token
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Make authenticated API call
const response = await fetch('https://api.receiptscan.ai/api/v1/receipts', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
```

For detailed authentication documentation, see [docs/API_AUTHENTICATION.md](docs/API_AUTHENTICATION.md).

## 📁 Project Structure

```
receiptscan-backend/
├── src/                      # Source code
│   ├── config/              # Configuration files
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   ├── models/              # Data models and interfaces
│   ├── services/            # Business logic
│   ├── repositories/        # Data access layer
│   ├── utils/               # Utility functions
│   └── index.ts            # Application entry point
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md     # Architecture details
│   └── API_AUTHENTICATION.md # Auth documentation
├── .github/                 # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── coverage/               # Test coverage reports
├── dist/                   # Compiled JavaScript (gitignored)
├── .env.example            # Environment variables template
├── .eslintrc.json         # ESLint configuration
├── .prettierrc.json       # Prettier configuration
├── jest.config.js         # Jest configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── CONTRIBUTING.md        # Contribution guidelines
├── TROUBLESHOOTING.md     # Common issues and solutions
└── README.md              # This file
```

## 💻 Development

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Check formatting
npm run format:check

# Auto-format code
npm run format
```

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and write tests
3. Run tests and linting: `npm test && npm run lint`
4. Commit with conventional commits: `git commit -m "feat: add new feature"`
5. Push and create a pull request

### Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 🚢 Deployment

### Environment Setup

The project supports three environments:

- **Development**: `receiptscan-dev` (auto-deploy on push to main)
- **Testing**: `receiptscan-test` (manual deployment)
- **Production**: `receiptscan-prd` (manual approval required)

### Building for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### CI/CD Pipeline

GitHub Actions automatically:
- Runs tests and linting on all PRs
- Enforces 70% code coverage minimum
- Fails PRs with test failures
- Deploys to development on merge to main

See `.github/workflows/ci.yml` for pipeline configuration.

### Deployment Checklist

- [ ] All tests pass locally
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] API keys rotated for production
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Code style standards
- Testing requirements
- Pull request process

## 🐛 Troubleshooting

Encountering issues? Check our [Troubleshooting Guide](TROUBLESHOOTING.md) for solutions to common problems:

- Installation issues
- Development server problems
- Testing failures
- Firebase configuration
- API errors
- Deployment issues

If you can't find a solution, please [open an issue](https://github.com/guilhermomg/receiptscan-backend/issues/new).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [OpenAI](https://openai.com/) - AI-powered receipt parsing
- [Stripe](https://stripe.com/) - Payment processing
- [Express.js](https://expressjs.com/) - Web framework

## 📞 Support

- **Email**: guilhermo@gonzalez.dev.br
- **Issues**: [GitHub Issues](https://github.com/guilhermomg/receiptscan-backend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/guilhermomg/receiptscan-backend/discussions)

---

**Made with ❤️ by the ReceiptScan Team**
