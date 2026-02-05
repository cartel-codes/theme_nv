# User Authentication Guide

Complete guide for the user authentication system, including signup, login, session management, and audit logging.

## Table of Contents

1. [Overview](#overview)
2. [User Model](#user-model)
3. [Authentication Functions](#authentication-functions)
4. [API Endpoints](#api-endpoints)
5. [Session Management](#session-management)
6. [Audit Logging](#audit-logging)
7. [Usage Examples](#usage-examples)
8. [Security Features](#security-features)

## Overview

The user authentication system provides:
- **User Registration**: Secure signup with email/password validation
- **User Login**: Email/password authentication with session creation
- **Session Management**: Multi-device session tracking and management
- **Audit Logging**: Complete audit trail of all authentication events
- **Security**: Password hashing, IP tracking, failed login detection

## User Model

### Database Schema

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String   // bcrypt hashed password
  firstName     String?
  lastName      String?
  avatar        String?
  phone         String?
  isActive      Boolean  @default(true)
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions  UserSession[]
  auditLogs UserAuditLog[]

  @@index([email])
}

model UserSession {
  id          String   @id @default(cuid())
  userId      String
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionToken String   @unique
  ip          String?
  userAgent   String?
  deviceName  String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  lastActivity DateTime @updatedAt

  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
}

model UserAuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  email     String?
  action    String   // LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, SIGNUP, PROFILE_UPDATE
  ip        String?
  userAgent String?
  status    String   // success, failed
  errorMessage String?
  metadata  String?  // JSON string for additional data
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([email])
  @@index([action])
  @@index([createdAt])
}
```

## Authentication Functions

### lib/user-auth.ts

#### Password Management

```typescript
// Hash a password using bcryptjs (10 salt rounds)
async function hashPassword(password: string): Promise<string>

// Compare plain password with hash
async function comparePassword(password: string, hash: string): Promise<boolean>
```

#### User Account Functions

```typescript
// Create a new user account
async function createUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
)

// Authenticate user with email and password
async function authenticateUser(
  email: string,
  password: string
) // Returns user without password, or null

// Get user by ID (without password)
async function getUserById(userId: string)

// Get user by email
async function getUserByEmail(email: string)

// Update user password
async function updateUserPassword(
  userId: string,
  newPassword: string
)

// Update user profile information
async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }
)

// Verify user email
async function verifyUserEmail(userId: string)

// Deactivate user account
async function deactivateUser(userId: string)

// Reactivate user account
async function reactivateUser(userId: string)
```

#### Session Management Functions

```typescript
// Create a new session
async function createUserSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  deviceName?: string
)

// Get session by token
async function getUserSession(sessionToken: string)

// Get all active sessions for a user
async function getUserSessions(userId: string)

// Update session last activity timestamp
async function updateUserSessionActivity(sessionToken: string)

// Invalidate a specific session
async function invalidateUserSession(sessionToken: string)

// Invalidate all sessions for a user (logout all devices)
async function invalidateAllUserSessions(userId: string)

// Check if session is valid and not expired
async function isUserSessionValid(sessionToken: string): Promise<boolean>

// Get session statistics for a user
async function getUserSessionStats(userId: string) // Returns { active, expired, total }

// Clean up all expired sessions
async function cleanupExpiredUserSessions()
```

#### Audit Logging Functions

```typescript
// Log an authentication event
async function logUserAuditEvent(data: {
  userId?: string;
  email?: string;
  action: string;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
})

// Get audit logs with pagination and filtering
async function getUserAuditLogs(filters?: {
  userId?: string;
  email?: string;
  action?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) // Returns { logs, pagination }

// Get failed login attempts
async function getFailedUserLoginAttempts(filters?: {
  email?: string;
  userId?: string;
  limit?: number;
  hoursBack?: number;
})

// Get audit log statistics
async function getUserAuditLogStats(userId?: string) // Returns { totalLogs, successfulLogins, failedLogins, uniqueIPs }
```

## API Endpoints

### Signup

**POST /api/auth/user/signup**

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "cuid-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "sessionToken": "session-token-123"
}
```

**Error Responses:**
- `400`: Email/password missing, invalid email format, weak password
- `409`: User already exists
- `500`: Server error

**Validations:**
- Email format must be valid
- Password must be at least 8 characters
- Email must be unique

### Login

**POST /api/auth/user/login**

Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceName": "iPhone"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "cuid-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null
  },
  "sessionToken": "session-token-123"
}
```

**Error Responses:**
- `400`: Email/password missing
- `401`: Invalid credentials
- `500`: Server error

### Logout (Current Device)

**POST /api/auth/user/logout**

Logout from current device.

**Request:**
No body required. Session token from cookie.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Error Responses:**
- `401`: No active session
- `500`: Server error

### Logout All Devices

**DELETE /api/auth/user/logout**

Logout from all devices.

**Request:**
No body required. Session token from cookie.

**Response (200):**
```json
{
  "message": "Logged out from all devices"
}
```

**Error Responses:**
- `401`: No active session
- `500`: Server error

### Get Sessions

**GET /api/user/sessions**

Get all active sessions for current user.

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "session-1",
      "sessionToken": "...",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "deviceName": "iPhone",
      "expiresAt": "2026-03-07T...",
      "createdAt": "2026-02-05T...",
      "lastActivity": "2026-02-05T..."
    }
  ],
  "stats": {
    "active": 2,
    "expired": 0,
    "total": 2
  }
}
```

### Delete Session

**DELETE /api/user/sessions?id=session-id**

Invalidate a specific session.

**Response (200):**
```json
{
  "message": "Session invalidated"
}
```

### Get Profile

**GET /api/user/profile**

Get current user profile and session info.

**Response (200):**
```json
{
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null
  },
  "session": {
    "id": "session-1",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "deviceName": "iPhone",
    "createdAt": "2026-02-05T...",
    "lastActivity": "2026-02-05T...",
    "expiresAt": "2026-03-07T..."
  }
}
```

### Update Profile

**PUT /api/user/profile**

Update user profile information.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-0100",
  "avatar": "https://..."
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "avatar": "https://...",
    "phone": "+1-555-0100",
    "updatedAt": "2026-02-05T..."
  }
}
```

## Session Management

### Session Features

- **30-day expiration**: Sessions expire after 30 days
- **Last activity tracking**: Automatically updated on API calls
- **Device tracking**: Optional device name for identifying sessions
- **IP & User-Agent logging**: For security and fraud detection
- **Multi-device support**: Users can have multiple concurrent sessions

### Session Token

Sessions use secure tokens generated with `crypto.randomBytes(32).toString('hex')`.

Tokens are:
- Unique per session
- Stored in HTTP-only cookies
- Never exposed to JavaScript (XSS protection)
- Secure-flag set in production

## Audit Logging

### Audit Events

Common audit events:

```
SIGNUP           - User account creation
LOGIN            - User login attempt
LOGIN_FAILED     - Failed login attempt
LOGOUT           - User logout
LOGOUT_ALL       - Logout from all devices
LOGOUT_SESSION   - Logout specific session
PROFILE_UPDATE   - Profile information changed
```

### Example Audit Log Entry

```typescript
{
  id: 'log-123',
  userId: 'user-1',
  email: 'user@example.com',
  action: 'LOGIN',
  status: 'success',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  metadata: JSON.stringify({ deviceName: 'iPhone' }),
  createdAt: new Date()
}
```

### Failed Login Tracking

Failed login attempts are tracked to detect suspicious activity:

```typescript
const failedAttempts = await getFailedUserLoginAttempts({
  email: 'user@example.com',
  hoursBack: 24,
  limit: 10
});

// Flag account if too many failures
if (failedAttempts.length > 5) {
  // Send alert to user
}
```

## Usage Examples

### Frontend: Signup Flow

```typescript
// Sign up a new user
async function signup(email: string, password: string, firstName: string, lastName: string) {
  const response = await fetch('/api/auth/user/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName }),
    credentials: 'include' // Include cookies
  });

  if (response.ok) {
    const data = await response.json();
    console.log('User created:', data.user);
    // Redirect to dashboard
  } else {
    const error = await response.json();
    console.error('Signup failed:', error.error);
  }
}
```

### Frontend: Login Flow

```typescript
// Login with email and password
async function login(email: string, password: string, deviceName?: string) {
  const response = await fetch('/api/auth/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceName }),
    credentials: 'include'
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Logged in as:', data.user.email);
    // Redirect to dashboard
  } else {
    console.error('Login failed');
  }
}
```

### Frontend: Session Management

```typescript
// Get all active sessions
async function getSessions() {
  const response = await fetch('/api/user/sessions', {
    credentials: 'include'
  });

  const data = await response.json();
  return data.sessions;
}

// Logout from specific device
async function logoutSession(sessionId: string) {
  const response = await fetch(`/api/user/sessions?id=${sessionId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (response.ok) {
    console.log('Session logged out');
  }
}

// Logout from all devices
async function logoutAll() {
  const response = await fetch('/api/auth/user/logout', {
    method: 'DELETE',
    credentials: 'include'
  });

  if (response.ok) {
    console.log('Logged out from all devices');
    // Redirect to login
  }
}
```

### Backend: Custom Middleware

```typescript
// Verify user session in middleware
import { getUserSession } from '@/lib/user-auth';

export async function verifyUserSession(req: NextRequest) {
  const sessionToken = req.cookies.get('userSession')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await getUserSession(sessionToken);
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Update last activity
  await updateUserSessionActivity(sessionToken);

  return session;
}
```

## Security Features

### Password Security

- **Hashing**: bcryptjs with 10 salt rounds
- **Comparison**: Constant-time comparison to prevent timing attacks
- **Strength**: Minimum 8 characters required
- **Never stored plaintext**: Always hashed

### Session Security

- **Tokens**: Secure random 32-byte tokens
- **HTTP-only cookies**: Protected from XSS attacks
- **Secure flag**: Set in production (HTTPS only)
- **SameSite**: Set to 'lax' to prevent CSRF
- **Expiration**: 30-day expiration with activity tracking

### Audit & Monitoring

- **Complete logging**: All auth events logged
- **IP tracking**: Source IP recorded for each event
- **Failed login detection**: Track failed attempts
- **User-Agent logging**: Device information captured
- **Email-based history**: All events tied to email address

### Data Protection

- **No password exposure**: Passwords never returned in API responses
- **User filtering**: Sensitive fields excluded by default
- **Inactive user check**: Deactivated users cannot login
- **Email verification**: Optional email verification flow

### Best Practices

1. **Always use HTTPS** in production
2. **Keep tokens secure**: Never expose in URLs
3. **Monitor failed logins**: Alert users of suspicious activity
4. **Cleanup expired sessions**: Run periodic cleanup job
5. **Rate limiting**: Implement on signup/login endpoints
6. **Email verification**: Verify emails before full account activation
7. **2FA support**: Consider adding two-factor authentication
8. **Password reset**: Implement secure password reset flow

## Error Handling

### Common Errors

```
400 Bad Request
- Missing required fields (email, password)
- Invalid email format
- Password too short
- Invalid JSON body

401 Unauthorized
- Invalid credentials
- Session not found
- Session expired
- No session token provided

409 Conflict
- User already exists
- Email already registered

500 Internal Server Error
- Database error
- Session creation failed
- Unexpected server error
```

### Error Response Format

```json
{
  "error": "Error message"
}
```

## Testing

User authentication is fully tested with Jest:

- User signup (valid data, duplicate email, missing fields, weak passwords)
- User login (valid/invalid credentials, missing fields, device tracking)
- User logout (single device, all devices, audit logging)
- Session management (create, read, update, delete, expiration)
- Audit logging (event creation, filtering, statistics)

Run tests:
```bash
npm test app/api/auth/user
npm test lib/__tests__/user-auth
```

## Related Documentation

- [Admin Authentication Guide](./ADMIN_AUTH_GUIDE.md)
- [Session Tracking Guide](./SESSION_TRACKING_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Setup and Deployment](./SETUP_AND_DEPLOYMENT.md)
