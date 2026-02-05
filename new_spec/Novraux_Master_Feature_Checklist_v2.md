# Novraux Project - Master Feature Checklist
**Status Update:** February 5, 2026  
**Overall Progress:** Phase 2 (User Features & Admin Operations)  
**Stack:** Next.js 14 + TypeScript + PostgreSQL + Prisma + Redis

---

## 🛠️ Technology Stack

### Core Modern Stack (✅ Implemented)
| Technology | Purpose | Status |
|------------|---------|--------|
| **Next.js 14** | App Router, Server Components, RSC | ✅ Active |
| **React 18** | UI framework with TypeScript | ✅ Active |
| **TypeScript** | Type safety across the stack | ✅ Active |
| **Tailwind CSS** | Utility-first responsive design | ✅ Active |
| **PostgreSQL** | Relational database (products, users, orders) | ✅ Active |
| **Prisma** | Type-safe ORM with migrations | ✅ Active |
| **Redis** | Session storage, caching, rate limiting | ✅ Active |
| **Docker Compose** | Local development environment | ✅ Active |

### Security & Performance (✅ Implemented)
| Component | Implementation | Status |
|-----------|----------------|--------|
| **Authentication** | Custom session-based (DB-backed) | ✅ Active |
| **Password Hashing** | Bcryptjs (10 rounds) | ✅ Active |
| **API Layer** | Next.js Route Handlers (RESTful) | ✅ Active |
| **Testing** | Jest + React Testing Library | ✅ Active |

### Proposed Technologies (🔄 Roadmap)
| Technology | Purpose | Priority | Timeline |
|------------|---------|----------|----------|
| **Vercel** | Production deployment (optimized for Next.js) | 🔥 High | Phase 3 |
| **Sentry** | Error tracking & performance monitoring | 🔥 High | Phase 3 |
| **Axiom / BetterStack** | Centralized logging | Medium | Phase 4 |
| **GitHub Actions** | CI/CD pipeline (test → build → deploy) | 🔥 High | Phase 3 |
| **Stripe** | Payment processing | 🔥 Critical | Phase 2 |
| **Resend / SendGrid** | Transactional emails | 🔥 High | Phase 2 |
| **Cloudinary** | Image optimization & CDN | Medium | Phase 3 |
| **Playwright** | E2E testing for critical flows | Medium | Phase 3 |

---

## ✅ Implemented & Verified Features

### 🔐 Authentication & Security

| Feature | Acceptance Criteria | Status | Notes |
|---------|---------------------|--------|-------|
| **Admin Authentication** | Login with email/password, session tracking, audit logs | ✅ Done | `/admin` routes protected |
| **User Authentication** | Signup, Login, Logout with secure sessions | ✅ Done | `/account` routes protected |
| **Middleware Protection** | Route guards for admin & user areas | ✅ Done | Redirects to login if unauthorized |
| **Password Security** | Bcryptjs (10 rounds), secure HTTP-only cookies | ✅ Done | CSRF protection via SameSite cookies |
| **Audit Logging** | Auth events tracked (login, logout, failures) | ✅ Done | Stored in `audit_logs` table |
| **Session Management** | Redis-backed sessions with TTL, auto-renewal | ✅ Done | 7-day expiry with activity refresh |

**Schema:**
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String?
  role          Role     @default(CUSTOMER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  sessions      Session[]
  orders        Order[]
  cart          Cart?
  wishlist      Wishlist?
  addresses     Address[]
}

model Session {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token       String   @unique
  expiresAt   DateTime
  lastActivityAt DateTime @default(now())
  createdAt   DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // "LOGIN", "LOGOUT", "PASSWORD_CHANGE", etc.
  ipAddress String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())
}

enum Role {
  CUSTOMER
  ADMIN
  SUPER_ADMIN
}
```

---

### 👤 Profile & Account Management

| Feature | Acceptance Criteria | Status | Technical Details |
|---------|---------------------|--------|-------------------|
| **Account Dashboard** | View name, email, order count, join date | ✅ Done | `/account` route |
| **Profile Updates** | Edit name, email (with verification), phone | ✅ Done | Server Action with validation |
| **Password Change** | Current password verification + new password | ✅ Done | Bcryptjs comparison + rehash |
| **Session Viewer** | See active sessions, revoke old sessions | 🔄 Planned | Phase 2 - Security enhancement |
| **Address Book** | CRUD for shipping/billing addresses | 🔄 Planned | Phase 2 - Checkout prerequisite |
| **Email Preferences** | Opt-in/out of marketing emails | 🔄 Planned | Phase 3 - Marketing |

**Proposed Schema Additions:**
```prisma
model Address {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        AddressType // SHIPPING, BILLING
  isDefault   Boolean  @default(false)
  fullName    String
  addressLine1 String
  addressLine2 String?
  city        String
  state       String
  postalCode  String
  country     String   @default("US")
  phone       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum AddressType {
  SHIPPING
  BILLING
}
```

---

### 🛍️ Product Exploration

| Feature | Acceptance Criteria | Status | Technical Details |
|---------|---------------------|--------|-------------------|
| **Product Catalog** | Display all products with pagination | ✅ Done | Server Component + API route |
| **Product Details** | Individual product page with images, description, price | ✅ Done | Dynamic route `/products/[slug]` |
| **Category System** | Products grouped by category | ✅ Schema | Frontend pending |
| **Product Images** | Multiple images per product, AI-generated luxury aesthetic | ✅ Done | Stored as JSON array in DB |
| **Inventory Display** | Show stock status (In Stock / Low Stock / Out of Stock) | 🔄 Planned | Phase 2 - Cart prerequisite |
| **Product Variants** | Size, color variations with separate SKUs | 🔄 Planned | Phase 2 - Advanced |

**Current Schema:**
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  images      Json     // Array of image URLs
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cartItems   CartItem[]
  orderItems  OrderItem[]
  wishlistItems WishlistItem[]
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  products  Product[]
  createdAt DateTime  @default(now())
}
```

**Proposed Enhancements (Phase 2):**
```prisma
model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku         String   @unique
  size        String?
  color       String?
  material    String?
  price       Decimal? @db.Decimal(10, 2) // Override product price
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cartItems   CartItem[]
  orderItems  OrderItem[]
}
```

---

### 🎨 UI/UX & Design System

| Component | Implementation | Status | Notes |
|-----------|----------------|--------|-------|
| **Typography** | Cormorant Garamond (headings) + Inter (body) | ✅ Done | Matches coming soon page |
| **Color Palette** | Dark luxury: `#0a0a0a`, `#e8e4df`, `#c9a96e` | ✅ Done | Tailwind config |
| **Header/Footer** | Responsive navigation with User Menu + Cart | ✅ Done | Sticky header, minimal footer |
| **Loading States** | Skeleton loaders, spinners, form feedback | ✅ Done | Tailwind animations |
| **Error Handling** | Toast notifications, form validation errors | ✅ Done | React Hook Form + Zod |
| **Accessibility** | ARIA labels, keyboard navigation, focus states | 🔄 Partial | Needs audit in Phase 3 |
| **Dark Mode Toggle** | User preference for light/dark theme | 🔄 Planned | Phase 3 - Enhancement |

---

## 🚀 Roadmap: Planned Functionalities

### 🛒 Phase 2A: Shopping Cart & Checkout (PRIORITY)

| Feature | Acceptance Criteria | Priority | Technical Approach |
|---------|---------------------|----------|-------------------|
| **Persistent Cart** | Cart saved to DB, syncs across devices | 🔥 Critical | `Cart` + `CartItem` models |
| **Add to Cart** | Products added with quantity, variant selection | 🔥 Critical | Server Action + optimistic UI |
| **Cart Management** | Update quantity, remove items, clear cart | 🔥 Critical | CRUD operations via API |
| **Cart UI** | Drawer/modal with line items, subtotal, taxes | 🔥 Critical | Headless UI + Tailwind |
| **Guest Cart** | Session-based cart for non-logged-in users | High | Redis or localStorage → DB on login |
| **Cart Abandonment** | Email reminder after 24h if cart not checked out | Medium | Cron job + email service |

**Schema:**
```prisma
model Cart {
  id        String     @id @default(cuid())
  userId    String?    @unique
  user      User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId String?    @unique // For guest carts
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id         String   @id @default(cuid())
  cartId     String
  cart       Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  variantId  String?  // If using variants
  quantity   Int      @default(1)
  addedAt    DateTime @default(now())
  
  @@unique([cartId, productId, variantId])
}
```

---

### 💳 Phase 2B: Checkout & Payments (PRIORITY)

| Feature | Acceptance Criteria | Priority | Integration |
|---------|---------------------|----------|-------------|
| **Checkout Flow** | Multi-step: Cart → Shipping → Payment → Review → Confirm | 🔥 Critical | React Hook Form + state machine |
| **Address Selection** | Choose from saved addresses or add new | 🔥 Critical | Address Book UI |
| **Shipping Options** | Standard, Express with calculated costs | High | Hardcoded rates initially, then API |
| **Payment Integration** | Stripe Elements (card, Apple Pay, Google Pay) | 🔥 Critical | Stripe SDK + Webhooks |
| **Order Confirmation** | Success page with order number, email receipt | 🔥 Critical | Email service (Resend/SendGrid) |
| **Tax Calculation** | Auto-calculate based on shipping address | Medium | Tax API (TaxJar) or manual rates |
| **Promo Codes** | Apply discount codes at checkout | Medium | `Promotion` model |

**Schema:**
```prisma
model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique // e.g., "NOV-2026-00001"
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
  status          OrderStatus @default(PENDING)
  subtotal        Decimal     @db.Decimal(10, 2)
  tax             Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @db.Decimal(10, 2)
  discount        Decimal     @db.Decimal(10, 2) @default(0)
  total           Decimal     @db.Decimal(10, 2)
  promoCode       String?
  shippingAddress Json        // Snapshot of address at order time
  billingAddress  Json?
  paymentIntentId String?     // Stripe Payment Intent ID
  paymentStatus   PaymentStatus @default(PENDING)
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  shippedAt       DateTime?
  deliveredAt     DateTime?
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  variantId   String? // Snapshot of variant
  quantity    Int
  priceAtTime Decimal @db.Decimal(10, 2) // Lock price at order time
  name        String  // Snapshot of product name
  image       String? // Snapshot of product image
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  AUTHORIZED
  CAPTURED
  FAILED
  REFUNDED
}

model Promotion {
  id          String   @id @default(cuid())
  code        String   @unique
  description String?
  discountType DiscountType // PERCENTAGE, FIXED_AMOUNT
  discountValue Decimal @db.Decimal(10, 2)
  minOrderValue Decimal? @db.Decimal(10, 2)
  maxUses     Int?
  usedCount   Int      @default(0)
  startsAt    DateTime
  expiresAt   DateTime
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

**Stripe Integration Plan:**
1. Install `stripe` package: `npm install stripe @stripe/stripe-js`
2. Create Stripe Payment Intent on checkout initiation
3. Use Stripe Elements for secure card input
4. Handle webhooks for async payment confirmation
5. Store `paymentIntentId` on Order for reconciliation

---

### 📦 Phase 2C: Order Management

| Feature | Acceptance Criteria | Priority | User Type |
|---------|---------------------|----------|-----------|
| **Order History** | Customer can view past orders with status | 🔥 High | Customer |
| **Order Details** | View line items, shipping info, tracking | 🔥 High | Customer |
| **Order Tracking** | Real-time status updates (Processing → Shipped → Delivered) | Medium | Customer |
| **Admin Order Dashboard** | View all orders, filter by status, search by order # | 🔥 Critical | Admin |
| **Order Fulfillment** | Mark orders as shipped, add tracking number | 🔥 Critical | Admin |
| **Order Cancellation** | Customer can cancel within 1 hour of ordering | Medium | Customer |
| **Refund Processing** | Admin can issue full/partial refunds | Medium | Admin |
| **Invoice Generation** | Auto-generate PDF invoices | Low | Customer |

**API Endpoints Needed:**
```typescript
// Customer routes
GET    /api/orders              // List user's orders
GET    /api/orders/[id]         // Order details
POST   /api/orders/[id]/cancel  // Cancel order

// Admin routes
GET    /api/admin/orders        // All orders with filters
PATCH  /api/admin/orders/[id]   // Update order status
POST   /api/admin/orders/[id]/refund // Issue refund
```

---

### 🔍 Phase 3A: Search & Discovery

| Feature | Acceptance Criteria | Priority | Technical Approach |
|---------|---------------------|----------|-------------------|
| **Global Search** | Search products by name, description, category | High | PostgreSQL full-text search or Algolia |
| **Search Autocomplete** | Instant suggestions as user types | Medium | Debounced API + Redis cache |
| **Advanced Filters** | Filter by category, price range, color, size | High | Query params + Prisma `where` clauses |
| **Sorting Options** | Sort by: Newest, Price (low/high), Popular | High | Prisma `orderBy` |
| **Recommendation Engine** | "You might also like" based on cart/browsing | Medium | Collaborative filtering or rule-based |
| **Recently Viewed** | Track and display recently viewed products | Low | Redis or client-side storage |

**Search Implementation Options:**
1. **PostgreSQL Full-Text Search** (Free, built-in)
   - Pros: No external service, works with existing DB
   - Cons: Limited relevance tuning, slower at scale
   
2. **Algolia** (Free tier: 10k searches/month)
   - Pros: Blazing fast, typo-tolerance, faceted search
   - Cons: External dependency, paid after free tier
   
3. **MeiliSearch** (Open source, self-hosted)
   - Pros: Fast, typo-tolerant, free forever
   - Cons: Requires separate service (Docker container)

**Recommendation:** Start with PostgreSQL, migrate to MeiliSearch in Phase 4 if needed.

---

### ✍️ Phase 3B: Content & Engagement

| Feature | Acceptance Criteria | Priority | Technical Approach |
|---------|---------------------|----------|-------------------|
| **Luxury Journal (Blog)** | Full CMS for editorial content, lookbooks, brand stories | High | Prisma models + rich text editor |
| **Content SEO** | Each article optimized with meta tags, schema, sitemap | 🔥 Critical | Next.js Metadata API |
| **Wishlist** | Save products for later, persist across sessions | Medium | `Wishlist` + `WishlistItem` models |
| **Product Reviews** | Customers can rate and review products | Medium | `Review` model with moderation |
| **Email Newsletter** | Signup form + automated sends | Medium | Resend + Mailchimp/Loops |
| **Transactional Emails** | Order confirmation, shipping updates, password reset | 🔥 Critical | Resend with React Email templates |

**Blog Schema:**
```prisma
model Article {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  excerpt     String?
  content     String   @db.Text // Rich text (HTML or Markdown)
  coverImage  String?
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  categoryId  String?
  category    ArticleCategory? @relation(fields: [categoryId], references: [id])
  tags        String[] // Array of tag strings
  metaTitle   String?
  metaDescription String?
  isPublished Boolean  @default(false)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ArticleCategory {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  articles Article[]
}

model Wishlist {
  id        String         @id @default(cuid())
  userId    String         @unique
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  addedAt    DateTime @default(now())
  
  @@unique([wishlistId, productId])
}

model Review {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  rating      Int      // 1-5 stars
  title       String?
  comment     String?  @db.Text
  isVerified  Boolean  @default(false) // Verified purchase
  isApproved  Boolean  @default(false) // Admin moderation
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Email Templates (React Email):**
```tsx
// emails/OrderConfirmation.tsx
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export default function OrderConfirmation({ orderNumber, items, total }) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Order Confirmed</Text>
          <Text>Thank you for your order #{orderNumber}</Text>
          {/* Render items, total, etc. */}
          <Button href={`https://novraux.com/orders/${orderNumber}`}>
            View Order Details
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

---

### 🛠️ Phase 3C: Admin Dashboard

| Feature | Acceptance Criteria | Priority | Technical Approach |
|---------|---------------------|----------|-------------------|
| **Sales Dashboard** | Revenue charts, orders today/week/month | High | Chart.js or Recharts + aggregate queries |
| **Product Management** | CRUD for products, bulk upload via CSV | 🔥 Critical | Admin UI + file upload |
| **Inventory Alerts** | Notifications for low stock products | Medium | Scheduled job + email |
| **Customer Management** | View customer list, order history, LTV | Medium | Admin table with search/filter |
| **Analytics Integration** | Google Analytics 4, conversion tracking | Medium | Next.js Script component |
| **Admin Audit Logs** | Track all admin actions (edits, deletions) | Medium | Extend `AuditLog` model |

**Dashboard Metrics:**
```typescript
// Example aggregation query
const todayRevenue = await prisma.order.aggregate({
  where: {
    createdAt: { gte: startOfDay(new Date()) },
    paymentStatus: 'CAPTURED'
  },
  _sum: { total: true }
});

const topProducts = await prisma.orderItem.groupBy({
  by: ['productId'],
  _sum: { quantity: true },
  orderBy: { _sum: { quantity: 'desc' } },
  take: 10
});
```

---

### 🧪 Phase 4: Testing & Observability

| Component | Implementation | Priority | Tools |
|-----------|----------------|----------|-------|
| **E2E Testing** | Critical flows: Login → Add to Cart → Checkout → Order Confirmation | High | Playwright |
| **Integration Tests** | API route testing, DB interactions | Medium | Jest + Supertest |
| **Performance Monitoring** | Real-time error tracking, performance metrics | 🔥 Critical | Sentry |
| **Logging** | Centralized logs for debugging | Medium | Axiom or BetterStack |
| **Uptime Monitoring** | Alert on downtime | Low | UptimeRobot (free) |

**Playwright E2E Test Example:**
```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@novraux.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 2. Add product to cart
  await page.goto('/products/luxury-leather-jacket');
  await page.click('[data-testid="add-to-cart"]');
  
  // 3. Go to checkout
  await page.click('[data-testid="cart-icon"]');
  await page.click('[data-testid="checkout-button"]');
  
  // 4. Fill shipping info
  await page.fill('[name="addressLine1"]', '123 Fashion Ave');
  await page.fill('[name="city"]', 'New York');
  // ... fill rest of form
  
  // 5. Complete payment (use Stripe test mode)
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="cardExpiry"]', '12/34');
  await page.fill('[name="cardCvc"]', '123');
  await page.click('[data-testid="place-order"]');
  
  // 6. Verify order confirmation
  await expect(page).toHaveURL(/\/orders\/NOV-/);
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

---

## 📊 Phase-by-Phase Breakdown

### Phase 2A: Cart & Checkout (Weeks 1-3)
**Goal:** Enable customers to purchase products

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Cart System | Persistent cart, add/update/remove items |
| 2 | Checkout Flow | Address book, shipping options, order review |
| 3 | Stripe Integration | Payment processing, webhooks, order confirmation |

**Acceptance Criteria:**
- [ ] User can add products to cart
- [ ] Cart persists across sessions
- [ ] Multi-step checkout with address selection
- [ ] Stripe payment works (test mode)
- [ ] Order confirmation email sent
- [ ] Order appears in user's order history

---

### Phase 2B: Order Management (Weeks 4-5)
**Goal:** Admin can fulfill orders, customers can track orders

| Week | Focus | Deliverables |
|------|-------|--------------|
| 4 | Customer Order Pages | Order history, order details, tracking |
| 5 | Admin Dashboard | Order management, fulfillment, refunds |

**Acceptance Criteria:**
- [ ] Customer can view all past orders
- [ ] Customer can see order status updates
- [ ] Admin can mark orders as shipped with tracking
- [ ] Admin can issue refunds via Stripe
- [ ] Email notifications on status changes

---

### Phase 3A: Content & SEO (Weeks 6-7)
**Goal:** Launch blog for SEO, improve discoverability

| Week | Focus | Deliverables |
|------|-------|--------------|
| 6 | Blog CMS | Article creation, publishing, categories |
| 7 | SEO & Search | Product search, filters, meta optimization |

**Acceptance Criteria:**
- [ ] Admin can create and publish blog articles
- [ ] Articles appear in sitemap.xml
- [ ] Meta tags and Open Graph set for all pages
- [ ] Product search works with autocomplete
- [ ] Filters work (category, price range)

---

### Phase 3B: Engagement (Weeks 8-9)
**Goal:** Increase customer retention and LTV

| Week | Focus | Deliverables |
|------|-------|--------------|
| 8 | Wishlist & Reviews | Save for later, product ratings |
| 9 | Email Automation | Newsletter, cart abandonment, order updates |

**Acceptance Criteria:**
- [ ] Users can add products to wishlist
- [ ] Users can leave verified reviews
- [ ] Newsletter signup form works
- [ ] Transactional emails send reliably
- [ ] Cart abandonment email sent after 24h

---

### Phase 4: Launch Readiness (Weeks 10-12)
**Goal:** Production deployment, monitoring, optimization

| Week | Focus | Deliverables |
|------|-------|--------------|
| 10 | Testing | E2E tests, load testing, bug fixes |
| 11 | Deployment | Vercel production, DNS, SSL, monitoring |
| 12 | Optimization | Performance tuning, SEO audit, analytics |

**Acceptance Criteria:**
- [ ] All E2E tests pass
- [ ] Site loads in <2s (Lighthouse score >90)
- [ ] Sentry error tracking active
- [ ] Google Analytics + Search Console set up
- [ ] Domain (novraux.com) points to production
- [ ] Sitemap submitted to Google
- [ ] First 10 products live with full descriptions
- [ ] First 3 blog articles published

---

## 🎯 Success Metrics

### Technical KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time** | <2s (LCP) | Lighthouse / Vercel Analytics |
| **API Response Time** | <200ms (p95) | Sentry Performance |
| **Uptime** | 99.9% | UptimeRobot |
| **Error Rate** | <0.1% | Sentry |
| **Test Coverage** | >80% | Jest |

### Business KPIs (Post-Launch)
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Conversion Rate** | >2% | Google Analytics |
| **Average Order Value** | $150+ | Stripe Dashboard |
| **Cart Abandonment** | <70% | Custom analytics |
| **Email Open Rate** | >25% | Resend Analytics |
| **Organic Traffic** | 500/month (Month 3) | Google Search Console |

---

## 🔐 Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| **HTTPS Everywhere** | 🔄 Pending | Vercel auto-provision SSL |
| **Rate Limiting** | ✅ Done | Redis-based (100 req/min per IP) |
| **SQL Injection Prevention** | ✅ Done | Prisma parameterized queries |
| **XSS Protection** | ✅ Done | React auto-escapes, CSP headers |
| **CSRF Protection** | ✅ Done | SameSite cookies + token validation |
| **Password Policy** | ✅ Done | Min 8 chars, bcrypt 10 rounds |
| **Secure Headers** | 🔄 Pending | Helmet.js or Next.js config |
| **Dependency Scanning** | 🔄 Pending | GitHub Dependabot |
| **PCI Compliance** | ✅ N/A | Stripe handles card data |

---

## 📚 Documentation Needs

| Document | Priority | Status |
|----------|----------|--------|
| **API Documentation** | High | 🔄 In Progress |
| **Database Schema Diagram** | Medium | 🔄 Planned |
| **Deployment Runbook** | High | 🔄 Planned |
| **Environment Setup Guide** | Medium | ✅ Done (Docker Compose) |
| **Contributing Guidelines** | Low | 🔄 Planned |
| **Incident Response Plan** | Medium | 🔄 Planned |

---

## 🚀 Next Immediate Actions (This Week)

1. **Implement Cart System**
   - [ ] Create `Cart` and `CartItem` Prisma models
   - [ ] Build API routes: `POST /api/cart`, `PATCH /api/cart/[itemId]`, `DELETE /api/cart/[itemId]`
   - [ ] Create Cart UI component (drawer with line items)
   - [ ] Add "Add to Cart" button to product pages

2. **Set Up Stripe**
   - [ ] Create Stripe account (test mode)
   - [ ] Install `stripe` and `@stripe/stripe-js` packages
   - [ ] Create Payment Intent API route
   - [ ] Build Stripe Elements checkout form

3. **Address Book**
   - [ ] Create `Address` Prisma model
   - [ ] Build address CRUD API routes
   - [ ] Create address management UI in `/account/addresses`

4. **Checkout Flow**
   - [ ] Build multi-step checkout UI (Cart → Shipping → Payment → Review)
   - [ ] Integrate address selection
   - [ ] Calculate shipping costs
   - [ ] Connect to Stripe payment

5. **Order Confirmation**
   - [ ] Set up Resend account
   - [ ] Create React Email templates
   - [ ] Build order confirmation API route
   - [ ] Send confirmation email after successful payment

---

## 💡 Technical Debt & Future Optimizations

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| **Image Optimization** | Move to Cloudinary for CDN + transforms | Medium | Phase 3 |
| **Database Indexing** | Add indexes on frequently queried fields | High | Phase 2 |
| **Caching Strategy** | Redis cache for product catalog | Medium | Phase 3 |
| **GraphQL API** | Replace REST with GraphQL for flexible queries | Low | Phase 5+ |
| **Mobile App** | React Native app for iOS/Android | Low | Phase 6+ |
| **Internationalization** | Multi-language support | Low | Phase 5+ |

---

## 📞 Support & Resources

**For Development:**
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Stripe Docs:** https://stripe.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

**For Deployment:**
- **Vercel Docs:** https://vercel.com/docs
- **Sentry Setup:** https://docs.sentry.io/platforms/javascript/guides/nextjs/

**For Collaboration:**
- **GitHub Repo:** [Link to your repo]
- **Slack/Discord:** [If applicable]
- **Project Management:** [Linear/Jira/Notion]

---

**Last Updated:** February 5, 2026  
**Document Owner:** Novraux Engineering Team  
**Version:** 2.0
