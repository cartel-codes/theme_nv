# Security Hardening & Verification Plan

**Document goal**: Provide a repeatable checklist and workflow to catch and fix security issues in Novraux (sessions, authentication, payments, admin access, etc.).

---

## 1. Scope & Priorities

- **Sessions & Cookies**
  - User sessions (`userSession`)
  - Admin sessions (`admin_session`)
  - Session storage in DB (`userSession`, `userSessionTracking`, etc.)
- **Authentication & Authorization**
  - User auth (signup/login/logout, password hashing)
  - Admin auth (admin login, admin-only routes, middleware)
  - Route-level access control (API + pages)
- **Payments & Integrations**
  - PayPal flows (create, capture, webhook)
  - Inventory + order consistency after payment
- **API & Data Protection**
  - Input validation & error handling
  - Sensitive data in logs / error messages

Use this doc whenever you:
- Add/modify auth or payment flows
- Notice odd login state (e.g., “still logged in” in private window)
- Prepare for deployment or security review

---

## 2. Session & Cookie Checklist

**Configuration**
- [ ] All auth cookies are **HTTP-only** and **Secure** in production.
- [ ] `SameSite` is set to `Lax` or `Strict` (no `None` without a clear cross-site need).
- [ ] Cookies have a **reasonable maxAge** and server-side expiry in DB.

**User Sessions (`userSession`)**
- [ ] Created only via `/api/auth/user/login` or `/api/auth/user/signup`.
- [ ] Stored in `prisma.userSession` with `expiresAt` and `lastActivity`.
- [ ] Validated on every sensitive API route (checkout, account, orders).
- [ ] Logout endpoints:
  - `/api/auth/user/logout` clears cookie and invalidates DB session(s).

**Admin Sessions (`admin_session`)**
- [ ] Created only for authenticated admin users.
- [ ] Validated in `middleware.ts` for `/admin/*` routes.
- [ ] Session token format checked (UUID v4) before allowing access.
- [ ] Admin logout clears cookie and invalidates DB session.

**Testing Scenarios**
- [ ] Open **normal window**, log in as user → close tab → re-open site → still logged in (expected until logout or expiry).
- [ ] Open **private/incognito session**, log in there, then:
  - [ ] Close **all** private windows → reopen a new private window → verify you are **logged out**.
- [ ] Log out via app → confirm:
  - [ ] `userSession` / `admin_session` cookie is removed.
  - [ ] Protected APIs return `401/403`.

---

## 3. Authentication & Authorization Checklist

**Password Handling**
- [ ] All passwords hashed with bcrypt (see `lib/user-auth.ts`, `lib/auth.ts`).
- [ ] No plaintext passwords are ever logged.
- [ ] Password reset flows do **not** expose the original password.

**User Auth**
- [ ] Signup and login endpoints validate input (email format, password length).
- [ ] On successful login:
  - [ ] Session is created in DB with IP/User-Agent where possible.
  - [ ] Session cookie is set with secure options.
- [ ] On failed login:
  - [ ] Generic error messages (no “user does not exist vs wrong password” distinction).
  - [ ] Audit logs capture failed attempts without leaking sensitive data.

**Admin Auth**
- [ ] Admin login/management routes are separated from user routes.
- [ ] `/admin/*` is gated by `middleware.ts` and DB-backed sessions.
- [ ] No admin-only actions are exposed through unauthenticated or user-only APIs.

**Route Protection**
- [ ] For each new API route:
  - [ ] Decide: public vs authenticated vs admin-only.
  - [ ] Enforce the decision with cookie/session checks and DB validation.
- [ ] For each new page under `/account`, `/checkout`, `/admin`:
  - [ ] Ensure client-side redirects OR server-side protection to login if not authenticated.

---

## 4. Payment & PayPal Checklist

**Environment & Credentials**
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly for the current environment.
- [ ] `PAYPAL_CLIENT_SECRET` and `PAYPAL_API_BASE` are set only on the server.
- [ ] Sandbox vs Live credentials are **never** mixed.

**Create Order (`/api/checkout/paypal/create-order`)**
- [ ] Requires authenticated user via `userSession` cookie.
- [ ] Validates cart items against DB (pricing, availability, inventory).
- [ ] Recomputes totals server-side (subtotal, tax, shipping, total) and stores them on the order.
- [ ] Persists PayPal `order.id` into the local order `paymentId`.

**Capture Order (`/api/checkout/paypal/capture-order`)**
- [x] Requires authenticated user + valid session lookup.
- [x] Confirms local order exists and belongs to the current user.
- [ ] Checks PayPal capture status is `COMPLETED`.
- [ ] When **strict validation** is enabled:
  - [x] Validates currency (must match local expectation, e.g., `USD`).
  - [x] Validates amount ≈ local `order.total`.
- [ ] On success:
  - [ ] Updates order status to `paid` and `paymentStatus` to `captured`.
  - [ ] Deducts stock for all items.

**Webhook (`/api/webhooks/paypal`)**
- [ ] Validates that `event_type` and `resource` are present.
- [ ] Handles `PAYMENT.CAPTURE.COMPLETED` events idempotently:
  - [ ] Finds local order by `paymentId`.
  - [ ] Marks as `paid` / `captured` only if not already.
  - [ ] Deducts inventory with error logging.
- [ ] Logs and ignores unsupported event types without 500s.

**Testing Scenarios**
- [ ] End-to-end sandbox payment:
  - [ ] Start from cart → checkout → PayPal popup → success page.
  - [ ] Verify DB order state and inventory.
- [ ] Failure cases:
  - [ ] Insufficient inventory at create.
  - [ ] Capture called with wrong `paypalOrderId`.
  - [ ] Webhook arrives before/after client capture.

---

## 5. Logging, Errors & Privacy

- [ ] No sensitive values (passwords, secrets, full card data) logged.
- [ ] Auth and payment logs are high-level (IDs, statuses, timestamps) only.
- [ ] API errors return generic messages to clients; detailed stacks are logged server-side only.
- [ ] Rate-limit or block repeated failed login attempts (future enhancement).

---

## 6. Advanced Hardening & Infrastructure (Future)

**Traffic & Abuse Prevention**
- [ ] **Rate Limiting**: Implement strict rate limits on:
  - [ ] Login/Signup endpoints (e.g., 5 attempts / minute).
  - [ ] Payment endpoints (`create-order`) to prevent card testing/inventory locking.
- [ ] **Content Security Policy (CSP)**:
  - [ ] Implement strict CSP headers (`script-src`, `connect-src` to allow only PayPal/Stripe/Internal domains).
  - [ ] Report-only mode first, then enforce.

**Data Integrity**
- [ ] **Schema Validation**: Migrating all API inputs to use **Zod** schemas for strict typing and validation.
- [ ] **Expanded Audit Logs**: Ensure payment failures and critical admin actions have detailed metadata (without sensitive fields).

---

---

## 6. Advanced Hardening & Infrastructure (Future)

**Traffic & Abuse Prevention**
- [ ] **Rate Limiting**: Implement strict rate limits on:
  - [ ] Login/Signup endpoints (e.g., 5 attempts / minute).
  - [ ] Payment endpoints (`create-order`) to prevent card testing/inventory locking.
- [ ] **Content Security Policy (CSP)**:
  - [ ] Implement strict CSP headers (`script-src`, `connect-src` to allow only PayPal/Stripe/Internal domains).
  - [ ] Report-only mode first, then enforce.

**Data Integrity**
- [ ] **Schema Validation**: Migrating all API inputs to use **Zod** schemas for strict typing and validation.
- [ ] **Expanded Audit Logs**: Ensure payment failures and critical admin actions have detailed metadata (without sensitive fields).

---

## 7. Workflow When You Notice a Security Oddity

Example: "I opened a private window and I’m already logged in".

1. **Reproduce carefully**
   - Confirm whether the same browser/incognito session had logged in before.
   - Close all private windows and retry to see if state persists.

2. **Inspect cookies**
   - Check which cookies are present (`userSession`, `admin_session`).
   - Verify their attributes (HttpOnly, Secure, SameSite, expiry).

3. **Trace the code path**
   - Identify which endpoints set or clear the cookies.
   - Check middleware/route protection for the area you’re testing.

4. **Decide if behavior is expected**
   - Shared cookies across windows of the same profile are expected.
   - Persisting state across a **fresh** incognito session or different browser is not.

5. **If unexpected, create an issue & patch**
   - Document steps to reproduce, affected routes, and expected behavior.
   - Add/update session checks, cookie settings, or logout flows as needed.
   - Add a test (unit or integration) if possible.

---

## 8. References & Standards

- **OWASP Cheat Sheets** (recommended reading)
  - Session Management Cheat Sheet
  - Authentication Cheat Sheet
  - Authorization Cheat Sheet
  - Secure Coding Practices Quick Reference
- **Payment Practices**
  - Rely on PayPal for card handling (no card data stored locally).
  - Treat PayPal webhooks + client capture as two sources of truth; reconcile safely.

Use this plan as a living document: update it whenever you fix a new class of security issue or introduce a new sensitive feature (payments, admin tools, etc.).
