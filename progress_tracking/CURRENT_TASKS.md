# Current Tasks - Phase 4 Continued

**Period**: February 6, 2026 onwards  
**Status**: 🟡 Active Development  

---

## 🔴 High Priority - This Week

### User Account & Orders (Customer-Facing)

- [x] User account page (`/account`) — view profile, edit details
- [x] User order history page (`/account/orders`) — list past orders with status
- [x] User order detail page (`/account/orders/[id]`) — items, tracking, payment info
- [x] Post-checkout email confirmation (triggered via PayPal webhook)
- **Estimated**: 6-8 hours
- **Owner**: Active
- **Status**: ✅ Complete

### Admin Panel Polish
- [x] Wire Activity Feed to real audit logs (replace static data)
- [x] Admin users list page — improve UI consistency (Added filtering/search)
- [x] Admin products list — add product thumbnails and inventory badges
- [ ] Mobile-responsive admin sidebar (hamburger menu on small screens)
- **Estimated**: 4-6 hours
- **Owner**: TBD
- **Status**: In progress

---

## 🟡 Medium Priority - Next 2 Weeks

### Checkout & Payment Enhancements

### Checkout & Payment Enhancements

- [ ] Cart quantity update + remove items on checkout step 1
- [x] Order confirmation email integration (via PayPal Webhook)
- [ ] PayPal webhook signature verification (security)
- [ ] Coupon / discount code system
- **Estimated**: 8-10 hours
- **Owner**: TBD
- **Status**: Not started

### SEO UX Improvements (Phase 3.2 Carry-Over)

- [ ] Add SEO fields to Category Editor form
- [ ] Character counters and health indicator on Category Form
- [ ] Validation warnings (length checks) across all content forms
- **Estimated**: 4-6 hours
- **Owner**: TBD
- **Status**: Not started

---

## � High Priority - Auth Security Hardening

### Phase 1 — Critical Security Fixes
- [x] 1.1 Rate limiting on auth endpoints (5 login/15min, 3 signup/hr)
- [x] 1.2 Account lockout after 5 failed attempts (15 min cooldown)
- [x] 1.3 Middleware protection for `/account/*` user routes
- [x] 1.4 Replace `jwt.ts` base64 with proper signed JWTs (`jose`)
- [x] 1.5 Session token rotation on sensitive actions
- [x] 1.6 Password strength validation (min 8, upper/lower/number)
- **Estimated**: 4-6 hours
- **Owner**: Active
- **Status**: ✅ Complete

### Phase 2 — Password Recovery & Email Verification
- [x] 2.1 Update Prisma schema with token fields (emailVerificationToken, passwordResetToken + expiry)
- [x] 2.2 Extend email utility with sendPasswordResetEmail() and sendVerificationEmail()
- [x] 2.3 Forgot password page + API route (`/auth/forgot-password`)
- [x] 2.4 Password reset page + API route (`/auth/reset-password`)
- [x] 2.5 Email verification on signup (send verification email)
- [x] 2.6 Verify email endpoint (`/api/auth/user/verify-email`)
- [x] 2.7 Resend verification email API (`/api/auth/user/resend-verification`)
- [x] 2.8 Email verification banner on account page for unverified users
- **Estimated**: 4-6 hours
- **Owner**: Active
- **Status**: ✅ Complete

### Phase 3 — OAuth / Social Login Providers
- [x] 3.1 Google OAuth ("Sign in with Google") - Implemented
- [x] 3.2 Twitter/X OAuth ("Sign in with X") - Implemented
- [x] 3.3 Facebook OAuth ("Sign in with Facebook") - Implemented
- [x] 3.4 Schema update — add `OAuthAccount` model to Prisma
- [x] 3.5 Account linking (existing users can link social accounts)
- [x] 3.6 Account unlinking with safety checks
- [x] 3.7 OAuth button components
- [x] 3.8 Linked accounts UI in account page
- [ ] 3.9 Configure OAuth credentials in .env
- [ ] 3.10 Test OAuth flows end-to-end
- **Branch**: `feature/oauth-social-auth` (pushed to GitHub)
- **Files**: 17 files, 1,171 insertions
- **Status**: 🟡 Paused - Awaiting OAuth credentials

### Phase 4 — Advanced Hardening
- [ ] 4.1 CSRF tokens for state-changing requests
- [ ] 4.2 Security headers (CSP, HSTS, X-Frame-Options)
- [ ] 4.3 Session management UI (view/revoke active sessions)
- [ ] 4.4 Admin 2FA (TOTP authenticator app)
- [ ] 4.5 Suspicious login alerts (email on new IP/device)
- **Estimated**: 6-8 hours
- **Owner**: TBD
- **Status**: Not started

---

## �🟢 Low Priority - Later

### Advanced Features

- [ ] Bulk SEO editor UI
- [ ] SEO audit dashboard
- [ ] Duplicate finder (meta descriptions)
- [ ] Wishlist / Save for Later
- [ ] Product reviews & ratings
- [ ] Analytics dashboard (Google Analytics integration)
- [ ] Multi-currency support

---

## 📋 Template for New Tasks

When adding new tasks, use this format:

```
### Task Name
- [ ] Subtask 1
- [ ] Subtask 2
- [ ] Subtask 3
- **Estimated**: X hours
- **Owner**: Name or TBD
- **Blocker**: If applicable
- **Status**: Not started / In progress / Blocked / Complete
```

---

## 🔄 Status Legend

| Status | Meaning |
|--------|---------|
| Not started | No work has begun |
| In progress | Currently being worked on |
| Blocked | Waiting for something else |
| Complete | Task is done and tested |

---

## 📝 Notes

- Tasks estimated in hours
- Owner should be assigned before starting
- Move completed tasks to COMPLETED_TASKS.md weekly
- Report blockers immediately in BLOCKAGES.md
