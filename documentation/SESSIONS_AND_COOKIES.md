# Sessions and Cookies — Technical Guide

> How admin authentication sessions and cookies work.

**Last Updated**: February 2026

---

## Overview

Admin authentication uses **DB-backed sessions** with **HTTP-only cookies** for security.

---

## Session Flow

### Login

1. User submits email + password to `/api/auth/login`
2. Credentials validated via `authenticateAdminUser()`
3. **Session created in DB** (`AdminSession` table) with:
   - `sessionToken`: UUID (crypto.randomUUID())
   - `userId`, `ip`, `userAgent`, `expiresAt` (24h)
4. **Cookie set**: `admin_session` = sessionToken
   - `httpOnly: true` — not accessible via JavaScript
   - `secure: true` in production
   - `sameSite: 'lax'`
   - `maxAge`: 24 hours

### Request (Protected Route)

1. **Middleware**: Checks cookie exists and is valid UUID format
2. **Layout**: Calls `getSession()` which:
   - Reads cookie
   - Looks up `AdminSession` in DB by token
   - Validates not expired
   - Updates `lastActivity`
   - Returns user data
3. If session invalid → redirect to `/admin/login`

### Logout

1. User calls `/api/auth/logout`
2. `destroySession()`:
   - Deletes `AdminSession` from DB
   - Clears `admin_session` cookie

---

## Cookies Used

| Cookie | Purpose | HttpOnly | Secure |
|--------|---------|----------|--------|
| `admin_session` | Admin auth token (UUID) | Yes | Prod only |
| `cart_session_id` | Anonymous cart session | Yes | Prod only |

---

## Session Storage (DB)

```prisma
model AdminSession {
  id           String   @id @default(cuid())
  userId       String
  sessionToken String   @unique  // UUID stored in cookie
  ip           String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime
  lastActivity DateTime
  ...
}
```

---

## Key Files

| File | Role |
|------|------|
| `lib/session.ts` | createSession, getSession, destroySession |
| `lib/session-tracking.ts` | DB operations (create, invalidate, validate) |
| `middleware.ts` | Cookie format check, pathname header |
| `app/api/auth/login/route.ts` | Creates session on login |
| `app/api/auth/logout/route.ts` | Destroys session on logout |

---

## Security Notes

- Session token is **UUID** (not JWT) — validated against DB
- Logout **invalidates** session in DB — stolen tokens stop working
- Cookie is **httpOnly** — XSS cannot steal it
- **sameSite: 'lax'** — CSRF protection for cross-site requests
