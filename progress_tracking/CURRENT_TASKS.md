# Current Tasks - Phase 4 Continued

**Period**: February 6, 2026 onwards  
**Status**: 🟡 Active Development  

---

## 🔴 High Priority - This Week

### User Account & Orders (Customer-Facing)

- [ ] User account page (`/account`) — view profile, edit details
- [ ] User order history page (`/account/orders`) — list past orders with status
- [ ] User order detail page (`/account/orders/[id]`) — items, tracking, payment info
- [ ] Post-checkout email confirmation (or at least placeholder trigger)
- **Estimated**: 6-8 hours
- **Owner**: TBD
- **Status**: Ready to start

### Admin Panel Polish

- [ ] Wire Activity Feed to real audit logs (replace static data)
- [ ] Admin users list page — improve UI consistency
- [ ] Admin products list — add product thumbnails and inventory badges
- [ ] Mobile-responsive admin sidebar (hamburger menu on small screens)
- **Estimated**: 4-6 hours
- **Owner**: TBD
- **Status**: Ready to start

---

## 🟡 Medium Priority - Next 2 Weeks

### Checkout & Payment Enhancements

- [ ] Cart quantity update + remove items on checkout step 1
- [ ] Order confirmation email integration (e.g. Resend / Nodemailer)
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

## 🟢 Low Priority - Later

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
