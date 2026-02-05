# Admin Authentication System Documentation

## Overview

The Novraux admin panel now features a secure authentication system using email/password login with session-based authorization. This document covers setup, usage, and best practices.

## Features

- **Email/Password Authentication**: Secure login and signup for admin users
- **Session Management**: Cookie-based sessions with automatic expiration
- **Password Hashing**: Bcryptjs for secure password storage
- **Protected Routes**: Middleware-enforced protection for `/admin` routes
- **Admin Dashboard**: Intuitive admin interface with user profile display

## Quick Start

### 1. Initial Setup

After pulling the code, run the following commands:

```bash
# Install dependencies
npm install

# Create and apply migrations
npm run db:migrate

# Seed the database with default admin user
npm run db:seed
```

### 2. Default Admin Account

After running `npm run db:seed`, you can login with:

- **Email**: `admin@novraux.com`
- **Password**: `admin123!`

⚠️ **IMPORTANT**: Change this password immediately in production!

### 3. Accessing the Admin Panel

1. Navigate to `http://localhost:3000/admin`
2. You'll be redirected to login page if not authenticated
3. Enter credentials and click "Sign In"
4. You'll be redirected to the dashboard

## Architecture

### Components & Files

```
app/
├── api/
│   └── auth/
│       ├── login/route.ts      # Login API endpoint
│       ├── logout/route.ts     # Logout API endpoint
│       └── signup/route.ts     # Signup API endpoint
├── admin/
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   ├── layout.tsx              # Admin layout with sidebar
│   ├── AdminLogoutButton.tsx   # Logout button component
│   ├── page.tsx                # Dashboard
│   └── ...                     # Other admin pages
lib/
├── auth.ts                     # Authentication utilities
├── session.ts                  # Session management
├── jwt.ts                      # Token encoding/decoding
└── prisma.ts                   # Database client
middleware.ts                   # Route protection middleware
prisma/
├── schema.prisma               # Database schema (includes AdminUser model)
├── seed.ts                     # Database seeding
└── migrations/
    └── 20260204120000_add_admin_user/  # AdminUser table migration
```

### Data Model

The `AdminUser` model in the Prisma schema:

```prisma
model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String?
  role      String   @default("admin")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

## Authentication Flow

### Login Flow

1. User enters email and password on `/admin/login`
2. Form submits to `/api/auth/login` (POST)
3. API validates credentials against database
4. If valid, a session cookie is created
5. User is redirected to `/admin`

### Protected Routes

1. User navigates to `/admin/*` route
2. Middleware (`middleware.ts`) checks for valid session cookie
3. If cookie is missing or invalid, user is redirected to `/admin/login`
4. If valid, user can access protected pages

### Logout Flow

1. User clicks "Sign out" button
2. Sends POST request to `/api/auth/logout`
3. Session cookie is deleted
4. User is redirected to `/admin/login`

## API Endpoints

### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "admin@novraux.com",
  "password": "admin123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

### POST `/api/auth/signup`

**Request Body:**
```json
{
  "email": "newadmin@novraux.com",
  "password": "securePassword123!",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

**Error Response (409):**
```json
{
  "error": "User already exists"
}
```

### POST `/api/auth/logout`

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Security Considerations

### Password Security

- Passwords are hashed using **bcryptjs** with 10 salt rounds
- Plain text passwords are never stored in the database
- Always use HTTPS in production to protect credentials in transit

### Session Management

- Sessions use HTTP-only cookies to prevent XSS attacks
- Cookies are marked as `secure` in production (HTTPS only)
- Sessions expire after 24 hours of inactivity
- Sessions cannot be accessed by client-side JavaScript

### Middleware Protection

- All `/admin/*` routes (except login/signup) require a valid session
- Invalid or missing sessions redirect to login
- Environment variables are kept in `.env` and never exposed

## Managing Admin Users

### Creating a New Admin User

#### Via Signup Page
1. Navigate to `/admin/signup`
2. Fill in email, password, and name
3. Password must be at least 8 characters
4. Click "Create Account"

#### Via Database (Admin Only)

Using Prisma Studio:
```bash
npm run db:studio
```

Then manually create a new `AdminUser` record with:
- A unique email
- A bcrypt-hashed password

### Updating Admin User Password

Use the `updateAdminUserPassword` utility in [lib/auth.ts](../../lib/auth.ts):

```typescript
import { updateAdminUserPassword } from '@/lib/auth';

await updateAdminUserPassword(userId, 'newPassword123!');
```

### Deactivating an Admin User

Using Prisma Studio or directly in the database:

```bash
npm run db:studio
```

Set `isActive` to `false` for the user you want to deactivate.

## Environment Variables

The following environment variables are required:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Admin Credentials (Optional - for fallback/legacy support)
ADMIN_USER=admin
ADMIN_PASSWORD=novraux_luxury

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Troubleshooting

### Cannot Login

**Issue**: Login fails with "Invalid email or password"

**Solutions:**
1. Double-check email and password (case-sensitive)
2. Verify user exists in database: `npm run db:studio`
3. Check that the user's `isActive` field is `true`
4. Reset password using Prisma Studio if necessary

### Session Expires Too Quickly

**Issue**: Getting logged out unexpectedly

**Solution**: Session duration is set to 24 hours in [lib/session.ts](../../lib/session.ts). Adjust `SESSION_DURATION` if needed:

```typescript
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Middleware Not Protecting Routes

**Issue**: Can access `/admin` routes without login

**Solution**: 
1. Clear browser cookies
2. Restart the development server
3. Check that `middleware.ts` exists in the root directory
4. Verify the matcher pattern includes your route

### Password Hashing Issues

**Issue**: "bcryptjs not found" error

**Solution**: Install dependencies:
```bash
npm install
npm run postinstall
```

## Best Practices

### For Users

1. **Use Strong Passwords**: Minimum 8 characters, mix of uppercase, lowercase, numbers, and symbols
2. **Don't Share Credentials**: Each team member should have their own account
3. **Change Default Password**: Immediately change the default admin password in production
4. **Logout When Done**: Click "Sign out" when you're finished to protect sensitive access
5. **Clear Cookies Periodically**: Clear browser cookies if concerned about session hijacking

### For Administrators

1. **Regular Audits**: Regularly review who has admin access
2. **Disable Unused Accounts**: Set `isActive` to `false` for team members who've left
3. **Update Dependencies**: Keep `bcryptjs` and other security packages updated
4. **Monitor Logs**: Keep an eye on login attempts and authentication errors
5. **Use HTTPS**: Always use HTTPS in production to protect credentials in transit
6. **Environment Secrets**: Never commit `.env` files with real credentials

## Future Enhancements

Potential improvements for Phase 3:

1. **Two-Factor Authentication (2FA)**: Add TOTP or email-based 2FA
2. **Audit Logging**: Track all admin actions for compliance
3. **Role-Based Access Control (RBAC)**: Define granular permissions (editor, viewer, admin)
4. **Password Reset Email**: Allow users to reset forgotten passwords
5. **OAuth Integration**: Support Google or Microsoft authentication
6. **Session Activity Tracking**: Display last login and active sessions
7. **Rate Limiting**: Prevent brute-force attacks on login endpoint

## Support & Questions

For questions or issues with the authentication system:

1. Check this documentation first
2. Review the code in [lib/auth.ts](../../lib/auth.ts) and [middleware.ts](../../middleware.ts)
3. Check Prisma documentation: https://www.prisma.io/docs/
4. Check Next.js documentation: https://nextjs.org/docs

---

**Last Updated**: February 4, 2026  
**Version**: 1.0.0
