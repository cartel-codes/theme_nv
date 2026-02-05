# System Architecture & Design Documentation

**Date**: February 5, 2026  
**Project**: Novraux E-commerce Platform  
**Version**: 1.0  
**Status**: MVP Phase (68% complete)

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Database Schema & Entity Relationships](#database-schema--entity-relationships)
4. [User Flow Diagrams](#user-flow-diagrams)
5. [API Architecture](#api-architecture)
6. [Component Structure](#component-structure)
7. [Authentication Flow](#authentication-flow)
8. [Checkout Process Flow](#checkout-process-flow)
9. [Data Flow Diagram](#data-flow-diagram)
10. [Technology Stack](#technology-stack)

---

## SYSTEM OVERVIEW

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (Next.js 14 + React 18 + Tailwind + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│  ├── Public: /, /products, /blog, /cart, /checkout, /contact  │
│  ├── Auth:   /auth/login, /auth/signup, /account              │
│  └── Admin:  /admin/*, /admin/posts, /admin/products          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (REST API)
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER LAYER                               │
│  (Next.js API Routes)                                           │
├─────────────────────────────────────────────────────────────────┤
│  Route Groups:                                                   │
│  ├── /api/auth/*           → User authentication               │
│  ├── /api/products/*       → Product management                │
│  ├── /api/cart/*           → Cart operations                   │
│  ├── /api/checkout/*       → Checkout flow                     │
│  ├── /api/admin/*          → Admin operations                  │
│  └── /api/orders/*         → Order management (Phase 2)        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (Prisma ORM)
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│  (Prisma ORM + TypeScript)                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                               │
│  PostgreSQL 16 (Supabase)                                       │
├─────────────────────────────────────────────────────────────────┤
│  Tables: 20+ tables (User, Product, Order, Cart, etc.)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES (Integration)                  │
├─────────────────────────────────────────────────────────────────┤
│  ├── Stripe (Payment processing) - Phase 4B                    │
│  ├── SendGrid/Mailgun (Email) - Phase 4B                       │
│  ├── AWS S3/R2 (Image storage)                                 │
│  ├── Groq AI (SEO generation)                                  │
│  └── Google AI Gemini (Optional)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## DATABASE SCHEMA & ENTITY RELATIONSHIPS

### Complete ER Diagram (UML)

```
┌──────────────────┐
│      User        │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ password         │
│ firstName        │
│ lastName         │
│ avatar           │
│ phone            │
│ isActive         │
│ emailVerified    │
│ createdAt        │
│ updatedAt        │
└──────────────────┘
        │
        │ 1:M
        │
    ┌───┴───────────────┬─────────────────┬────────────────┐
    │                   │                 │                │
    ↓                   ↓                 ↓                ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  UserSession     │ │  Order           │ │  UserAuditLog    │ │   Cart           │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ id (PK)          │ │ id (PK)          │ │ id (PK)          │ │ id (PK)          │
│ userId (FK)      │ │ userId (FK)      │ │ userId (FK)      │ │ userId (FK)      │
│ sessionToken     │ │ subtotal         │ │ email            │ │ sessionId        │
│ ip               │ │ tax              │ │ action           │ │ createdAt        │
│ userAgent        │ │ shipping         │ │ ip               │ │ updatedAt        │
│ deviceName       │ │ total            │ │ userAgent        │ └──────────────────┘
│ expiresAt        │ │ status           │ │ status           │         │
│ createdAt        │ │ shippingAddress  │ │ errorMessage     │         │ 1:M
│ lastActivity     │ │ paymentId        │ │ metadata         │         │
└──────────────────┘ │ paymentStatus    │ │ createdAt        │         ↓
                     │ createdAt        │ └──────────────────┘   ┌──────────────────┐
                     │ updatedAt        │                        │   CartItem       │
                     └──────────────────┘                        ├──────────────────┤
                             │                                    │ id (PK)          │
                             │ 1:M                                │ cartId (FK)      │
                             │                                    │ productId (FK)   │
                             ↓                                    │ quantity         │
                     ┌──────────────────┐                        │ createdAt        │
                     │   OrderItem      │                        │ updatedAt        │
                     ├──────────────────┤                        └──────────────────┘
                     │ id (PK)          │                                 │
                     │ orderId (FK)     │                                 │ M:1
                     │ productId (FK)   │                                 │
                     │ quantity         │                                 ↓
                     │ priceAtPurchase  │                        ┌──────────────────┐
                     │ createdAt        │                        │    Product       │
                     │ updatedAt        │                        ├──────────────────┤
                     └──────────────────┘                        │ id (PK)          │
                             │                                    │ name             │
                             │ M:1                                │ slug (UNIQUE)    │
                             │                                    │ description      │
                             ↓                                    │ price            │
                     ┌──────────────────┐                        │ imageUrl         │
                     │    Product       │                        │ categoryId (FK)  │
                     └──────────────────┘                        │ keywords         │
                                                                  │ metaDescription  │
                                                                  │ metaTitle        │
                                                                  │ focusKeyword     │
                                                                  │ ogImage          │
                                                                  │ createdAt        │
                                                                  │ updatedAt        │
                                                                  └──────────────────┘
                                                                          │
                                                                          │ M:1
                                                                          │
                                                                          ↓
                                                                  ┌──────────────────┐
                                                                  │   Category       │
                                                                  ├──────────────────┤
                                                                  │ id (PK)          │
                                                                  │ name             │
                                                                  │ slug (UNIQUE)    │
                                                                  │ description      │
                                                                  │ metaTitle        │
                                                                  │ metaDescription  │
                                                                  │ createdAt        │
                                                                  │ updatedAt        │
                                                                  └──────────────────┘
```

### Admin User Schema

```
┌──────────────────┐
│   AdminUser      │
├──────────────────┤
│ id (PK)          │
│ username         │
│ password         │
│ email (UNIQUE)   │
│ role             │
│ isActive         │
│ createdAt        │
│ updatedAt        │
└──────────────────┘
        │
        │ 1:M
        │
    ┌───┴────────────────┬──────────────────┐
    │                    │                  │
    ↓                    ↓                  ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  AdminSession    │ │ AdminAuditLog    │ │    Post          │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ id (PK)          │ │ id (PK)          │ │ id (PK)          │
│ userId (FK)      │ │ userId (FK)      │ │ title            │
│ sessionToken     │ │ email            │ │ slug (UNIQUE)    │
│ ip               │ │ action           │ │ excerpt          │
│ userAgent        │ │ ip               │ │ content          │
│ expiresAt        │ │ userAgent        │ │ imageUrl         │
│ createdAt        │ │ status           │ │ publishedAt      │
│ lastActivity     │ │ errorMessage     │ │ keywords         │
└──────────────────┘ │ metadata         │ │ metaDescription  │
                     │ createdAt        │ │ metaTitle        │
                     └──────────────────┘ │ focusKeyword     │
                                          │ ogImage          │
                                          │ createdAt        │
                                          │ updatedAt        │
                                          └──────────────────┘
```

### Key Relationships

| From | To | Type | Purpose |
|------|-----|------|---------|
| User | Order | 1:M | User places multiple orders |
| User | UserSession | 1:M | User has multiple active sessions |
| User | Cart | 1:1 | User has one cart |
| Cart | CartItem | 1:M | Cart contains multiple items |
| CartItem | Product | M:1 | Item links to product |
| Product | Category | M:1 | Product belongs to category |
| Product | ProductImage | 1:M | Product has multiple images |
| Order | OrderItem | 1:M | Order contains multiple items |
| OrderItem | Product | M:1 | Item references product |
| AdminUser | AdminSession | 1:M | Admin has multiple sessions |
| AdminUser | Post | (Future) | Admin creates blog posts |

---

## USER FLOW DIAGRAMS

### 1. User Registration & Login Flow

```
START
  │
  ├─→ User visits /auth/signup
  │    │
  │    ├─→ User fills: email, password, firstName, lastName
  │    │
  │    ├─→ Validate:
  │    │   ├─ Email format valid?
  │    │   ├─ Email not already registered?
  │    │   ├─ Password 8+ chars?
  │    │   └─ All fields filled?
  │    │
  │    ├─→ POST /api/auth/user/signup
  │    │    │
  │    │    ├─→ Hash password (bcrypt, 10 rounds)
  │    │    ├─→ Create User record
  │    │    ├─→ Create Cart for user
  │    │    ├─→ Log audit event
  │    │    └─→ Return user ID
  │    │
  │    ├─→ Create session (30 days)
  │    ├─→ Set HTTP-only cookie
  │    └─→ Redirect to /account
  │
  ├─→ User visits /auth/login
  │    │
  │    ├─→ User enters: email, password
  │    │
  │    ├─→ POST /api/auth/user/login
  │    │    │
  │    │    ├─→ Find user by email
  │    │    ├─→ Compare password hash
  │    │    ├─→ If failed: log audit, return 401
  │    │    └─→ If success: create session
  │    │
  │    ├─→ Set session cookie (HTTP-only, Secure, SameSite)
  │    ├─→ Log successful login
  │    └─→ Redirect to /account or /products
  │
  └─→ END
```

### 2. Shopping Flow

```
START
  │
  ├─→ User browses /products
  │    │
  │    ├─→ GET /api/products (fetch all)
  │    ├─→ Display product grid
  │    └─→ User clicks product detail
  │
  ├─→ User views /products/[slug]
  │    │
  │    ├─→ GET /api/products/[id]
  │    ├─→ Display product details
  │    ├─→ Show price, description, images
  │    └─→ User clicks "Add to Cart"
  │
  ├─→ User adds item to cart
  │    │
  │    ├─→ POST /api/cart/add
  │    │    │
  │    │    ├─→ Get or create cart for user
  │    │    ├─→ Add CartItem with quantity
  │    │    ├─→ Calculate total
  │    │    └─→ Return updated cart
  │    │
  │    ├─→ Show cart drawer/notification
  │    ├─→ User can continue shopping or go to cart
  │    └─→ Continue browsing products
  │
  ├─→ User visits /cart
  │    │
  │    ├─→ GET /api/cart (fetch user's cart)
  │    ├─→ Display all items with:
  │    │   ├─ Product image
  │    │   ├─ Product name
  │    │   ├─ Unit price
  │    │   ├─ Quantity selector
  │    │   ├─ Item subtotal
  │    │   └─ Remove button
  │    │
  │    ├─→ User can:
  │    │   ├─ Update quantities
  │    │   ├─ Remove items
  │    │   ├─ Continue shopping
  │    │   └─ Proceed to checkout
  │    │
  │    └─→ Display total: items, subtotal
  │
  └─→ END (Go to Checkout)
```

### 3. Checkout Flow (4 Steps)

```
START → /checkout page
  │
  ├─→ STEP 1: CART REVIEW
  │    │
  │    ├─→ GET /api/cart (fetch items)
  │    ├─→ POST /api/checkout/validate
  │    │    │
  │    │    ├─→ Verify products exist
  │    │    ├─→ Verify quantities valid
  │    │    ├─→ Calculate:
  │    │    │   ├─ Subtotal = sum(price × qty)
  │    │    │   ├─ Tax = subtotal × 10%
  │    │    │   ├─ Shipping = if subtotal > 100 ? 0 : 10
  │    │    │   └─ Total = subtotal + tax + shipping
  │    │    └─→ Return totals
  │    │
  │    ├─→ Display:
  │    │   ├─ All items with images
  │    │   ├─ Unit prices
  │    │   ├─ Quantities
  │    │   └─ Item subtotals
  │    │
  │    └─→ User clicks "Next" → STEP 2
  │
  ├─→ STEP 2: SHIPPING ADDRESS
  │    │
  │    ├─→ Validate requires authentication
  │    ├─→ Display form:
  │    │   ├─ First Name
  │    │   ├─ Last Name
  │    │   ├─ Email
  │    │   ├─ Street Address
  │    │   ├─ City
  │    │   ├─ State
  │    │   ├─ ZIP Code
  │    │   └─ Country
  │    │
  │    ├─→ Validate on Next:
  │    │   ├─ All fields required
  │    │   ├─ Email format valid
  │    │   └─ ZIP format valid
  │    │
  │    └─→ User clicks "Next" → STEP 3
  │
  ├─→ STEP 3: REVIEW ORDER
  │    │
  │    ├─→ Display summary:
  │    │   ├─ All items list
  │    │   ├─ Shipping address
  │    │   ├─ Subtotal
  │    │   ├─ Tax
  │    │   ├─ Shipping
  │    │   └─ TOTAL
  │    │
  │    ├─→ User can edit previous steps
  │    └─→ User clicks "Continue to Payment" → STEP 4
  │
  ├─→ STEP 4: PAYMENT (DEMO MODE)
  │    │
  │    ├─→ POST /api/checkout/create-intent
  │    │    │
  │    │    ├─→ Verify user authenticated
  │    │    ├─→ Verify shipping address complete
  │    │    ├─→ Create Order record:
  │    │    │   ├─ status = "pending"
  │    │    │   ├─ paymentStatus = "pending"
  │    │    │   ├─ shippingAddress = JSON
  │    │    │   └─ Store all totals
  │    │    │
  │    │    ├─→ Create OrderItem records:
  │    │    │   ├─ For each cart item
  │    │    │   ├─ productId, quantity
  │    │    │   └─ priceAtPurchase (snapshot)
  │    │    │
  │    │    ├─→ TODO: Call Stripe API
  │    │    │    └─ Create payment intent
  │    │    │
  │    │    └─→ Return: orderId, clientSecret
  │    │
  │    ├─→ Display totals
  │    ├─→ Show "Complete Order" button
  │    │
  │    ├─→ User clicks "Complete Order"
  │    │    │
  │    │    ├─→ POST /api/checkout/complete
  │    │    │    │
  │    │    │    ├─→ Verify order exists
  │    │    │    ├─→ Verify user owns order
  │    │    │    ├─→ TODO: Verify Stripe payment succeeded
  │    │    │    ├─→ Update Order status = "paid"
  │    │    │    ├─→ Clear user's cart (delete all items)
  │    │    │    ├─→ TODO: Send confirmation email
  │    │    │    ├─→ TODO: Create fulfillment request
  │    │    │    └─→ Return: orderId, success
  │    │    │
  │    │    └─→ Redirect to /checkout/success?orderId=XXX
  │
  ├─→ SUCCESS PAGE
  │    │
  │    ├─→ Display:
  │    │   ├─ Success message
  │    │   ├─ Order ID
  │    │   ├─ Email confirmation note
  │    │   └─ Next steps
  │    │
  │    └─→ Links:
  │        ├─ Continue Shopping → /products
  │        └─ Back to Home → /
  │
  └─→ END
```

### 4. Admin Login & Dashboard Flow

```
START
  │
  ├─→ User visits /admin
  │    │
  │    ├─→ Check for admin session cookie
  │    ├─→ If no session: redirect to /admin/login
  │    └─→ If session: show dashboard
  │
  ├─→ Admin visits /admin/login
  │    │
  │    ├─→ Display form: email, password
  │    │
  │    ├─→ Admin submits
  │    │    │
  │    │    ├─→ POST /api/auth/login
  │    │    │    │
  │    │    │    ├─→ Validate email & password
  │    │    │    ├─→ Compare password hash
  │    │    │    ├─→ Check isActive = true
  │    │    │    ├─→ Log audit event
  │    │    │    └─→ Create admin session
  │    │    │
  │    │    ├─→ If failed: show error, log attempt
  │    │    └─→ If success: set session cookie
  │    │
  │    └─→ Redirect to /admin
  │
  ├─→ Admin Dashboard /admin
  │    │
  │    ├─→ Display:
  │    │   ├─ Welcome message with admin name
  │    │   ├─ Quick stats dashboard
  │    │   ├─ Navigation menu:
  │    │   │   ├─ Products
  │    │   │   ├─ Blog Posts
  │    │   │   ├─ Categories
  │    │   │   ├─ Users
  │    │   │   ├─ Audit Logs
  │    │   │   ├─ Sessions
  │    │   │   └─ Profile
  │    │   │
  │    │   └─ Logout button
  │    │
  │    └─→ Admin can navigate to any section
  │
  └─→ END
```

---

## API ARCHITECTURE

### Authentication Endpoints

```
POST /api/auth/user/signup
├─ Input:  { email, password, firstName, lastName }
├─ Validation:
│  ├─ email: valid format + not exists
│  ├─ password: min 8 chars
│  └─ firstName, lastName: required
├─ Database:
│  ├─ Create User
│  ├─ Create Cart (1:1 with user)
│  └─ Log audit
└─ Output: { user: {id, email, firstName} }

POST /api/auth/user/login
├─ Input:  { email, password }
├─ Process:
│  ├─ Find user by email
│  ├─ Hash comparison
│  ├─ Create UserSession
│  ├─ Set HTTP-only cookie
│  └─ Log audit
└─ Output: { user: {id, email, firstName} }

POST /api/auth/user/logout
├─ Input:  sessionToken from cookie
├─ Process:
│  ├─ Invalidate session
│  ├─ Clear cookie
│  └─ Log audit
└─ Output: { success: true }

POST /api/auth/login (Admin)
├─ Input:  { email, password }
├─ Database: AdminUser
└─ Output: { user, token }
```

### Cart Endpoints

```
GET /api/cart
├─ Authentication: Required
├─ Process:
│  ├─ Get user from session
│  ├─ Find user's cart
│  ├─ Include cart items + products
│  └─ Calculate totals
└─ Output: { items: [{ id, productId, quantity, product }], total }

POST /api/cart/add
├─ Input:  { productId, quantity }
├─ Process:
│  ├─ Verify product exists
│  ├─ Get or create cart
│  ├─ Upsert CartItem (merge quantities)
│  └─ Recalculate total
└─ Output: { items, total }

PUT /api/cart/update
├─ Input:  { itemId, quantity }
├─ Process:
│  ├─ Update CartItem quantity
│  ├─ Verify quantity > 0
│  └─ Recalculate total
└─ Output: { items, total }

DELETE /api/cart?itemId=XXX
├─ Input:  itemId from query params
├─ Process:
│  ├─ Remove CartItem
│  └─ Recalculate total
└─ Output: { items, total }
```

### Checkout Endpoints

```
POST /api/checkout/validate
├─ Input:  { cartItems: [{ productId, quantity }] }
├─ Validation:
│  ├─ Products exist
│  ├─ Quantities valid
│  └─ Stock available
├─ Calculation:
│  ├─ Subtotal = sum(price × qty)
│  ├─ Tax = subtotal × 0.10
│  ├─ Shipping = subtotal > 100 ? 0 : 10
│  └─ Total = subtotal + tax + shipping
└─ Output: { items, subtotal, tax, shipping, total }

POST /api/checkout/create-intent
├─ Authentication: Required
├─ Input:  { items, shippingAddress, email }
├─ Validation:
│  ├─ User authenticated
│  ├─ Products exist
│  ├─ Address complete
│  └─ Items available
├─ Database:
│  ├─ Create Order (status: pending, paymentStatus: pending)
│  ├─ Create OrderItems (with price snapshot)
│  └─ Log event
├─ Payment:
│  └─ TODO: Call Stripe API create intent
└─ Output: { clientSecret, orderId, total }

POST /api/checkout/complete
├─ Authentication: Required
├─ Input:  { orderId, paymentId, paymentStatus }
├─ Process:
│  ├─ Verify order exists
│  ├─ Verify user owns order
│  ├─ Verify payment succeeded
│  ├─ Update Order status to "paid"
│  ├─ Clear user's cart
│  ├─ TODO: Send confirmation email
│  └─ TODO: Create fulfillment
└─ Output: { orderId, status: "success", order }
```

### Products Endpoints

```
GET /api/products?search=X&category=Y&limit=20&page=1
├─ Public endpoint
├─ Filters:
│  ├─ search: title/slug/description
│  ├─ category: categoryId
│  ├─ limit: items per page
│  └─ page: pagination
└─ Output: { items, pagination: { total, page, pages } }

GET /api/products/[id]
├─ Public endpoint
├─ Includes: category, images
└─ Output: { product }

POST /api/admin/products
├─ Authentication: Admin required
├─ Input:  { name, slug, price, description, categoryId, imageUrl }
├─ Validation: All required fields
├─ Database: Create Product
└─ Output: { product }

PUT /api/admin/products/[id]
├─ Authentication: Admin required
├─ Input:  { name, slug, price, description, categoryId, imageUrl }
├─ Validation: Unique slug check
├─ Database: Update Product
└─ Output: { product }

DELETE /api/admin/products/[id]
├─ Authentication: Admin required
├─ Database:
│  ├─ Delete product
│  ├─ Cascade delete related data
│  └─ Clean up images
└─ Output: { success: true }
```

---

## COMPONENT STRUCTURE

### Frontend Components Tree

```
app/
├── layout.tsx (Root layout)
│   ├── Header.tsx
│   │   ├── Logo
│   │   ├── Navigation Menu
│   │   │   ├── Products link
│   │   ├─ Blog link
│   │   │   ├── Contact link
│   │   │   └── Account link
│   │   ├── Cart Icon
│   │   │   └── CartDrawer.tsx (opens on click)
│   │   │       └── CartItem component (maps items)
│   │   └── ThemeToggle.tsx
│   │
│   ├── Footer.tsx
│   │   ├── Brand info
│   │   ├── Links
│   │   └── Copyright
│   │
│   └── [pages]
│
├── (public pages)
│   ├── page.tsx (Home)
│   ├── products/
│   │   ├── page.tsx (Product listing)
│   │   │   └── ProductCard.tsx (reusable)
│   │   └── [slug]/
│   │       └── page.tsx (Product detail)
│   │
│   ├── blog/
│   │   ├── page.tsx (Blog listing)
│   │   └── [slug]/
│   │       └── page.tsx (Blog post detail)
│   │
│   ├── cart/
│   │   ├── page.tsx (Cart page)
│   │   └── CartActions.tsx (update/remove)
│   │
│   ├── checkout/
│   │   ├── page.tsx (4-step checkout)
│   │   └── success/
│   │       └── page.tsx (Success page)
│   │
│   └── contact/
│       └── page.tsx (Contact form)
│
├── (auth pages)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   └── account/
│       ├── page.tsx (Profile)
│       ├── change-password/page.tsx
│       └── orders/
│           └── page.tsx (Order history - Phase 2)
│
└── (admin pages)
    └── admin/
        ├── layout.tsx (Admin layout with sidebar)
        ├── login/page.tsx
        ├── signup/page.tsx
        ├── page.tsx (Dashboard)
        ├── profile/page.tsx
        │
        ├── products/
        │   ├── page.tsx (Product list)
        │   ├── new/page.tsx
        │   │   └── ProductForm.tsx
        │   └── [id]/page.tsx
        │       └── ProductForm.tsx
        │
        ├── posts/
        │   ├── page.tsx (Blog list)
        │   ├── new/page.tsx
        │   │   └── PostForm.tsx
        │   ├── [id]/page.tsx
        │   │   └── PostForm.tsx
        │   └── ai-wizard/
        │       └── AIArticleWizard.tsx
        │
        ├── categories/
        │   ├── page.tsx
        │   └── [id]/page.tsx
        │
        ├── users/
        │   ├── page.tsx
        │   └── [id]/page.tsx
        │
        └── audit-logs/
            └── page.tsx
```

### Context & Providers

```
contexts/
├── CartContext.tsx
│   ├── items: CartItem[]
│   ├── totalItems: number
│   ├── totalPrice: number
│   ├── isDrawerOpen: boolean
│   ├── addToCart(productId, quantity)
│   ├── updateQuantity(itemId, quantity)
│   ├── removeItem(itemId)
│   └── refreshCart()
│
└── (Future)
    ├── AuthContext.tsx
    ├── UserContext.tsx
    └── AdminContext.tsx

providers.tsx
├── CartProvider
├── ThemeProvider
└── (Future)
    ├── AuthProvider
    └── StripeProvider
```

### Form Components (Reusable)

```
components/
├── ProductForm.tsx
│   ├── Product details (name, slug, price)
│   ├── Description editor
│   ├── Category selector
│   ├── ImageUploader
│   ├── SEO fields
│   └── Submit button
│
├── PostForm.tsx
│   ├── Post details (title, slug)
│   ├── Content editor (rich text)
│   ├── Excerpt + keyword
│   ├── ImageUploader
│   ├── Publish date
│   ├── SEO Preview
│   ├── AI SEO generator
│   └── Submit button
│
├── ImageUploader.tsx
│   ├── Drag & drop
│   ├── File picker
│   ├── Image preview
│   ├── Upload to R2
│   └── Return URL
│
├── CategorySelector.tsx
├── SEOPreview.tsx
└── SEOHealthIndicator.tsx
```

---

## AUTHENTICATION FLOW (Detailed)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION & SESSION FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

USER REGISTRATION:
─────────────────

1. Frontend → /auth/signup page
2. User fills form: email, password, firstName, lastName
3. Form validation (client-side)
4. POST /api/auth/user/signup {email, password, firstName, lastName}
   │
   ├─→ Backend validation:
   │   ├─ Email format valid
   │   ├─ Email not duplicate
   │   └─ Password 8+ chars
   │
   ├─→ Database operations:
   │   ├─ Hash password with bcrypt (10 rounds)
   │   ├─ Create User record
   │   ├─ Create Cart record (1:1)
   │   ├─ Create UserSession record
   │   └─ Log audit event
   │
   ├─→ Session creation:
   │   ├─ Generate crypto token (32 bytes)
   │   ├─ Set expiresAt = now + 30 days
   │   └─ Store in database
   │
   ├─→ Cookie setup:
   │   ├─ Name: sessionToken
   │   ├─ Value: generated token
   │   ├─ HttpOnly: true (no JS access)
   │   ├─ Secure: true (HTTPS only)
   │   ├─ SameSite: Lax (CSRF protection)
   │   └─ MaxAge: 30 days
   │
   └─→ Response: { user: {id, email, firstName} }

5. Browser auto-includes sessionToken cookie in requests
6. Redirect to /account or /products

USER LOGIN:
───────────

1. Frontend → /auth/login page
2. User fills: email, password
3. POST /api/auth/user/login {email, password}
   │
   ├─→ Database lookup:
   │   └─ Find User by email
   │
   ├─→ Password verification:
   │   ├─ Use bcrypt.compare()
   │   ├─ If mismatch:
   │   │   ├─ Log failed login audit
   │   │   └─ Return 401 Unauthorized
   │   └─ If match: continue
   │
   ├─→ Session creation:
   │   ├─ Generate new token
   │   ├─ Create UserSession
   │   └─ Invalidate old sessions (cleanup)
   │
   ├─→ Cookie & response:
   │   ├─ Set session cookie (same as signup)
   │   ├─ Log successful login audit
   │   └─ Return user data
   │
   └─→ Response: { user: {id, email, firstName} }

4. Browser stores cookie
5. Redirect to /account or referrer

SESSION VALIDATION:
───────────────────

Every protected request includes:
  → sessionToken cookie (auto-included by browser)
  → IP address (from request)
  → User-Agent (from request headers)

Backend validation:
  1. Extract sessionToken from cookies
  2. Look up UserSession in database
  3. Check:
     ├─ Session exists
     ├─ expiresAt > now (not expired)
     ├─ user.isActive = true
     └─ IP/User-Agent match (optional: optional for rotation check)
  4. Update lastActivity = now (keep session alive)
  5. If valid: allow request, pass user to handler
  6. If invalid: return 401, redirect to login

LOGOUT:
───────

1. POST /api/auth/user/logout
   │
   ├─→ Get sessionToken from cookie
   │
   ├─→ Delete UserSession record
   │
   ├─→ Clear cookie:
   │   ├─ Name: sessionToken
   │   └─ MaxAge: 0 (immediate deletion)
   │
   └─→ Log audit event

2. Response: { success: true }
3. Redirect to /auth/login or home

ADMIN AUTHENTICATION:
─────────────────────

Similar to user auth but:
  └─ Uses AdminUser table instead of User
  └─ Checks role field
  └─ Uses AdminSession for session tracking
  └─ Audit logged to AdminAuditLog
  └─ Used to protect /api/admin/* routes

MIDDLEWARE PROTECTION:
──────────────────────

File: middleware.ts

Routes pattern matching:
  /admin/*           → Require admin session
  /account/*         → Require user session
  /checkout          → Require user session
  /api/admin/*       → Require admin session
  /api/cart          → Require user session
  Others             → Allow public access

Logic:
  1. Read URL & extract route
  2. Check if route requires auth
  3. Extract sessionToken from cookie
  4. Validate session (check expiry, status)
  5. If invalid: redirect /login or /admin/login
  6. If valid: allow request to continue
```

---

## CHECKOUT PROCESS FLOW (Detailed)

```
STEP 1: CART VALIDATION
─────────────────────────

GET /api/cart
  ├─→ Fetch user's cart from database
  ├─→ Include all CartItem records
  ├─→ Include related Products
  ├─→ Filter: only items with quantity > 0
  └─→ Return: items array

POST /api/checkout/validate {cartItems}
  ├─→ Input: [{ productId: string, quantity: number }]
  ├─→ Validation:
  │   ├─ cartItems.length > 0
  │   ├─ For each item:
  │   │   ├─ productId exists in DB
  │   │   ├─ quantity > 0 && quantity < 999
  │   │   └─ product.price exists
  │
  ├─→ Calculation:
  │   ├─ subtotal = 0
  │   ├─ For each item:
  │   │   └─ subtotal += product.price × quantity
  │   │
  │   ├─ tax = subtotal × 0.10 (10%)
  │   ├─ shipping = subtotal > 100 ? 0 : 10
  │   └─ total = subtotal + tax + shipping
  │
  └─→ Return:
      ├─ items: [{ productId, name, price, quantity, total }]
      ├─ subtotal: number
      ├─ tax: number
      ├─ shipping: number
      └─ total: number

STEP 2: SHIPPING ADDRESS
─────────────────────────

User fills form:
  ├─ firstName: string (required)
  ├─ lastName: string (required)
  ├─ email: string (required, valid email)
  ├─ street: string (required)
  ├─ city: string (required)
  ├─ state: string (required)
  ├─ zip: string (required, format validation)
  └─ country: string (default: "US")

Validation (frontend + backend):
  ├─ All fields not empty
  ├─ Email valid format
  ├─ ZIP/Postal code format
  └─ Address length reasonable

STEP 3: ORDER REVIEW
─────────────────────

Display:
  ├─ Items
  │  ├─ Product name × quantity
  │  ├─ Unit price
  │  └─ Item subtotal
  │
  ├─ Shipping address summary
  │  ├─ Name
  │  ├─ Street
  │  ├─ City, State ZIP
  │  └─ Country
  │
  └─ Totals
     ├─ Subtotal
     ├─ Tax (10%)
     ├─ Shipping
     └─ TOTAL

User can:
  ├─ Edit address (back to step 2)
  ├─ Edit cart (back to step 1)
  └─ Continue to payment (step 4)

STEP 4: PAYMENT (CREATE INTENT)
────────────────────────────────

POST /api/checkout/create-intent {items, shippingAddress}
  │
  ├─→ Authentication check:
  │   └─ Verify sessionToken valid
  │
  ├─→ Data validation:
  │   ├─ items not empty
  │   ├─ shippingAddress complete
  │   ├─ User authenticated
  │   └─ All products exist
  │
  ├─→ Create Order record:
  │   ├─ userId: from session
  │   ├─ subtotal: calculated
  │   ├─ tax: calculated
  │   ├─ shipping: calculated
  │   ├─ total: calculated
  │   ├─ status: "pending"
  │   ├─ paymentStatus: "pending"
  │   ├─ shippingAddress: JSON stringify
  │   └─ paymentId: null (updated after payment)
  │
  ├─→ Create OrderItem records (for each item):
  │   ├─ orderId: new order's ID
  │   ├─ productId: from item
  │   ├─ quantity: from item
  │   └─ priceAtPurchase: snapshot of product.price
  │
  ├─→ TODO: Stripe Integration
  │   ├─ Call stripe.paymentIntents.create()
  │   ├─ Pass: amount, currency, description
  │   ├─ Get: clientSecret, paymentIntentId
  │   └─ Store paymentId in Order record
  │
  └─→ Response:
      ├─ clientSecret: string (for Stripe)
      ├─ orderId: string
      └─ total: number

STEP 5: PAYMENT CONFIRMATION
──────────────────────────────

POST /api/checkout/complete {orderId, paymentId, paymentStatus}
  │
  ├─→ Authentication & authorization:
  │   ├─ Verify user authenticated
  │   ├─ Fetch order from DB
  │   └─ Verify order.userId = current user
  │
  ├─→ Verify payment (from Stripe):
  │   └─ paymentStatus === "succeeded"
  │
  ├─→ Update Order status:
  │   ├─ status: "paid"
  │   ├─ paymentStatus: "succeeded"
  │   └─ paymentId: from Stripe
  │
  ├─→ Clear user's cart:
  │   ├─ Find user's cart
  │   └─ Delete all CartItem records
  │
  ├─→ TODO: Post-purchase actions:
  │   ├─ Send confirmation email
  │   ├─ Update inventory
  │   ├─ Create fulfillment request
  │   └─ Log analytics event
  │
  └─→ Response:
      ├─ orderId: string
      ├─ status: "success"
      └─ order: { id, total, status, createdAt }

STEP 6: SUCCESS PAGE
─────────────────────

Redirect to: /checkout/success?orderId=XXX

Display:
  ├─ Success message
  ├─ Order ID (copied to clipboard?)
  ├─ Email confirmation note
  ├─ Estimated delivery date (TODO)
  ├─ Order summary (TODO: fetch from API)
  │
  └─ Next actions:
     ├─ Continue Shopping → /products
     └─ View Orders → /account/orders (TODO)

AFTER PURCHASE:
────────────────

Cart state:
  ├─ CartItems: empty
  └─ Total: $0

Order state:
  ├─ Order record created in DB
  ├─ Status progression: pending → paid → processing → shipped → delivered
  └─ Available in: /account/orders (user view) + /admin/orders (admin view)

Email flow (TODO):
  ├─ Order confirmation email
  ├─ Shipping notification
  ├─ Delivery confirmation
  └─ All include tracking link
```

---

## DATA FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FLOW (DFD)                          │
└──────────────────────────────────────────────────────────────────────┘

BROWSER (CLIENT)
  │
  ├─→ User Action
  │    (click, submit form, navigate)
  │
  ├─→ Frontend (Next.js React)
  │    ├─ State management (Context, useState)
  │    ├─ Form validation
  │    ├─ UI rendering
  │    └─ Fetch API calls
  │
  └─→ Request
       │
       ├─ Method: GET/POST/PUT/DELETE
       ├─ URL: /api/...
       ├─ Headers:
       │  ├─ Content-Type: application/json
       │  └─ Cookie: sessionToken=...
       │
       └─ Body (if POST/PUT):
          └─ JSON payload

                              ↓ (HTTP/HTTPS)

NEXT.JS SERVER
  │
  ├─→ Route Handler (app/api/...)
  │    ├─ Parse request
  │    ├─ Extract cookies & session
  │    ├─ Middleware check (auth/permissions)
  │    ├─ Parse & validate body
  │    ├─ Business logic
  │    └─ Call database functions
  │
  └─→ Database Operations (via Prisma)
       │
       ├─ Generate SQL query
       ├─ Connection pooling (PgBouncer)
       └─ Execute on PostgreSQL

                              ↓

POSTGRESQL DATABASE (Supabase)
  │
  ├─→ Query execution
  │    ├─ Validate data types
  │    ├─ Check constraints
  │    ├─ Update/fetch records
  │    ├─ Maintain referential integrity
  │    └─ Return result set
  │
  └─→ Data storage
       ├─ 20+ tables with relationships
       ├─ Indexes for performance
       ├─ Constraints & validations
       └─ Audit trail (logs)

                              ↓ (Result)

NEXT.JS SERVER (Response)
  │
  ├─→ Process results
  │    ├─ Transform data (map, filter)
  │    ├─ Handle errors
  │    ├─ Format response
  │    └─ Set status code
  │
  └─→ HTTP Response
       │
       ├─ Status: 200/201/400/401/500
       ├─ Headers:
       │  ├─ Content-Type: application/json
       │  └─ Set-Cookie: (if needed)
       │
       └─ Body: JSON payload

                              ↓ (HTTP/HTTPS)

BROWSER (CLIENT)
  │
  ├─→ Response received
  │    ├─ Parse JSON
  │    ├─ Handle status code
  │    └─ Save cookies (if set)
  │
  ├─→ Update state
  │    ├─ Update Context
  │    ├─ Validate response
  │    ├─ Cache if needed
  │    └─ Update UI
  │
  ├─→ Re-render
  │    ├─ React renders new state
  │    ├─ DOM updates
  │    ├─ User sees results
  │    └─ Ready for next action
  │
  └─→ Back to User Action (cycle repeats)


EXAMPLE: ADD TO CART
────────────────────

1. User clicks "Add to Cart"
   │
2. Frontend (ProductCard or ProductPage)
   ├─ Extract product ID & quantity
   ├─ Call: await cartContext.addToCart(productId, 1)
   │
3. CartContext
   ├─ POST /api/cart/add {productId, quantity}
   │
4. Backend (/api/cart route)
   ├─ Extract sessionToken from cookies
   ├─ Fetch UserSession & verify valid
   ├─ Fetch user's Cart (or create if missing)
   ├─ Find Product to validate & get price
   ├─ Upsert CartItem:
   │  ├─ If exists: quantity += input quantity
   │  └─ If new: create CartItem
   ├─ Recalculate cart total
   └─ Return updated cart
   │
5. Database
   ├─ Query: User session validation
   ├─ Query: Get/create Cart
   ├─ Query: Get Product
   ├─ Query: Find/create CartItem
   └─ Return result
   │
6. Response to Frontend
   ├─ Status: 200
   ├─ Body: { items: [...], total: ... }
   │
7. Update UI
   ├─ cartContext updates items
   ├─ Re-render cart
   ├─ Show success message
   └─ Update cart count in header


EXAMPLE: COMPLETE CHECKOUT
───────────────────────────

1. User clicks "Complete Order" in step 4
   │
2. Frontend (CheckoutPage)
   ├─ Collect order data
   ├─ POST /api/checkout/create-intent
   │
3. Backend (checkout/create-intent)
   ├─ Validate user authenticated
   ├─ For each item:
   │  └─ Verify product exists
   │
   ├─ Calculate totals
   │
   ├─ Database:
   │  ├─ Create Order record
   │  └─ Create OrderItem children
   │
   ├─ TODO: Call Stripe API
   │
   └─ Return { clientSecret, orderId }
   │
4. Frontend receives clientSecret
   └─ POST /api/checkout/complete
      │
5. Backend (checkout/complete)
   ├─ Verify order belongs to user
   ├─ TODO: Verify Stripe payment
   ├─ Update Order status = "paid"
   ├─ Database:
   │  └─ Delete all user CartItems
   ├─ TODO: Send confirmation email
   │
   └─ Return { orderId, status: "success" }
   │
6. Frontend
   ├─ Clear cartContext
   ├─ Redirect to /checkout/success?orderId=XXX
   │
7. User sees success page!
```

---

## TECHNOLOGY STACK

### Frontend Stack

```
┌─ Framework & Build
├─ Next.js 14.2.18
│   ├─ App Router (file-based routing)
│   ├─ Server Components (RSC)
│   ├─ API Routes (/api/*)
│   └─ Built-in optimization (Image, Font)
│
├─ UI & Styling
├─ React 18.3
├─ Tailwind CSS 3.4
├─ TypeScript 5.x
├─ next-themes (dark mode)
│
├─ State Management
├─ React Context API
├─ useCallback, useMemo
├─ localStorage (cart persistence)
│
└─ HTTP Client
   ├─ Fetch API (native)
   └─ Next.js fetch (server)
```

### Backend Stack

```
┌─ Runtime & Framework
├─ Node.js 18+
├─ Next.js API Routes
├─ TypeScript 5.x
│
├─ Database ORM
├─ Prisma 5.22
│   ├─ Type-safe queries
│   ├─ Auto-migration
│   ├─ Schema definition
│   └─ Relations/joins
│
├─ Authentication
├─ bcryptjs (password hashing)
├─ HTTP-only cookies
├─ Session tokens (crypto)
│
├─ Validation
├─ TypeScript types
├─ Manual validation
│
├─ Utilities
├─ next.js utilities (NextRequest, NextResponse)
├─ dotenv (env vars)
└─ Built-in JSON parsing
```

### Database Stack

```
┌─ Database Engine
├─ PostgreSQL 16 (Supabase)
│   ├─ Relational
│   ├─ ACID compliance
│   ├─ Indexes
│   └─ Foreign keys
│
├─ Connection Pool
├─ PgBouncer (Supabase)
│   └─ Connection pooling
│
├─ Migrations
├─ Prisma migrations
│   └─ Version control
│
└─ Backup & Security
   ├─ Supabase automated backups
   ├─ Row-level security (RLS) - not yet configured
   └─ SSL/TLS encryption
```

### Infrastructure & Deployment

```
┌─ Hosting
├─ Vercel (Frontend + API)
│   ├─ Automatic deployments
│   ├─ Edge functions
│   ├─ CDN
│   └─ Zero-config
│
├─ Database Hosting
├─ Supabase (PostgreSQL)
│   ├─ Cloud-hosted
│   ├─ Automatic backups
│   └─ Automated scaling
│
├─ File Storage
├─ AWS S3 / Cloudflare R2
│   ├─ Image storage
│   ├─ CDN delivery
│   └─ Optimization
│
└─ External Services (TODO)
   ├─ Stripe (payments)
   ├─ SendGrid (emails)
   ├─ Groq AI (SEO)
   └─ Google AI (optional)
```

### Testing Stack

```
├─ Unit Testing
├─ Jest
├─ React Testing Library
│
├─ API Testing
├─ supertest
│
├─ Type Checking
├─ TypeScript
│   └─ tsc --noEmit
│
└─ Code Quality
   ├─ ESLint
   └─ Prettier (via editor)
```

---

## DESIGN PATTERNS

### MVC-like Pattern

```
View (Frontend Components)
  │ ← User interactions
  │ → UI rendering
  │
Controller (API Routes)
  │ ← HTTP requests
  │ → API responses
  │
Model (Database)
  │ ← Queries
  │ → Data records
```

### Repository Pattern

Prisma acts as a repository:
```typescript
// Instead of raw SQL
const user = await db.user.findUnique({ where: { id } });

// Instead of DAO
const order = await prisma.order.create({
  data: { userId, total, status: 'pending' }
});
```

### Dependency Injection

Services via context:
```typescript
const CartContext = createContext<CartContextType>(undefined);

export function CartProvider({ children }) {
  // Inject cart logic
  return <CartContext.Provider value={...}>{children}</CartContext.Provider>;
}
```

### Middleware Pattern

Route protection:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Check auth before route
  if (requiresAuth(pathname) && !hasSession) {
    return redirect('/login');
  }
}
```

---

## DIAGRAM LEGEND

```
┌──────┐
│ Box  │  = Entity / Component
└──────┘

   │
   ↓      = Data flow / Relationship

  ─→     = Process / Action

1:M     = One-to-Many relationship
M:1     = Many-to-One relationship
1:1     = One-to-One relationship

(PK)    = Primary Key
(FK)    = Foreign Key

[...]   = Optional / Array
```

---

**Status**: Complete architecture documentation ✅  
**Next**: Implementation phase  
**Questions?**: Refer to specific sections above

