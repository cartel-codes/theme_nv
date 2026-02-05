# User Authentication & Profile Management Guide

This document describes the authentication system and profile management for Novraux customers.

## Authentication Overview

The system uses a **Session-based Authentication** model backed by PostgreSQL and managed via cookies.

### Sessions
- **Cookie Name**: `userSession`
- **Storage**: Database table `UserSession`
- **Duration**: Sessions are valid for 30 days by default.
- **Activity**: The `lastActivity` timestamp is updated on every profile-related request.

### Security
- **Passwords**: Hashed using `bcryptjs` with 10 salt rounds.
- **CSRF/Protection**: Session tokens are unique 64-character hex strings generated via `crypto`.
- **Middleware**: Routes under `/account/*` are protected by `middleware.ts`, redirecting unauthenticated users to `/auth/login`.

## Profile Management

### API Endpoints

#### `GET /api/user/profile`
Returns the current user's profile information and session metadata.
- **Authentication**: Required (`userSession` cookie)
- **Response**:
  ```json
  {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "session": { ... }
  }
  ```

#### `PUT /api/user/profile`
Updates user personal information.
- **Fields**: `firstName`, `lastName`, `phone`, `avatar`
- **Response**: Updated user object.

#### `POST /api/user/change-password`
Securely updates the user's password.
- **Inputs**: `currentPassword`, `newPassword`
- **Validation**: Verifies current password before updating.

## Frontend Components

- **`UserMenu.tsx`**: A client-side component in the header that displays the user's name or login/signup links.
- **`/account`**: The main profile dashboard.
- **`/account/change-password`**: Dedicated secure page for credential updates.
