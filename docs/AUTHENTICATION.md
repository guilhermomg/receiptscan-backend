# Authentication Flow Documentation

## Overview
The receiptscan-backend API uses Firebase Authentication for secure user authentication and authorization. Firebase ID tokens are verified on the server-side using the Firebase Admin SDK.

## Authentication Architecture

### Components
1. **Firebase Admin SDK** - Server-side token verification
2. **Authentication Middleware** - Validates Firebase ID tokens and attaches user context
3. **RBAC Middleware** - Enforces role-based and subscription-based access control
4. **User Service** - Manages user profiles in Firestore
5. **Auth Controller** - Handles authentication endpoints

### User Profile Storage
User profiles are stored in Firestore under the `users/{userId}` collection with the following schema:

```typescript
{
  userId: string;           // Firebase Auth UID
  email: string;            // User email
  displayName?: string;     // Display name (optional)
  role: 'user' | 'admin';   // User role for RBAC
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  createdAt: Date;          // Profile creation timestamp
  updatedAt: Date;          // Last update timestamp
}
```

## Authentication Flow

### 1. User Registration/Login (Client-Side)
```
Client App → Firebase Auth SDK → Firebase Auth Service
```
- User authenticates with Firebase (email/password, Google, etc.)
- Firebase returns an ID token
- Client stores the token and includes it in API requests

### 2. API Request Authentication (Server-Side)
```
Client Request → Auth Middleware → User Profile Service → Protected Route
```

#### Step-by-step:
1. Client sends request with `Authorization: Bearer <firebase-id-token>` header
2. Auth middleware extracts and verifies the token with Firebase Admin SDK
3. If token is valid, middleware retrieves or creates user profile from Firestore
4. User context is attached to the request object
5. Request proceeds to the protected route

### 3. Authorization Check (RBAC)
```
Protected Route → RBAC Middleware → Business Logic
```
- RBAC middleware checks user role/subscription tier
- If authorized, request proceeds
- If unauthorized, returns 403 Forbidden

## API Endpoints

### POST /api/v1/auth/register
Register a new user profile (requires valid Firebase token).

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "displayName": "John Doe"  // optional
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "userId": "firebase-uid-123",
      "email": "john@example.com",
      "displayName": "John Doe",
      "role": "user",
      "subscriptionTier": "free",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `409 Conflict` - User already registered

### GET /api/v1/auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "userId": "firebase-uid-123",
      "email": "john@example.com",
      "displayName": "John Doe",
      "role": "user",
      "subscriptionTier": "free",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User profile not found

### PATCH /api/v1/auth/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "displayName": "John Smith",           // optional
  "subscriptionTier": "premium"          // optional
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "userId": "firebase-uid-123",
      "email": "john@example.com",
      "displayName": "John Smith",
      "role": "user",
      "subscriptionTier": "premium",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - No fields provided for update
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User profile not found

## Middleware Usage

### Authentication Middleware

#### Required Authentication
Requires a valid Firebase token. Returns 401 if not authenticated.

```typescript
import { authMiddleware } from './middleware/auth';

router.get('/protected', authMiddleware, controller.protectedRoute);
```

#### Optional Authentication
Attempts to authenticate but continues even if token is invalid/missing.

```typescript
import { optionalAuthMiddleware } from './middleware/auth';

router.get('/public-or-private', optionalAuthMiddleware, controller.route);
```

### RBAC Middleware

#### Role-Based Access
Restrict routes to specific roles:

```typescript
import { requireRole, requireAdmin } from './middleware/rbac';
import { UserRole } from './models/user.model';

// Admin only
router.delete('/users/:id', authMiddleware, requireAdmin, controller.deleteUser);

// Multiple roles
router.post('/reports', authMiddleware, requireRole(UserRole.ADMIN, UserRole.USER), controller.createReport);
```

#### Subscription-Based Access
Restrict routes to specific subscription tiers:

```typescript
import { requireSubscription } from './middleware/rbac';
import { SubscriptionTier } from './models/user.model';

// Premium or Enterprise only
router.post('/advanced-scan', 
  authMiddleware, 
  requireSubscription(SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE),
  controller.advancedScan
);
```

## Error Handling

All authentication errors follow a consistent format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

### Common Error Codes
- `401 Unauthorized` - Authentication required or token invalid
- `403 Forbidden` - Insufficient permissions (role/subscription)
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

## Security Best Practices

### Token Handling
- Always use HTTPS in production
- Never expose Firebase tokens in logs or error messages
- Tokens automatically expire (configurable in Firebase)
- Implement token refresh on the client-side

### Environment Variables
Store sensitive Firebase credentials securely:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your-private-key
```

### Private Key Format
The private key should include newline characters. In environment variables, use `\\n`:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"
```

## User Profile Lifecycle

### First Login
1. User authenticates with Firebase
2. Client receives Firebase ID token
3. Client calls `/api/v1/auth/register` or any protected endpoint
4. Server verifies token and creates user profile automatically
5. Default role: `user`, default tier: `free`

### Subsequent Requests
1. Client includes token in Authorization header
2. Server verifies token and loads existing profile
3. User context available in `req.user`

### Profile Updates
- Users can update their own `displayName`
- Subscription tier updates typically require admin approval or payment integration
- Role changes require admin access

## Testing Authentication

### Using cURL
```bash
# Get your Firebase ID token first (from client app or Firebase console)
TOKEN="your-firebase-id-token"

# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Test User"}'

# Get profile
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Update profile
curl -X PATCH http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Updated Name"}'
```

### Using Postman
1. Set up Authorization header: `Bearer <your-firebase-token>`
2. Make requests to protected endpoints
3. Verify user context in responses

## Integration with Client Apps

### Web (React/Vue/Angular)
```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const token = await user.getIdToken();
  
  const response = await fetch('/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

### Mobile (React Native/Flutter)
Similar pattern - get ID token from Firebase Auth and include in API requests.

## Troubleshooting

### Common Issues

**"No authorization token provided"**
- Ensure Authorization header is set
- Format: `Authorization: Bearer <token>`

**"Invalid or expired token"**
- Token has expired (refresh it)
- Token is malformed
- Firebase project mismatch

**"User profile not found"**
- First-time user needs to register
- Firestore connection issues

**"Firebase not initialized"**
- Check environment variables
- Verify Firebase credentials
- Check server logs for initialization errors
