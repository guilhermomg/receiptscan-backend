# receiptscan-backend

AI-powered receipt scanning and expense tracking API for receiptscan.ai

## 🚀 Features

- RESTful API built with Express.js and TypeScript
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

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/test/production) | development |
| `PORT` | Server port | 3000 |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |
| `API_PREFIX` | API route prefix | /api/v1 |

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

