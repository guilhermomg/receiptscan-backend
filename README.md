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
3. **Models**: Define data structures
4. **Middleware**: Process requests before reaching controllers

This separation ensures:
- Clear separation of concerns
- Easy testing and maintenance
- Scalable codebase

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

