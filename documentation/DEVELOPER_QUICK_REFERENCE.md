# Developer Quick Reference & Implementation Checklist

**Document**: Developer Quick Reference Guide  
**Date**: February 5, 2026  
**Project**: Novraux E-commerce Platform

---

## 🚀 QUICK START (5 MINUTES)

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup database (one-time)
npm run db:migrate
npm run db:seed

# 3. Start development server
npm run dev

# 4. Open browser
open http://localhost:3001
```

### Key Directories
```
app/        → Pages & API routes
lib/        → Services & utilities
components/ → Reusable UI components
prisma/     → Database schema & migrations
contexts/   → React Context state management
```

---

## 📊 ARCHITECTURE AT A GLANCE

### Tech Stack
- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL 16 (Supabase)
- **ORM**: Prisma 5.22
- **Deployment**: Vercel (automatic on git push)

### Data Flow
```
User Browser
    ↓ (HTTP/JSON)
Next.js API Routes
    ↓ (Prisma ORM)
PostgreSQL Database
```

---

## 🔐 AUTHENTICATION REFERENCE

### Session Flow
1. **Signup/Login** → POST `/api/auth/user/signup` or `/api/auth/user/login`
2. **Browser** → Auto-stores `sessionToken` HTTP-only cookie
3. **Protected Routes** → Middleware validates session before allowing access
4. **Logout** → POST `/api/auth/user/logout` → Session deleted

### Key Files
- `lib/auth.ts` - Authentication logic
- `middleware.ts` - Route protection
- `app/api/auth/*` - Auth endpoints

### Protected Routes Pattern
```typescript
// In middleware.ts
if (pathname.startsWith('/admin')) {
  const session = validateAdminSession(request);
  if (!session) return redirect('/admin/login');
}
```

---

## 📦 COMMON WORKFLOWS

### Add New Page
```
1. Create file in app/[section]/page.tsx
2. Use <> or <div> as root (no layout wrapper needed)
3. If protected, middleware.ts will check auth
4. Server component by default
```

### Add New API Endpoint
```
1. Create file: app/api/[section]/[action]/route.ts
2. Export: export async function GET/POST/PUT/DELETE(req)
3. Return: NextResponse.json({data}, {status})
4. Remember: Server functions have access to database
```

### Add Component
```
1. Create in components/YourComponent.tsx
2. If uses hooks (useState, useEffect), add 'use client'
3. If uses context, add 'use client' + import context
4. Props should be typed with interfaces
```

### Database Migration
```bash
# 1. Modify prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name description_of_change

# 3. Test locally
npm run dev

# 4. Push to production
# (Automatic on git push to Vercel)
```

---

## 📋 DATA MODELS REFERENCE

### User
```typescript
id: string (CUID)
email: string (unique)
password: string (bcrypt hashed)
firstName, lastName: string
avatar, phone: string (optional)
createdAt, updatedAt: DateTime
```

### Product
```typescript
id: string
name, slug: string
price: Decimal(10,2)
description: string (optional)
imageUrl, categoryId: string
SEO fields: keywords, metaTitle, metaDescription, focusKeyword, ogImage
createdAt, updatedAt, deletedAt?: DateTime
```

### Cart & CartItem
```typescript
Cart:
  id, userId
  items: CartItem[]

CartItem:
  id, cartId, productId, quantity
  product: Product (relation)
```

### Order & OrderItem
```typescript
Order:
  id, userId
  subtotal, tax, shipping, total: Decimal
  status: enum (pending, paid, processing, shipped, delivered, cancelled, refunded)
  paymentStatus: enum
  paymentId, shippingAddress (JSON)
  createdAt, updatedAt
  items: OrderItem[]

OrderItem:
  id, orderId, productId
  quantity: Int
  priceAtPurchase: Decimal (snapshot)
```

---

## 🎯 COMMON OPERATIONS

### Fetch User's Cart
```typescript
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized();
  
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } }
  });
  
  return json({ cart });
}
```

### Create Order
```typescript
const order = await prisma.order.create({
  data: {
    userId,
    subtotal: totals.subtotal,
    tax: totals.tax,
    shipping: totals.shipping,
    total: totals.total,
    status: 'pending',
    paymentStatus: 'pending',
    shippingAddress: JSON.stringify(address),
    items: {
      createMany: {
        data: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price
        }))
      }
    }
  }
});
```

### Get Published Blog Posts
```typescript
const posts = await prisma.post.findMany({
  where: { publishedAt: { not: null } },
  orderBy: { publishedAt: 'desc' },
  take: 10
});
```

### Validate Input
```typescript
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (!email || !validateEmail(email)) {
  return json(
    { success: false, error: { code: 'INVALID_EMAIL' } },
    { status: 400 }
  );
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Current Status: 68% Complete


#### ✅ COMPLETED (Phases 1-3)

**Authentication & Users**
- [x] User signup with email/password
- [x] User login with bcrypt verification
- [x] Logout functionality
- [x] Session management (HTTP-only cookies)
- [x] Current user endpoint (/api/auth/user/me)
- [x] Admin authentication system
- [x] Admin session management
- [x] Password reset functionality (admin)

**Products & Catalog**
- [x] Product CRUD (create, read, update, delete)
- [x] Product listing with pagination
- [x] Product detail pages
- [x] Category system
- [x] Product search
- [x] Product images
- [x] SEO fields (meta title, description, keywords)
- [x] AI SEO generation for products

**Shopping Cart**
- [x] Add to cart
- [x] View cart
- [x] Update quantity
- [x] Remove from cart
- [x] Cart persistence (database-backed)
- [x] Cart drawer in header
- [x] CartContext for global state

**Blog System**
- [x] Blog post CRUD
- [x] Blog post publishing (with publishedAt)
- [x] Blog listing page (filtered by publishedAt)
- [x] Blog post detail pages
- [x] SEO fields for posts
- [x] AI content generation
- [x] Cache invalidation on updates
- [x] Draft articles (unpublished)

**Admin Features**
- [x] Admin dashboard
- [x] Admin login/logout
- [x] Product management
- [x] Blog post management
- [x] Category management
- [x] User audit logs
- [x] Admin audit logs
- [x] Session management interface

**Checkout System (Phase 4A)**
- [x] Checkout flow (4 steps)
- [x] Cart validation endpoint
- [x] Create payment intent
- [x] Order creation
- [x] OrderItem creation with price snapshot
- [x] Checkout success page
- [x] Shipping address form
- [x] Order total calculation (subtotal, tax, shipping)
- [x] Cart clearing after order
- [x] Order status tracking

**Deployment**
- [x] Vercel deployment setup
- [x] Database migrations
- [x] Environment variables
- [x] Production database (Supabase)

---

#### ⏳ IN PROGRESS / TODO (Phases 4B-5)

**Payment Integration (Phase 4B - HIGH PRIORITY)**
- [ ] Stripe SDK setup (@stripe/stripe-js)
- [ ] Stripe API key configuration
- [ ] Stripe payment element in checkout
- [ ] Create Stripe payment intent API
- [ ] Verify Stripe payment in complete endpoint
- [ ] Handle payment failures
- [ ] Refund handling
- [ ] Test payment flow end-to-end
- [ ] Production Stripe account setup

**Email Notifications (Phase 4B)**
- [ ] SendGrid/Mailgun setup
- [ ] Order confirmation email template
- [ ] Email sending on order complete
- [ ] Shipping notification email
- [ ] Delivery confirmation email
- [ ] Email unsubscribe handling
- [ ] Email template testing

**Inventory Management (Phase 4C)**
- [ ] Add `stock` field to Product model
- [ ] Decrease stock on order creation
- [ ] Prevent overselling
- [ ] Low stock warnings
- [ ] Stock level admin dashboard
- [ ] Restock notifications
- [ ] Inventory audit log

**Customer Features (Phase 4C)**
- [ ] Customer order history page (/account/orders)
- [ ] Order detail view
- [ ] Track order status
- [ ] Download invoice
- [ ] Reorder functionality
- [ ] Change password page
- [ ] Profile management
- [ ] Wishlist (future)
- [ ] Product reviews (future)

**Admin Order Management (Phase 4D)**
- [ ] Admin order dashboard (/admin/orders)
- [ ] Order listing with filters
- [ ] Order detail view
- [ ] Update order status manually
- [ ] Generate shipping labels
- [ ] Refund order
- [ ] Print packing slip
- [ ] Order analytics

**Product Variants (Phase 5)**
- [ ] Create ProductVariant model
- [ ] Variant selector in product detail
- [ ] Variant options (size, color, etc.)
- [ ] Variant-specific pricing
- [ ] Variant stock tracking
- [ ] Add variant to cart
- [ ] Variant preview images

**SEO & Marketing (Phase 5)**
- [ ] Sitemap generation
- [ ] Meta tags validation
- [ ] Schema markup (JSON-LD)
- [ ] Social sharing previews
- [ ] Analytics tracking
- [ ] Search console integration
- [ ] Email marketing setup
- [ ] Newsletter signup

**Advanced Features (Phase 6+)**
- [ ] User reviews & ratings
- [ ] Related products AI
- [ ] Recommendation engine
- [ ] Wishlist functionality
- [ ] Product comparisons
- [ ] Gift cards
- [ ] Subscription products
- [ ] Abandoned cart recovery
- [ ] Customer segmentation
- [ ] A/B testing

---

## 🔧 DEBUGGING TIPS

### Common Issues & Solutions

**Cart Empty in Checkout**
```
Cause: Cart stored in database, checkout reading from localStorage
Fix: Use fetch('/api/cart') instead of localStorage
File: app/checkout/page.tsx
```

**Blog Articles Not Appearing**
```
Cause: Articles filtered by publishedAt, but set to null
Fix: Set publishedAt timestamp when publishing
File: app/blog/page.tsx
```

**Session Invalid / 401 Errors**
```
Cause: Session expired or not sent in cookies
Check: 
  1. Cookie being set? Check Set-Cookie header
  2. Cookie being sent? Browser dev tools → Network tab
  3. Session not expired? Check UserSession.expiresAt > now
Files: lib/auth.ts, middleware.ts
```

**Database Connection Issues**
```
Check environment variables:
  - DATABASE_URL for pooled connections
  - DIRECT_URL for migrations
Connect direct Prisma Studio:
  npx prisma studio
```

**Deployment Failures**
```
1. Check build logs on Vercel
2. Verify environment variables are set
3. Run: npm run build (locally to test)
4. Check: git push to trigger deploy
5. Look for TypeScript errors: npm run type-check
```

---

## 📚 DOCUMENTATION FILES

Created comprehensive documentation:

1. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)**
   - High-level system overview
   - Database E-R diagram (UML)
   - All user flows
   - Technology stack details

2. **[DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md)**
   - Design patterns used
   - Code organization principles
   - Database best practices
   - API design guidelines
   - Component design standards
   - State management patterns
   - Security patterns
   - Performance optimization

3. **[API_COMPLETE_REFERENCE.md](./API_COMPLETE_REFERENCE.md)**
   - All API endpoints documented
   - Request/response examples
   - Authentication flow
   - Products, Cart, Checkout APIs
   - Admin APIs
   - Error codes reference

4. **[VISUAL_DIAGRAMS_WORKFLOWS.md](./VISUAL_DIAGRAMS_WORKFLOWS.md)**
   - Database schema diagrams
   - Sequence diagrams
   - Component trees
   - State machines
   - Deployment architecture

5. **[DEVELOPER_QUICK_REFERENCE.md](./DEVELOPER_QUICK_REFERENCE.md)** ← You are here

---

## 🎓 LEARNING PATH

### For New Developers

**Week 1: Foundation**
1. Read SYSTEM_ARCHITECTURE.md (high-level overview)
2. Review DESIGN_PATTERNS.md (patterns & best practices)
3. Explore app/ directory structure
4. Follow a simple workflow (user signup)

**Week 2: Implementation**
1. Add a new API endpoint
2. Create a simple component
3. Fix a small bug
4. Review existing code patterns

**Week 3: Advanced**
1. Implement a feature from checklist
2. Write complex endpoint with validation
3. Understand Prisma migrations
4. Debug a real issue

**Week 4: Mastery**
1. Lead implementation of medium feature
2. Optimize performance
3. Write comprehensive tests
4. Review pull requests

---

## 🚀 NEXT STEPS (IMMEDIATE)

### Priority 1: Stripe Integration
```
Timeline: 3-5 days
Steps:
1. Install @stripe/stripe-js
2. Create Stripe account
3. Set API keys in environment
4. Build Stripe payment element component
5. Test payment flow
6. Deploy to production
Files to modify:
  - app/checkout/page.tsx (add Stripe element)
  - app/api/checkout/create-intent/route.ts
  - app/api/checkout/complete/route.ts
```

### Priority 2: Email Notification
```
Timeline: 2-3 days
Steps:
1. Choose provider (SendGrid recommended)
2. Setup API keys
3. Create email templates
4. Hook into order completion
5. Test emails
Files to modify:
  - app/api/checkout/complete/route.ts (send email)
  - lib/email.ts (new: email service)
```

### Priority 3: Customer Orders Dashboard
```
Timeline: 2-3 days
Steps:
1. Create /account/orders page
2. Fetch user's orders
3. Display order list
4. Add order detail modal
5. Show order status tracking
Files to create:
  - app/account/orders/page.tsx
  - app/account/orders/[id]/page.tsx
  - app/api/orders/list/route.ts
```

---

## 📞 COMMON QUESTIONS

**Q: How do I add a new page?**
A: Create file in `app/[path]/page.tsx`. It auto-becomes a route.

**Q: How do I protect a page from unauthorized access?**
A: Middleware in `middleware.ts` checks auth before route loads.

**Q: How do I access database?**
A: Use Prisma: `prisma.tableName.method()`

**Q: How do I store sensitive data?**
A: Never in localStorage. Use `httpOnly` cookies or server sessions.

**Q: How do I debug a production issue?**
A: Check Vercel logs, check Supabase query logs, review audit logs.

**Q: How do I deploy to production?**
A: Git push to main branch → Vercel auto-builds and deploys.

---

## 🔗 USEFUL LINKS

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs/
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs/

---

## 📝 CODE STYLE GUIDE

### Naming Conventions
```typescript
// Files
ProductCard.tsx          // Component: PascalCase
cartService.ts           // Utility: camelCase
app/products/page.tsx    // Page route path: standard

// Functions
async function fetchUser() {}        // camelCase
export const createProduct = () => {} // camelCase

// Types/Interfaces
interface User {}        // PascalCase
enum OrderStatus {}      // PascalCase
type CartItem = {}       // PascalCase

// Constants
const MAX_CART_ITEMS = 100;          // UPPER_SNAKE_CASE
const API_BASE_URL = '...';

// Variables (boolean)
const isLoading = false;             // is/has/can prefix
const hasError = true;
const canSubmit = false;
```

### Code Formatting
```typescript
// Use TypeScript strict mode
// Use explicit types (no 'any')
// Use const by default (not var)
// Use functional components (not class)
// Use async/await (not .then())
// Use optional chaining (?.)
// Validate all inputs
// Always handle errors with try/catch
```

---

## ✨ BEST PRACTICES SUMMARY

1. **Security First**
   - Never trust user input
   - Validate on server-side
   - Use bcrypt for passwords
   - Use HTTP-only cookies for sessions
   - Check permissions on every operation

2. **Database**
   - Always use Prisma for queries
   - Add indexes for frequently searched fields
   - Use transactions for multi-step operations
   - Keep audit logs for important actions
   - Soft delete sensitive data

3. **API Design**
   - Use RESTful principles
   - Return consistent response format
   - Include pagination for large lists
   - Document all endpoints
   - Version endpoints if needed

4. **Frontend**
   - Keep components small & focused
   - Use Context for global state
   - Handle loading states
   - Show error messages
   - Use TypeScript strictly

5. **Performance**
   - Cache static content (ISR)
   - Optimize images
   - Use pagination
   - Minimize database queries
   - Monitor Vercel analytics

---

**Document Version**: 1.0  
**Last Updated**: February 5, 2026  
**Next Review**: February 12, 2026

