# Session Tracking & Audit Logging Guide

## Overview

The Novraux admin system includes comprehensive session tracking and audit logging to monitor all authentication events, detect suspicious activity, and maintain a complete security audit trail.

## Features

### 🔍 Audit Logging
- **Complete Event Tracking**: Every login, logout, and signup is logged
- **Security Context**: Captures IP address and User-Agent for each event
- **Detailed Metadata**: Stores additional information based on event type
- **Error Tracking**: Logs authentication failures with specific error messages
- **Time-Series Data**: All events timestamped for compliance and analysis

### 📊 Session Management
- **Active Session Tracking**: Database persistence of user sessions
- **Session Expiration**: Automatic 24-hour session timeout
- **Activity Monitoring**: Last activity timestamp updated on each request
- **Multi-Session Support**: Users can have multiple active sessions
- **Bulk Invalidation**: Logout from all devices simultaneously

### 🚨 Security Monitoring
- **Failed Login Detection**: Identifies brute-force attempts
- **Suspicious Account Flagging**: Detects accounts with multiple failed attempts
- **IP Address Tracking**: Identifies unusual access patterns
- **User-Agent Monitoring**: Detects unauthorized client changes
- **Automatic Cleanup**: Expired sessions removed automatically

---

## Architecture

### Database Schema

#### AdminAuditLog Table
Stores all authentication and security events:

```
Field          | Type      | Description
---------------|-----------|----------------------------------
id             | String    | Primary key (UUID)
userId         | String?   | Admin user ID (nullable for failed auth)
email          | String?   | Email address (captured for failed auth)
action         | String    | Event type (LOGIN, LOGOUT, SIGNUP, etc.)
ip             | String?   | Client IP address
userAgent      | String?   | Client User-Agent string
status         | String    | 'success' or 'failed'
errorMessage   | String?   | Error details if failed
metadata       | JSON?     | Additional context (userId, userName, etc.)
createdAt      | DateTime  | Event timestamp

Indexes: userId, email, action, createdAt (for efficient queries)
```

#### AdminSession Table
Stores active user sessions:

```
Field          | Type      | Description
---------------|-----------|----------------------------------
id             | String    | Primary key (UUID)
userId         | String    | Admin user ID (foreign key)
sessionToken   | String    | Session identifier (unique)
ip             | String?   | Client IP address
userAgent      | String?   | Client User-Agent string
expiresAt      | DateTime  | Session expiration time (24h from creation)
createdAt      | DateTime  | Session creation timestamp
lastActivity   | DateTime  | Last activity timestamp

Indexes: userId, sessionToken, expiresAt
```

### Core Utilities

#### `/lib/audit.ts` - Audit Logging System
Centralized audit logging with functions for recording and retrieving events.

**Key Functions:**

```typescript
// Log an authentication event
await logAuditEvent({
  userId?: string;
  email?: string;
  action: string;  // 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'SIGNUP_SUCCESS', etc.
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
});

// Get audit logs with filtering
const logs = await getAuditLogs({
  action?: string;              // Filter by action type
  status?: 'success' | 'failed'; // Filter by status
  email?: string;               // Filter by email
  userId?: string;              // Filter by user ID
  startDate?: Date;             // Filter by date range
  endDate?: Date;
  limit?: number;               // Default 50
  offset?: number;              // Default 0
});

// Get recent successful logins
const logins = await getRecentLoginAttempts(limit?: number);

// Get failed login attempts
const failures = await getFailedLoginAttempts(
  minutesBack?: number,  // Default 60 minutes
  email?: string         // Optional: filter by email
);

// Get audit statistics
const stats = await getAuditLogStats(daysBack?: number);
// Returns: { totalEvents, successCount, failureCount, actionBreakdown }

// Delete old audit logs (retention policy)
const deleted = await deleteOldAuditLogs(daysToKeep?: number);
// Default: 90 days
```

#### `/lib/session-tracking.ts` - Session Management
Session lifecycle management with database persistence.

**Key Functions:**

```typescript
// Create and track a new session
await createTrackedSession(userId, sessionToken, {
  ip?: string;
  userAgent?: string;
});

// Retrieve session with user info
const session = await getSessionByToken(sessionToken);
// Returns: { id, userId, user: { id, email, name, role }, expiresAt, createdAt, lastActivity }

// Update last activity timestamp
await updateSessionActivity(sessionToken);

// Invalidate a single session (logout)
await invalidateSession(sessionToken);

// Get all active sessions for a user
const sessions = await getUserSessions(userId);

// Logout from all devices
await invalidateUserSessions(userId);

// Get session statistics
const stats = await getSessionStats();
// Returns: { totalActiveSessions, usersWithSessions, avgSessionsPerUser, recentLogins }

// Delete expired sessions (maintenance)
const cleaned = await cleanupExpiredSessions();

// Check if session is still valid
const isValid = await isSessionValid(sessionToken);
```

---

## API Endpoints

### 1. GET `/api/admin/audit-logs`
Retrieve audit logs with optional filtering and statistics.

**Authentication**: Required (admin session)

**Query Parameters:**
```
action=STRING      - Filter by action type (LOGIN, LOGOUT, SIGNUP, etc.)
status=STRING      - Filter by status ('success' or 'failed')
limit=NUMBER       - Results per page (default: 50, max: 100)
offset=NUMBER      - Pagination offset (default: 0)
days=NUMBER        - Last N days of logs (default: 7, for statistics)
```

**Response Example:**
```json
{
  "logs": [
    {
      "id": "uuid-1",
      "userId": "user-id",
      "email": "admin@novraux.com",
      "action": "LOGIN_SUCCESS",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "status": "success",
      "metadata": {
        "userName": "Admin User",
        "userRole": "ADMIN"
      },
      "createdAt": "2024-02-20T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1250
  },
  "statistics": {
    "lastNDays": 7,
    "totalEvents": 1250,
    "successCount": 1100,
    "failureCount": 150,
    "actionBreakdown": {
      "LOGIN_SUCCESS": 800,
      "LOGIN_FAILED": 150,
      "SIGNUP_SUCCESS": 300
    }
  },
  "recentFailedAttempts": [
    {
      "email": "unknown@example.com",
      "attemptCount": 5,
      "lastAttempt": "2024-02-20T09:15:00Z",
      "ips": ["192.168.1.50", "192.168.1.51"]
    }
  ]
}
```

**Error Responses:**
```json
// 401 Unauthorized
{ "error": "Unauthorized" }

// 500 Server Error
{ "error": "Failed to retrieve audit logs" }
```

---

### 2. GET `/api/admin/sessions`
Retrieve active user sessions and session statistics.

**Authentication**: Required (admin session)

**Query Parameters:**
```
action=cleanup     - Cleanup expired sessions (optional)
```

**Response Example:**
```json
{
  "currentSessions": [
    {
      "id": "session-id",
      "userId": "user-id",
      "sessionToken": "token...",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-02-20T10:00:00Z",
      "lastActivity": "2024-02-20T10:45:00Z",
      "expiresAt": "2024-02-21T10:00:00Z"
    }
  ],
  "statistics": {
    "totalActiveSessions": 5,
    "usersWithSessions": 3,
    "avgSessionsPerUser": 1.67,
    "recentLogins": 15
  },
  "currentSession": {
    "userId": "current-user-id",
    "email": "admin@novraux.com",
    "name": "Admin User"
  }
}
```

**Cleanup Response:**
```json
{
  "message": "Expired sessions cleaned up",
  "count": 12
}
```

---

### 3. GET `/api/admin/failed-logins`
Retrieve failed login attempts and detect suspicious accounts.

**Authentication**: Required (admin session)

**Query Parameters:**
```
minutes=NUMBER     - Time window to check (default: 60)
email=STRING       - Filter by email (optional)
```

**Response Example:**
```json
{
  "failedAttempts": [
    {
      "id": "uuid-1",
      "email": "attacker@example.com",
      "action": "LOGIN_FAILED",
      "ip": "192.168.1.50",
      "userAgent": "curl/7.64.1",
      "status": "failed",
      "errorMessage": "Invalid credentials",
      "createdAt": "2024-02-20T09:15:00Z"
    }
  ],
  "summary": {
    "attacker@example.com": 8,
    "unknown-user@test.com": 3
  },
  "suspiciousAccounts": [
    {
      "email": "attacker@example.com",
      "failedAttempts": 8
    }
  ],
  "timeWindowMinutes": 60,
  "totalFailedAttempts": 11
}
```

---

## Integration with Auth Routes

All authentication endpoints automatically log events:

### Login Route (`/api/auth/login`)
```typescript
// Logs on success
await logAuditEvent({
  userId: user.id,
  email: user.email,
  action: 'LOGIN_SUCCESS',
  ip: getClientIP(req),
  userAgent: getUserAgent(req),
  status: 'success',
  metadata: { userName: user.name, userRole: user.role },
});

// Logs on failure
await logAuditEvent({
  email,
  action: 'LOGIN_FAILED',
  ip: getClientIP(req),
  userAgent: getUserAgent(req),
  status: 'failed',
  errorMessage: 'Invalid credentials',
});
```

### Signup Route (`/api/auth/signup`)
```typescript
// Logs on success
await logAuditEvent({
  userId: newUser.id,
  email: newUser.email,
  action: 'SIGNUP_SUCCESS',
  ip: getClientIP(req),
  userAgent: getUserAgent(req),
  status: 'success',
  metadata: { userName: newUser.name },
});

// Logs on failure
await logAuditEvent({
  email,
  action: 'SIGNUP_FAILED',
  ip: getClientIP(req),
  userAgent: getUserAgent(req),
  status: 'failed',
  errorMessage: 'User already exists',
});
```

### Logout Route (`/api/auth/logout`)
```typescript
// Always logs logout event
await logAuditEvent({
  userId: session.id,
  email: session.email,
  action: 'LOGOUT',
  ip: getClientIP(req),
  userAgent: getUserAgent(req),
  status: 'success',
  metadata: { sessionId: sessionToken },
});
```

---

## Best Practices

### 1. Regular Monitoring
```typescript
// Check for brute-force attacks
const failedLogins = await getFailedLoginAttempts(60); // Last hour
if (failedLogins.length > 10) {
  // Alert admin
}

// Monitor suspicious accounts
const stats = await getAuditLogStats(1); // Last 24 hours
const failureRate = stats.failureCount / stats.totalEvents;
if (failureRate > 0.2) {
  // High failure rate - potential attack
}
```

### 2. Retention Policy
```typescript
// Run daily to maintain audit trail
await deleteOldAuditLogs(90); // Keep 90 days
await cleanupExpiredSessions(); // Remove expired sessions
```

### 3. Security Alerts
- **Alert on 5+ failed logins**: Possible brute-force attack
- **Alert on unusual IP**: User logging in from new location
- **Alert on multiple simultaneous sessions**: Account compromise risk
- **Alert on failed signup**: Potential enumeration attack

### 4. Compliance
- All authentication events logged with user context
- IP addresses and User-Agent captured for forensics
- Timestamps for audit trail continuity
- Error messages logged for troubleshooting
- 90-day retention for regulatory compliance

---

## Usage Examples

### Example 1: Monitor Failed Logins
```typescript
// Check for brute-force attempts in the last 60 minutes
const failedLogins = await getFailedLoginAttempts(60);
const summary: Record<string, number> = {};

for (const attempt of failedLogins) {
  const email = attempt.email || 'unknown';
  summary[email] = (summary[email] || 0) + 1;
}

// Alert if any account has 5+ failed attempts
for (const [email, count] of Object.entries(summary)) {
  if (count >= 5) {
    console.warn(`🚨 Brute-force detected: ${email} (${count} attempts)`);
  }
}
```

### Example 2: Audit User Sessions
```typescript
// Get all sessions for a specific user
const userSessions = await getUserSessions('user-id');

// Check for unusual activity
for (const session of userSessions) {
  const lastActivity = new Date(session.lastActivity);
  const now = new Date();
  const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / 60000;
  
  if (inactiveMinutes > 1440) { // 24 hours
    console.log(`⏱️ Inactive session: ${session.id}`);
    await invalidateSession(session.sessionToken);
  }
}
```

### Example 3: Generate Security Report
```typescript
// Get last 7 days of audit logs
const logs = await getAuditLogs({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  limit: 1000,
});

// Count unique users
const uniqueUsers = new Set(logs.filter(l => l.userId).map(l => l.userId));

// Count failed logins
const failedCount = logs.filter(l => l.status === 'failed').length;

// Report
console.log(`📊 Security Report (Last 7 Days)`);
console.log(`Users: ${uniqueUsers.size}`);
console.log(`Failed Attempts: ${failedCount}`);
console.log(`Success Rate: ${((logs.length - failedCount) / logs.length * 100).toFixed(2)}%`);
```

### Example 4: Logout from All Devices
```typescript
// User requests to logout from all devices
await invalidateUserSessions(userId);

// Log this action
await logAuditEvent({
  userId,
  email: user.email,
  action: 'LOGOUT_ALL_DEVICES',
  status: 'success',
  metadata: { reason: 'user_requested' },
});
```

---

## Troubleshooting

### Issue: Sessions table is empty
**Cause**: New sessions not being created
**Solution**: Ensure `createTrackedSession()` is called in login route
```typescript
// In login route, after successful authentication:
await createTrackedSession(user.id, sessionToken, {
  ip: getClientIP(req),
  userAgent: getUserAgent(req),
});
```

### Issue: Audit logs showing too much data
**Cause**: No retention policy applied
**Solution**: Run cleanup task daily
```typescript
// Add to a scheduled job or cron task:
await deleteOldAuditLogs(90); // Keep 90 days
```

### Issue: Missing IP addresses
**Cause**: `getClientIP()` not properly extracting from headers
**Solution**: Check X-Forwarded-For headers if behind proxy
```typescript
function getClientIP(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         req.ip;
}
```

### Issue: Failed logins not being recorded
**Cause**: Error thrown before `logAuditEvent()` call
**Solution**: Wrap in try-catch-log pattern
```typescript
try {
  const user = await authenticateAdminUser(email, password);
  // ... success path
} catch (error) {
  await logAuditEvent({
    email,
    action: 'LOGIN_FAILED',
    status: 'failed',
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
  });
  throw error;
}
```

---

## Database Queries Reference

### Find all failed logins for an email
```sql
SELECT * FROM "AdminAuditLog"
WHERE action = 'LOGIN_FAILED' AND email = 'user@example.com'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Find all actions by a user
```sql
SELECT * FROM "AdminAuditLog"
WHERE "userId" = 'user-id'
ORDER BY "createdAt" DESC;
```

### Find active sessions
```sql
SELECT * FROM "AdminSession"
WHERE "expiresAt" > NOW()
ORDER BY "lastActivity" DESC;
```

### Get audit statistics
```sql
SELECT
  COUNT(*) as total_events,
  status,
  action,
  DATE("createdAt") as event_date
FROM "AdminAuditLog"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY status, action, DATE("createdAt")
ORDER BY event_date DESC;
```

---

## Next Steps

### Immediate Tasks
1. ✅ Create audit log endpoint
2. ✅ Create session management endpoint
3. ✅ Create failed logins detection endpoint
4. 🔄 Create admin dashboard components for viewing logs
5. 🔄 Add email notifications for security events

### Future Enhancements
- [ ] Rate limiting on failed logins
- [ ] 2FA implementation
- [ ] IP whitelist management
- [ ] Device fingerprinting
- [ ] Automated security alerts
- [ ] Admin dashboard UI for session management
- [ ] Session activity timeline
- [ ] Geographic location tracking

---

## Summary

The session tracking and audit logging system provides complete visibility into all authentication events, enables real-time security monitoring, and maintains a comprehensive audit trail for compliance. All events are automatically captured, indexed for efficient retrieval, and available through RESTful API endpoints.

**Key Capabilities:**
- ✅ Complete audit trail of all auth events
- ✅ Real-time failed login detection
- ✅ Active session tracking and management
- ✅ Statistical analysis and reporting
- ✅ API endpoints for monitoring and management
- ✅ Automatic cleanup and retention policies
- ✅ Security context (IP, User-Agent) capture

