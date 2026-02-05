# Admin Authentication API Reference

## Base URL

```
http://localhost:3000 (development)
https://your-domain.com (production)
```

## Authentication Endpoints

### 1. Login

Authenticates a user and creates a session.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@novraux.com",
  "password": "admin123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged in successfully"
}
```

**Response Headers:**
```
Set-Cookie: admin_session=eyJ....; HttpOnly; Secure; SameSite=Lax
```

**Error Responses:**

400 Bad Request (Missing fields):
```json
{
  "error": "Email and password are required"
}
```

401 Unauthorized (Invalid credentials):
```json
{
  "error": "Invalid email or password"
}
```

500 Internal Server Error:
```json
{
  "error": "An error occurred during login"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@novraux.com",
    "password": "admin123!"
  }' \
  -c cookies.txt
```

**Example JavaScript/Fetch:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@novraux.com',
    password: 'admin123!'
  })
});

const data = await response.json();
if (response.ok) {
  console.log('Login successful');
  // Redirect to dashboard
  window.location.href = '/admin';
}
```

---

### 2. Signup

Creates a new admin user account.

**Endpoint:** `POST /api/auth/signup`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newadmin@novraux.com",
  "password": "securePassword123!",
  "name": "John Doe"
}
```

**Parameters:**
- `email` (string, required): User's email address. Must be unique.
- `password` (string, required): User's password. Minimum 8 characters recommended.
- `name` (string, optional): User's full name.

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

**Response Headers:**
```
Set-Cookie: admin_session=eyJ....; HttpOnly; Secure; SameSite=Lax
```

**Error Responses:**

400 Bad Request (Missing fields):
```json
{
  "error": "Email and password are required"
}
```

409 Conflict (User already exists):
```json
{
  "error": "User already exists"
}
```

500 Internal Server Error:
```json
{
  "error": "An error occurred during signup"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@novraux.com",
    "password": "securePassword123!",
    "name": "John Doe"
  }' \
  -c cookies.txt
```

**Example JavaScript/Fetch:**
```javascript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newadmin@novraux.com',
    password: 'securePassword123!',
    name: 'John Doe'
  })
});

const data = await response.json();
if (response.ok) {
  console.log('Signup successful');
  window.location.href = '/admin';
}
```

---

### 3. Logout

Terminates the current session.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Cookie: admin_session=eyJ...
```

**Request Body:**
```json
{}
```

(Empty body, authentication via session cookie)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response Headers:**
```
Set-Cookie: admin_session=; Max-Age=0; Path=/
```

(Cookie is deleted)

**Error Response (500):**
```json
{
  "error": "An error occurred during logout"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

**Example JavaScript/Fetch:**
```javascript
const response = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include' // Important: include cookies
});

const data = await response.json();
if (response.ok) {
  console.log('Logged out');
  window.location.href = '/admin/login';
}
```

---

### 4. Profile (Get)

Returns the current admin user's profile. Requires valid session.

**Endpoint:** `GET /api/admin/profile`

**Headers:**
```
Cookie: admin_session=<session-token>
```

**Success Response (200 OK):**
```json
{
  "id": "clx...",
  "email": "admin@novraux.com",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2026-02-04T..."
}
```

**Error Responses:** 401 Unauthorized, 404 Not Found

---

### 5. Profile (Update)

Updates the current admin user's name and/or email.

**Endpoint:** `PATCH /api/admin/profile`

**Request Body:**
```json
{
  "name": "New Name",
  "email": "newemail@novraux.com"
}
```

(Both fields optional; include only what you want to update)

**Success Response (200 OK):** Returns updated user object

**Error Responses:**
- 400: Email already in use
- 401: Unauthorized

---

### 6. Profile (Change Password)

Updates the current admin user's password.

**Endpoint:** `PATCH /api/admin/profile/password`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newSecurePassword456!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- 400: Current password incorrect, or new password too short (< 8 chars)
- 401: Unauthorized

---

## Session Management

### How Sessions Work

1. **DB-Backed**: Sessions stored in `AdminSession` table; cookie holds session token (UUID)
2. **Cookie-Based**: Session token in HTTP-only cookie `admin_session`
3. **Automatic**: Cookie set on login, cleared on logout
4. **Secure**: HttpOnly, Secure in production, SameSite=Lax
5. **Expiration**: Sessions expire after 24 hours; logout invalidates in DB

See [SESSIONS_AND_COOKIES.md](./SESSIONS_AND_COOKIES.md) for full technical details.

### Session Data Structure

```typescript
interface SessionData {
  id: string;           // User ID
  email: string;        // User email
  name?: string;        // User name
  role: string;         // User role (e.g., "admin")
}
```

### Accessing Session Data

**Server-Side (Server Components):**
```typescript
import { getSession } from '@/lib/session';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/admin/login');
  }
  
  return <div>Welcome, {session.email}</div>;
}
```

**Client-Side:**
Sessions are NOT accessible from client-side JavaScript for security reasons. Instead, use API routes or server actions to access session data.

---

## Protected Routes

### Route Protection via Middleware

The following routes are automatically protected:

- `/admin/*` (except `/admin/login` and `/admin/signup`)

**Protection Rules:**
1. No valid session → Redirect to `/admin/login`
2. Valid session → Access granted
3. Invalid/expired session → Redirect to `/admin/login`

### Creating Protected Routes

**Server Component (Recommended):**
```typescript
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/admin/login');
  }
  
  return <div>Protected content for {session.email}</div>;
}
```

**API Route:**
```typescript
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return NextResponse.json({ user: session });
}
```

---

## Error Handling

### Common Status Codes

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | User account created |
| 400 | Bad Request | Missing or invalid fields |
| 401 | Unauthorized | Invalid credentials or missing session |
| 409 | Conflict | User already exists |
| 500 | Server Error | Unexpected error |

### Error Response Format

All errors return JSON with an `error` field:

```json
{
  "error": "Description of what went wrong"
}
```

### Handling Errors in Frontend

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

if (!response.ok) {
  console.error('Error:', data.error);
  
  // Handle specific status codes
  if (response.status === 401) {
    setError('Invalid email or password');
  } else if (response.status === 409) {
    setError('User already exists');
  } else {
    setError(data.error || 'An error occurred');
  }
  
  return;
}

// Handle success
console.log('Success:', data.message);
```

---

## Rate Limiting

Currently, there is **NO BUILT-IN rate limiting** on auth endpoints. It's recommended to add rate limiting before production:

### Adding Rate Limiting with Upstash

```bash
npm install @upstash/ratelimit redis
```

```typescript
// app/api/auth/login/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 attempts per hour
});

export async function POST(req: NextRequest) {
  const ip = req.ip || 'anonymous';
  const { success } = await ratelimit.limit(`auth-${ip}`);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 }
    );
  }
  
  // ... rest of login logic
}
```

---

## Testing

### Using Postman

1. Import this collection:

```json
{
  "info": {
    "name": "Novraux Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/login",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"admin@novraux.com\",\"password\":\"admin123!\"}"
        }
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/logout"
      }
    }
  ]
}
```

2. Set `base_url` to `http://localhost:3000`

### Using Jest/Testing Library

```typescript
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';

describe('Auth Endpoints', () => {
  it('should login with valid credentials', async () => {
    const req = new NextRequest(
      new URL('http://localhost:3000/api/auth/login'),
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@novraux.com',
          password: 'admin123!'
        })
      }
    );
    
    const response = await POST(req);
    expect(response.status).toBe(200);
  });
});
```

---

## Best Practices

### 1. Always Use HTTPS

In production, all auth requests should use HTTPS to protect credentials in transit.

### 2. Store Credentials Securely

Never store passwords in localStorage or sessionStorage. Use HTTP-only cookies instead.

### 3. Handle Errors Gracefully

Don't expose internal error details to users. Use generic messages for failed logins:

✅ Do: "Invalid email or password"  
❌ Don't: "User not found" (reveals whether email exists)

### 4. Validate Input

Both client and server should validate:
- Email format
- Password strength (minimum 8 characters)
- Required fields present

### 5. Use Appropriate HTTP Methods

- `POST` for creating/modifying data (login, signup, logout)
- `GET` for retrieving data (never for auth)

### 6. Implement CSRF Protection

For forms, add CSRF tokens:

```typescript
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const csrfToken = req.headers.get('x-csrf-token');
  
  if (!csrfToken || !validateCSRFToken(csrfToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // ... rest of logic
}
```

---

## SDK/Client Libraries

### TypeScript Client

```typescript
class AuthClient {
  constructor(private baseUrl: string) {}
  
  async login(email: string, password: string) {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    return res.json();
  }
  
  async signup(email: string, password: string, name?: string) {
    const res = await fetch(`${this.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include'
    });
    return res.json();
  }
  
  async logout() {
    const res = await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  }
}

// Usage
const auth = new AuthClient('http://localhost:3000');
await auth.login('admin@novraux.com', 'admin123!');
```

---

**Last Updated**: February 4, 2026  
**Version**: 1.0.0
