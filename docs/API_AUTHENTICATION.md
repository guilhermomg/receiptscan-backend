# API Authentication Documentation

## Overview

ReceiptScan API uses Firebase Authentication for secure user identity management and JWT (JSON Web Token) based authentication for API access.

## Authentication Flow

### 1. User Registration/Sign-In (Client-Side)

Users authenticate through Firebase Authentication using one of the supported methods:

```typescript
// Example: Sign up with email/password (Firebase Client SDK)
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await createUserWithEmailAndPassword(
  auth,
  'user@example.com',
  'password123'
);

// Get the ID token
const idToken = await userCredential.user.getIdToken();
```

### 2. Token Usage

Include the Firebase ID token in the `Authorization` header for all API requests:

```http
GET /api/v1/receipts HTTP/1.1
Host: api.receiptscan.ai
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU...
Content-Type: application/json
```

### 3. Token Verification (Server-Side)

The backend verifies the token using Firebase Admin SDK:

```typescript
import { auth } from 'firebase-admin';

// In authentication middleware
const idToken = req.headers.authorization?.split('Bearer ')[1];
const decodedToken = await auth().verifyIdToken(idToken);
req.user = decodedToken; // Attach user to request
```

## Authentication Methods

### Email/Password Authentication

**Sign Up:**
```typescript
// Client-side
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Make API call to create user profile
await fetch('https://api.receiptscan.ai/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    displayName: 'John Doe'
  })
});
```

**Sign In:**
```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();
```

### Google OAuth Authentication

```typescript
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const auth = getAuth();
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const idToken = await result.user.getIdToken();
```

### Token Refresh

Firebase ID tokens expire after 1 hour. Refresh them automatically:

```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  // Force token refresh
  const idToken = await user.getIdToken(true);
  
  // Or get cached token (refreshes automatically if expired)
  const cachedToken = await user.getIdToken();
}
```

## API Endpoints

### Register User Profile

Create a user profile after Firebase authentication.

**Endpoint:** `POST /api/v1/auth/register`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "displayName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "uid": "abc123xyz",
  "email": "user@example.com",
  "displayName": "John Doe",
  "subscriptionTier": "free",
  "createdAt": "2025-12-30T10:00:00Z"
}
```

### Get Current User

Retrieve the authenticated user's profile.

**Endpoint:** `GET /api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response:** `200 OK`
```json
{
  "uid": "abc123xyz",
  "email": "user@example.com",
  "displayName": "John Doe",
  "subscriptionTier": "free",
  "createdAt": "2025-12-30T10:00:00Z",
  "updatedAt": "2025-12-30T10:00:00Z"
}
```

### Update User Profile

Update user profile information.

**Endpoint:** `PATCH /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "displayName": "John Smith"
}
```

**Response:** `200 OK`
```json
{
  "uid": "abc123xyz",
  "email": "user@example.com",
  "displayName": "John Smith",
  "subscriptionTier": "free",
  "updatedAt": "2025-12-30T11:00:00Z"
}
```

## Token Generation Examples

### Using Firebase Client SDK (Recommended)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Initialize Firebase
const app = initializeApp({
  apiKey: "AIza...",
  authDomain: "receiptscan-dev.firebaseapp.com",
  projectId: "receiptscan-dev",
});

const auth = getAuth(app);

// Sign in and get token
async function getIdToken() {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    'user@example.com',
    'password'
  );
  return await userCredential.user.getIdToken();
}

// Use token in API calls
const idToken = await getIdToken();
const response = await fetch('https://api.receiptscan.ai/api/v1/receipts', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

### Using Firebase Admin SDK (Server-to-Server)

```typescript
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

// Create custom token for a user
const uid = 'user123';
const customToken = await admin.auth().createCustomToken(uid);

// Client signs in with custom token and gets ID token
// const auth = getAuth();
// const userCredential = await signInWithCustomToken(auth, customToken);
// const idToken = await userCredential.user.getIdToken();
```

### Using cURL (for testing)

First, get a token using Firebase REST API:

```bash
# Sign in with email/password
curl -X POST \
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "returnSecureToken": true
  }'

# Response includes idToken
# {
#   "idToken": "eyJhbGc...",
#   "email": "user@example.com",
#   "refreshToken": "...",
#   "expiresIn": "3600",
#   "localId": "..."
# }

# Use the idToken in API calls
curl -X GET \
  'https://api.receiptscan.ai/api/v1/receipts' \
  -H 'Authorization: Bearer eyJhbGc...'
```

## Security Best Practices

### Token Storage

**Browser:**
- Store tokens in memory (React state, Vue data)
- Use httpOnly cookies for refresh tokens
- Never store tokens in localStorage (XSS vulnerable)

```typescript
// Good: Store in memory
const [idToken, setIdToken] = useState<string | null>(null);

// Bad: Don't store in localStorage
localStorage.setItem('idToken', token); // ❌ Vulnerable to XSS
```

**Mobile Apps:**
- Use secure storage (iOS Keychain, Android Keystore)
- Enable biometric authentication for sensitive operations

### Token Transmission

- Always use HTTPS for API calls
- Include token in `Authorization` header, not in URL
- Set appropriate CORS headers on server

```typescript
// Good
headers: {
  'Authorization': `Bearer ${idToken}`
}

// Bad: Don't put token in URL
const url = `https://api.receiptscan.ai/receipts?token=${idToken}`; // ❌
```

### Token Expiration Handling

Implement automatic token refresh:

```typescript
import { getAuth } from 'firebase/auth';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  // Get fresh token (automatically refreshes if expired)
  const idToken = await user.getIdToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${idToken}`,
    },
  });
}
```

### Error Handling

Handle authentication errors gracefully:

```typescript
async function apiCall() {
  try {
    const response = await fetchWithAuth('https://api.receiptscan.ai/api/v1/receipts');
    
    if (response.status === 401) {
      // Token expired or invalid
      // Redirect to login
      window.location.href = '/login';
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Common Error Responses

### 401 Unauthorized

**Cause:** Missing, invalid, or expired token

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid Firebase ID token."
  }
}
```

**Solution:** Get a new token and retry

### 403 Forbidden

**Cause:** Valid token but insufficient permissions

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource."
  }
}
```

**Solution:** Check user role and subscription tier

### Token Expired

Firebase tokens expire after 1 hour. The SDK automatically refreshes them:

```typescript
// Firebase SDK handles refresh automatically
const idToken = await user.getIdToken(); // Returns cached or fresh token

// Force refresh
const freshToken = await user.getIdToken(true);
```

## Testing Authentication

### Local Development

Use Firebase Emulator Suite for local testing:

```bash
# Install Firebase emulator
npm install -g firebase-tools

# Start emulator
firebase emulators:start --only auth

# Configure your app to use emulator
import { connectAuthEmulator } from 'firebase/auth';
const auth = getAuth();
connectAuthEmulator(auth, 'http://localhost:9099');
```

### Integration Tests

Mock Firebase Admin in tests:

```typescript
import { auth } from 'firebase-admin';

// Mock token verification
jest.spyOn(auth(), 'verifyIdToken').mockResolvedValue({
  uid: 'test-user-123',
  email: 'test@example.com',
  email_verified: true,
  auth_time: Date.now() / 1000,
  iat: Date.now() / 1000,
  exp: Date.now() / 1000 + 3600,
  firebase: {
    sign_in_provider: 'password',
    identities: {}
  }
} as any);
```

### Postman Collection

Import token generation in Postman:

1. Create a Pre-request Script:
```javascript
// Get token from Firebase Auth REST API
pm.sendRequest({
  url: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + pm.environment.get('FIREBASE_API_KEY'),
  method: 'POST',
  header: {
    'Content-Type': 'application/json'
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      email: pm.environment.get('TEST_EMAIL'),
      password: pm.environment.get('TEST_PASSWORD'),
      returnSecureToken: true
    })
  }
}, (err, res) => {
  const idToken = res.json().idToken;
  pm.environment.set('ID_TOKEN', idToken);
});
```

2. Add to Authorization header:
```
Authorization: Bearer {{ID_TOKEN}}
```

## Multi-Factor Authentication (Future)

Firebase supports MFA. To enable:

```typescript
// Client-side: Enroll user in MFA
import { multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator } from 'firebase/auth';

const user = auth.currentUser;
const session = await multiFactor(user).getSession();

const phoneAuthProvider = new PhoneAuthProvider(auth);
const verificationId = await phoneAuthProvider.verifyPhoneNumber(
  phoneNumber,
  session
);

// User enters SMS code
const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number');
```

## Rate Limiting

Authentication endpoints are rate-limited:

- **Login attempts**: 5 per minute per IP
- **Registration**: 10 per hour per IP
- **Token refresh**: No limit (handled by Firebase)

Exceeded rate limits return `429 Too Many Requests`:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [JWT.io - Decode and verify tokens](https://jwt.io/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

**Last Updated**: December 2025
**Version**: 1.0
