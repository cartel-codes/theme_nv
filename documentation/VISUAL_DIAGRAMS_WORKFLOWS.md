# Visual Diagrams & Workflow Documentation

**Document**: UML Diagrams, Sequence Diagrams, and Workflows  
**Date**: February 5, 2026  
**Project**: Novraux E-commerce Platform

---

## TABLE OF CONTENTS

1. [Database Schema Diagram (Text UML)](#database-schema-diagram-text-uml)
2. [System Sequence Diagrams](#system-sequence-diagrams)
3. [Component Interaction Diagrams](#component-interaction-diagrams)
4. [State Machine Diagrams](#state-machine-diagrams)
5. [Deployment Diagram](#deployment-diagram)

---

## DATABASE SCHEMA DIAGRAM (TEXT UML)

### Full Entity Relationship Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NOVRAUX DATABASE SCHEMA                       │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║                          USER MANAGEMENT ENTITIES                      ║
╚═══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────┐          ┌──────────────────────────────┐
│         User                 │          │      AdminUser               │
├──────────────────────────────┤          ├──────────────────────────────┤
│ id: String (CUID) [PK]       │          │ id: String (CUID) [PK]       │
│ email: String [UNIQUE]       │          │ email: String [UNIQUE]       │
│ password: String (hashed)    │          │ password: String (hashed)    │
│ firstName: String            │          │ username: String             │
│ lastName: String             │          │ role: String                 │
│ avatar: String (nullable)    │          │ isActive: Boolean            │
│ phone: String (nullable)     │          │ createdAt: DateTime          │
│ isActive: Boolean            │          │ updatedAt: DateTime          │
│ emailVerified: DateTime       │          └──────────────────────────────┘
│ createdAt: DateTime          │                     △
│ updatedAt: DateTime          │                     │
└───────────┬──────────────────┘                     │
            │                   ┌─────────────────────┴─────────────────┐
            │                   │                                       │
            │                   ├─────────────────────────────────────┐ │
            │ 1:M               │                                     │ │
            ├─────────────┬─────┴──────┬────────────────┬───────────┬─┘ │
            │             │            │                │           │    │
            ▼             ▼            ▼                ▼           ▼    ▼
    ┌────────────────┐ ┌──────────────────┐ ┌─────────────────┐ ┌──────────────┐
    │ UserSession    │ │ UserAuditLog     │ │ Order           │ │ Cart         │
    ├────────────────┤ ├──────────────────┤ ├─────────────────┤ ├──────────────┤
    │ id: String[PK] │ │ id: String[PK]   │ │ id: String[PK]  │ │ id: String[PK]│
    │ userId: String │ │ userId: String   │ │ userId: String  │ │ userId: String│
    │ [FK→User]      │ │ [FK→User]        │ │ [FK→User]       │ │ [FK→User]    │
    │ sessionToken   │ │ email: String    │ │ subtotal: Dec   │ │ createdAt    │
    │ [UNIQUE]       │ │ action: String   │ │ tax: Dec        │ │ updatedAt    │
    │ ip: String     │ │ ip: String       │ │ shipping: Dec   │ │              │
    │ userAgent      │ │ userAgent        │ │ total: Dec      │ │ Indexes:     │
    │ deviceName     │ │ status: String   │ │ status: Enum    │ │ - userId     │
    │ expiresAt[idx] │ │ errorMessage     │ │ paymentStatus   │ └──────────────┘
    │ createdAt[idx] │ │ metadata: Json   │ │ paymentId       │       │
    │ lastActivity   │ │ createdAt        │ │ shippingAddress │       │ 1:M
    │ [UNIQUE: idx]  │ │                  │ │ [JSON]          │       │
    └────────────────┘ └──────────────────┘ │ createdAt       │       ▼
                                             │ updatedAt       │  ┌──────────────┐
                                             └────────┬────────┘  │ CartItem     │
                                                      │           ├──────────────┤
                                                      │ 1:M       │ id: String[PK]│
                                                      │           │ cartId[FK→C] │
                                                      ▼           │ productId    │
                                             ┌──────────────────┐│ [FK→Product] │
                                             │  OrderItem       ││ quantity: Int │
                                             ├──────────────────┤│ createdAt    │
                                             │ id: String[PK]   ││ updatedAt    │
                                             │ orderId[FK→Order]││              │
                                             │ productId        ││ Constraint:  │
                                             │ [FK→Product]     ││ UNIQUE:      │
                                             │ quantity: Int    ││ (cartId,     │
                                             │ priceAtPurchase  ││  productId)  │
                                             │ createdAt        │└──────────────┘
                                             │ updatedAt        │
                                             └──────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                      PRODUCT & CONTENT ENTITIES                        ║
╚═══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────┐
│      Category                │
├──────────────────────────────┤
│ id: String (CUID) [PK]       │
│ name: String                 │
│ slug: String [UNIQUE]        │
│ description: String          │
│ metaTitle: String            │
│ metaDescription: String      │
│ createdAt: DateTime          │
│ updatedAt: DateTime          │
└───────────┬──────────────────┘
            │
            │ 1:M (reverse)
            │
            ▼
┌────────────────────────────────────────────────────────────────┐
│                    Product                                      │
├────────────────────────────────────────────────────────────────┤
│ id: String (CUID) [PK]                                         │
│ name: String                                                   │
│ slug: String [UNIQUE] [IDX]                                   │
│ description: String (nullable)                                 │
│ price: Decimal(10,2)                                          │
│ imageUrl: String                                               │
│ categoryId: String [FK→Category] [IDX]                        │
│ keywords: String (nullable)                                    │
│ metaTitle: String (nullable)                                   │
│ metaDescription: String (nullable)                             │
│ focusKeyword: String (nullable)                                │
│ ogImage: String (nullable)                                     │
│ deletedAt: DateTime (nullable) [IDX] - soft delete            │
│ createdAt: DateTime                                            │
│ updatedAt: DateTime                                            │
│                                                                │
│ Relations:                                                     │
│  - CartItem (1:M) - items pointing to this                    │
│  - OrderItem (1:M) - orders of this product                   │
└─────────┬──────────────────────────────────────────────────────┘
          │
          ├──────────────┬──────────────┐
          │              │              │
          ▼              ▼              ▼
 (used by CartItem) (used by OrderItem) (in Orders)


┌──────────────────────────────────────────────────────────────┐
│                     Post (Blog)                               │
├──────────────────────────────────────────────────────────────┤
│ id: String (CUID) [PK]                                       │
│ title: String                                                │
│ slug: String [UNIQUE] [IDX]                                 │
│ excerpt: String (nullable)                                   │
│ content: String                                              │
│ imageUrl: String (nullable)                                  │
│ keywords: String (nullable)                                  │
│ metaTitle: String (nullable)                                 │
│ metaDescription: String (nullable)                           │
│ focusKeyword: String (nullable)                              │
│ ogImage: String (nullable)                                   │
│ publishedAt: DateTime (nullable) [IDX]                       │
│  └─ null = draft, timestamp = published                       │
│ createdAt: DateTime                                          │
│ updatedAt: DateTime                                          │
│                                                              │
│ Published Query:                                             │
│  WHERE publishedAt IS NOT NULL                               │
│  ORDER BY publishedAt DESC                                   │
└──────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                      ADMIN & AUDIT ENTITIES                            ║
╚═══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────┐
│  AdminSession                │
├──────────────────────────────┤
│ id: String (CUID) [PK]       │
│ userId: String [FK→AdminUser]│
│ sessionToken: String         │
│ [UNIQUE] [IDX]               │
│ ip: String                   │
│ userAgent: String            │
│ expiresAt: DateTime [IDX]    │
│ createdAt: DateTime          │
│ lastActivity: DateTime       │
└──────────────────────────────┘


┌──────────────────────────────┐
│  AdminAuditLog               │
├──────────────────────────────┤
│ id: String (CUID) [PK]       │
│ userId: String [FK→AdminUser]│
│ email: String [IDX]          │
│ action: String               │
│  └─ "CREATE_PRODUCT"         │
│  └─ "UPDATE_POST"            │
│  └─ "DELETE_USER"            │
│  └─ "LOGIN_SUCCESS"          │
│  └─ "LOGIN_FAILED"           │
│ ip: String                   │
│ userAgent: String            │
│ status: String               │
│  └─ "SUCCESS"                │
│  └─ "FAILURE"                │
│ errorMessage: String         │
│ metadata: JSON               │
│ createdAt: DateTime [IDX]    │
└──────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════╗
║                       KEY CONSTRAINTS & INDEXES                        ║
╚═══════════════════════════════════════════════════════════════════════╝

Primary Keys (PK):
  All tables: id (CUID auto-generated)

Foreign Keys (FK):
  Product.categoryId → Category.id
  Cart.userId → User.id
  CartItem.cartId → Cart.id
  CartItem.productId → Product.id
  Order.userId → User.id
  OrderItem.orderId → Order.id
  OrderItem.productId → Product.id
  UserSession.userId → User.id
  AdminSession.userId → AdminUser.id

Unique Constraints:
  User: email
  Product: slug (per category?)
  Post: slug
  Category: slug
  CartItem: (cartId, productId) - one item per cart
  UserSession: sessionToken
  AdminSession: sessionToken

Indexes (for performance):
  User: email
  Product: slug, categoryId, deletedAt
  Post: slug, publishedAt
  CartItem: cartId, productId
  Order: userId, createdAt
  OrderItem: orderId, productId
  UserSession: userId, sessionToken, expiresAt
  UserAuditLog: userId, createdAt
  AdminAuditLog: userId, createdAt

Cascade Delete:
  Cart → CartItem (deleteMany)
  Order → OrderItem (deleteMany)
```

---

## SYSTEM SEQUENCE DIAGRAMS

### Sequence 1: User Registration Flow

```
┌─────────┐              ┌──────────────┐              ┌──────────────┐
│ Browser │              │ Next.js API  │              │ PostgreSQL   │
└────┬────┘              └──────┬───────┘              └──────┬───────┘
     │                          │                            │
     │─ POST /auth/user/signup  │                            │
     │─ (email, password, name) │                            │
     ├─────────────────────────→│                            │
     │                          │                            │
     │                          │─ Validate input            │
     │                          │  ├─ email format OK?       │
     │                          │  ├─ password length OK?    │
     │                          │  └─ email not duplicate?   │
     │                          │                            │
     │                          │─ Hash password (bcrypt)    │
     │                          │                            │
     │                          │─ CREATE User record        │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │              ✓ User created
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ CREATE Cart (1:1)         │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │              ✓ Cart created
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ CREATE UserSession        │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │         ✓ Session created
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ CREATE UserAuditLog       │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │       ✓ Audit logged
     │                          │←───────────────────────────┤
     │                          │                            │
     │ 200 OK                   │                            │
     │ { user: {...} }          │                            │
     │ Set-Cookie: sessionToken │                            │
     │←─────────────────────────┤                            │
     │                          │                            │
```

### Sequence 2: Add to Cart Flow

```
┌─────────┐              ┌──────────────┐              ┌──────────────┐
│ Browser │              │ Next.js API  │              │ PostgreSQL   │
└────┬────┘              └──────┬───────┘              └──────┬───────┘
     │                          │                            │
     │ POST /cart/add           │                            │
     │ (productId, qty)         │                            │
     │ Cookie: sessionToken     │                            │
     ├─────────────────────────→│                            │
     │                          │                            │
     │                          │─ Extract sessionToken      │
     │                          │                            │
     │                          │─ FIND UserSession         │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │    ✓ Session valid
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ FIND User (from session)  │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │         ✓ User found
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ FIND Product             │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │      ✓ Product exists
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ FIND or CREATE Cart      │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │          ✓ Cart found
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ UPSERT CartItem          │
     │                          │  (cartId, productId, qty) │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │       ✓ CartItem created
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ Recalculate totals        │
     │                          │  (map items, sum prices)   │
     │                          │                            │
     │ 200 OK                   │                            │
     │ { items: [...],          │                            │
     │   totalPrice: "..." }    │                            │
     │←─────────────────────────┤                            │
     │                          │                            │
     │ Update UI:               │                            │
     │  - CartContext.items++   │                            │
     │  - CartContext total++   │                            │
     │  - Show notification     │                            │
     │                          │                            │
```

### Sequence 3: Complete Checkout Flow

```
┌─────────┐              ┌──────────────┐              ┌──────────────┐
│ Browser │              │ Next.js API  │              │ PostgreSQL   │
└────┬────┘              └──────┬───────┘              └──────┬───────┘
     │                          │                            │
     │ STEP 1: Cart Review      │                            │
     │ GET /api/cart            │                            │
     ├─────────────────────────→│                            │
     │                          │─ FIND Cart +items         │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │   ✓ Cart items returned
     │                          │←───────────────────────────┤
     │ ← Display cart items     │                            │
     │                          │                            │
     │ STEP 2: Shipping Address │                            │
     │ (Form fill on client)    │                            │
     │                          │                            │
     │ STEP 3: Order Review     │                            │
     │ Display totals           │                            │
     │                          │                            │
     │ STEP 4: Payment          │                            │
     │ POST /checkout/create-intent                         │
     │ (items, shippingAddress) │                            │
     ├─────────────────────────→│                            │
     │                          │                            │
     │                          │─ Validate auth            │
     │                          │─ Validate items exist     │
     │                          │─ Calculate totals         │
     │                          │                            │
     │                          │─ CREATE Order record      │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │      ✓ Order created
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ CREATE OrderItems        │
     │                          │  (for each cart item)      │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │    ✓ OrderItems created
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ TODO: Call Stripe API    │
     │                          │                            │
     │ 201 Created              │                            │
     │ { orderId, clientSecret }│                            │
     │←─────────────────────────┤                            │
     │                          │                            │
     │ Show Stripe payment form │                            │
     │                          │                            │
     │ User authorizes payment  │                            │
     │ in Stripe UI             │                            │
     │                          │                            │
     │ POST /checkout/complete  │                            │
     │ (orderId, paymentId)     │                            │
     ├─────────────────────────→│                            │
     │                          │                            │
     │                          │─ FIND Order               │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │     ✓ Order found
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ TODO: Verify Stripe ✓    │
     │                          │                            │
     │                          │─ UPDATE Order status      │
     │                          │  (status: "paid")          │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │     ✓ Order updated
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ DELETE CartItems         │
     │                          │  (clear user's cart)       │
     │                          ├───────────────────────────→│
     │                          │                            │
     │                          │    ✓ CartItems deleted
     │                          │←───────────────────────────┤
     │                          │                            │
     │                          │─ TODO: Send email         │
     │                          │─ TODO: Create fulfillment │
     │                          │                            │
     │ 200 OK                   │                            │
     │ { orderId, status: paid }│                            │
     │←─────────────────────────┤                            │
     │                          │                            │
     │ Redirect                 │                            │
     │ /checkout/success?orderId│                            │
     │                          │                            │
     │ Display success page     │                            │
     │                          │                            │
```

---

## COMPONENT INTERACTION DIAGRAMS

### Frontend Component Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│                        app/layout.tsx                            │
│                  (Root Layout with Providers)                    │
└────────────────┬─────────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┬──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐       ┌──────────┐       ┌──────────┐
    │ Header │       │ Page     │       │ Footer   │
    │        │       │ Content  │       │          │
    └────┬───┘       └──────────┘       └──────────┘
         │
    ┌────┴──────┬──────────┬──────────────┐
    │           │          │              │
    ▼           ▼          ▼              ▼
┌───────┐  ┌──────┐  ┌─────────┐  ┌─────────────┐
│ Logo  │  │ Nav  │  │CartIcon │  │ThemeToggle  │
│       │  │      │  │   ▼     │  │             │
│       │  │      │  │CartDra- │  │             │
│       │  │      │  │  wer    │  │             │
│       │  │      │  │  ▼      │  │             │
│       │  │      │  │CartItem*│  │             │
└───────┘  └──────┘  └─────────┘  └─────────────┘


┌───────────────────────────────────────────────────────────┐
│              Product Listing Pages                          │
├───────────────────────────────────────────────────────────┤
│  /products (public)                                       │
│  └─ ProductCard* (mapped)                                 │
│     ├─ Product Image                                     │
│     ├─ Product Name                                      │
│     ├─ Price                                             │
│     └─ "Add to Cart" Button                              │
│                                                           │
│  /products/[slug] (detail page)                          │
│  ├─ ProductImages (carousel)                              │
│  ├─ ProductDetails                                        │
│  │  ├─ Name, Price, Description                          │
│  │  └─ Quantity Selector → "Add to Cart"                │
│  ├─ ProductReviews (future)                              │
│  └─ RelatedProducts*                                      │
└───────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────┐
│              Cart & Checkout Pages                          │
├───────────────────────────────────────────────────────────┤
│  /cart                                                    │
│  ├─ CartItem* (for each)                                  │
│  │  ├─ Product Image                                     │
│  │  ├─ Product Name                                      │
│  │  ├─ Unit Price                                        │
│  │  ├─ Quantity Input → PUT /api/cart/update             │
│  │  ├─ Item Subtotal                                     │
│  │  └─ Remove Button → DELETE /api/cart                  │
│  │                                                        │
│  ├─ Cart Summary                                          │
│  │  ├─ Subtotal                                          │
│  │  └─ "Proceed to Checkout" Button                      │
│  │                                                        │
│  /checkout                                               │
│  ├─ Step Indicator (1/2/3/4)                             │
│  │  ├─ Step 1: Cart Review                              │
│  │  │  └─ CartItem* (read-only)                          │
│  │  │                                                    │
│  │  ├─ Step 2: Shipping Address                         │
│  │  │  └─ AddressForm                                    │
│  │  │     ├─ FirstName, LastName                        │
│  │  │     ├─ Email, Phone                               │
│  │  │     ├─ Street, City, State, ZIP                   │
│  │  │     └─ Country                                     │
│  │  │                                                    │
│  │  ├─ Step 3: Review Order                             │
│  │  │  ├─ CartItem* (summary)                            │
│  │  │  ├─ Shipping Address (summary)                    │
│  │  │  └─ Totals                                         │
│  │  │                                                    │
│  │  └─ Step 4: Payment                                  │
│  │     ├─ Order Summary                                  │
│  │     ├─ Stripe Element (TODO)                          │
│  │     └─ "Complete Order" Button                        │
│  │                                                        │
│  /checkout/success                                        │
│  ├─ Success Message                                       │
│  ├─ Order ID                                              │
│  └─ Links (home, continue shopping)                      │
└───────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────┐
│              Admin Pages                                    │
├───────────────────────────────────────────────────────────┤
│  /admin/login                                             │
│  └─ LoginForm                                             │
│     ├─ Email Input                                       │
│     └─ Password Input                                    │
│                                                           │
│  /admin (layout)                                          │
│  ├─ Sidebar Navigation                                    │
│  │  ├─ Dashboard                                         │
│  │  ├─ Products                                          │
│  │  ├─ Categories                                        │
│  │  ├─ Blog Posts                                        │
│  │  ├─ Users                                             │
│  │  ├─ Orders (future)                                   │
│  │  └─ Audit Logs                                        │
│  │                                                        │
│  ├─ Main Content                                          │
│  │                                                        │
│  → /admin/products                                        │
│    ├─ Product List (table)                               │
│    └─ [Edit/Delete buttons]                              │
│                                                           │
│  → /admin/products/new                                    │
│    └─ ProductForm                                         │
│       ├─ Name, Slug, Price                               │
│       ├─ Description (Rich Editor)                       │
│       ├─ CategorySelector                                │
│       ├─ ImageUploader                                   │
│       ├─ SEO Fields (meta title, desc, etc)             │
│       ├─ SEOPreview                                      │
│       ├─ SEOHealthIndicator                              │
│       └─ Publish Button                                  │
│                                                           │
│  → /admin/posts/new                                       │
│    └─ PostForm (similar to ProductForm)                  │
│       ├─ Title, Slug                                     │
│       ├─ Content (Rich Editor)                           │
│       ├─ ImageUploader                                   │
│       ├─ SEO Fields                                      │
│       ├─ AI SEO Generator Button                         │
│       └─ Publish Button                                  │
│                                                           │
│  → /admin/audit-logs                                      │
│    └─ AuditLogList (table)                               │
│       ├─ Email, Action, Date                             │
│       └─ Details (expandable)                            │
└───────────────────────────────────────────────────────────┘
```

---

## STATE MACHINE DIAGRAMS

### Order Status State Machine

```
                           ┌─────────────┐
                           │   pending   │
                           │ (awaiting   │
                           │  payment)   │
                           └──────┬──────┘
                                  │
                         payment_succeeded
                                  │
                                  ▼
                           ┌─────────────┐
                           │    paid     │
                           │ (payment    │
                           │  confirmed) │
                           └──────┬──────┘
                                  │
                           fulfillment_
                           processing
                                  │
                                  ▼
                           ┌─────────────┐
                           │ processing  │
                           │ (packing)   │
                           └──────┬──────┘
                                  │
                           shipped
                                  │
                                  ▼
                           ┌─────────────┐
                           │  shipped    │
                           │ (in transit)│
                           └──────┬──────┘
                                  │
                          delivered_
                           confirmed
                                  │
                                  ▼
                           ┌─────────────┐
                           │ delivered   │
                           │ (complete)  │
                           └─────────────┘


Cancel / Refund paths (from any state):
   ┌─────────────────────┐
   │  any_state -------→ | cancelled |
   │                     └─────┬─────┘
   │                           │
   │                    refund_processed
   │                           │
   │                           ▼
   │                   ┌─────────────────┐
   └──────────────────→| refunded        |
                       └─────────────────┘
```

### Session State Machine

```
                    ┌──────────────┐
                    │  no session  │
                    │  (logged out)│
                    └──────┬───────┘
                           │
                       login/signup
                           │
                           ▼
                    ┌──────────────┐
                    │  active      │
                    │  (valid token│
                    │   not expired)
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
        logout     activity_update   timeout
            │              │              │
            │              ▼              │
            │         ┌──────────────┐   │
            │         │  keeping_alive   │
            │         │  (refreshing)│   │
            │         └──────┬───────┘   │
            │                │           │
            └────────────────┼───────────┘
                             │
                       session_invalid
                             │
                             ▼
                    ┌──────────────┐
                    │  expired     │
                    │  (redirect   │
                    │   to login)  │
                    └──────┬───────┘
                           │
                       logout
                           │
                           ▼
                    ┌──────────────┐
                    │  no session  │
                    └──────────────┘
```

### Cart State Machine

```
                    ┌──────────────┐
                    │    empty     │
                    │  (0 items)   │
                    └──────┬───────┘
                           │
                       add_item
                           │
                           ▼
                    ┌──────────────┐
                    │   filled     │◄─────┐
                    │ (1+ items)   │      │
                    └──────┬───────┘      │
                           │       update_qty
                    ┌──────┴──────┐       │
                    │             ╱       │
                add_item    remove_item  │
                    │             │       │
                    └──────┬──────┴───────┘
                           │
                    (if 0 items left) → empty
                           │
                           ▼ (proceed_checkout)
                    ┌──────────────┐
                    │  processing  │
                    │  (in checkout)
                    └──────┬───────┘
                           │
                    order_completed
                           │
                           ▼
                    ┌──────────────┐
                    │   cleared    │
                    │ (order placed│
                    │  cart empty) │
                    └──────┬───────┘
                           │
                           │ (new session)
                           │
                           ▼
                    ┌──────────────┐
                    │    empty     │
                    └──────────────┘
```

---

## DEPLOYMENT DIAGRAM

### Production Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PRODUCTION DEPLOYMENT (Vercel)                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          EDGE LAYER (CDN)                               │
│                  Vercel Edge Network (global)                           │
│  ├─ Static assets caching                                              │
│  ├─ Image optimization                                                 │
│  └─ Request routing                                                    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     VERCEL SERVERLESS FUNCTIONS                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                  Next.js Runtime (Node.js)                        │ │
│  │  ├─ app/ (Page components & API routes)                         │ │
│  │  ├─ middleware.ts (Auth & routing)                              │ │
│  │  ├─ lib/ (Business logic & utilities)                           │ │
│  │  └─ prisma/ (ORM & database client)                             │ │
│  │                                                                   │ │
│  │  Deployment: Automatic on git push to main                      │ │
│  │  Builds: Incremental (only changed functions)                   │ │
│  │  Scaling: Auto-scales based on traffic                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌────────────────────┐     ┌────────────────────┐
        │  Supabase Cloud    │     │   AWS S3/CloudflareR2       │
        │  PostgreSQL 16     │     │   Image Storage    │
        ├────────────────────┤     ├────────────────────┤
        │ ├─ Database        │     │ ├─ Product images  │
        │ │ ├─ 20+ tables    │     │ │ ├─ Blog images   │
        │ │ ├─ Automated     │     │ │ ├─ Uploaded files│
        │ │ │   backups      │     │ │ └─ CDN delivery  │
        │ │ ├─ SSL/TLS       │     │                    │
        │ │ ├─ Connection    │     │ Replication:       │
        │ │ │   pooling      │     │ ├─ Multi-region   │
        │ │ │   (PgBouncer)  │     │ └─ Auto-scaling    │
        │ │ └─ Row-level     │     │                    │
        │ │     security     │     │ Optimization:      │
        │ │     (RLS)        │     │ ├─ Compression    │
        │ │                  │     │ ├─ WebP format    │
        │ └─ Dashboard       │     │ └─ Responsive      │
        │   (Supabase UI)    │     │   sizing           │
        │                    │     │                    │
        │ Connection:        │     │ Usage: API Routes  │
        │ DATABASE_URL &     │     │ ImageUploader      │
        │ DIRECT_URL env     │     │ components        │
        └────────────────────┘     └────────────────────┘
                    │                           │
                    │ Prisma ORM               │ Fetch URLs
                    │ queries                  │ 
                    └─────────────┬────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌────────────────────┐     ┌────────────────────┐
        │ Stripe (Payment)   │     │ Google AI / Groq   │
        │ (Phase 4B)         │     │ (AI Generation)    │
        ├────────────────────┤     ├────────────────────┤
        │ ├─ Payment intent  │     │ ├─ SEO generation  │
        │ │ ├─ Charges       │     │ ├─ Content assist  │
        │ │ ├─ Webhooks      │     │ └─ Keywords       │
        │ │ └─ Test API key  │     │                    │
        │ │    (development) │     │ API calls from:    │
        │ │                  │     │ Admin form handler │
        │ └─ Dashboard UI    │     └────────────────────┘
        └────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSERS & DEVICES                             │
│  ├─ Web browsers (modern: Chrome, Firefox, Safari, Edge)                │
│  ├─ Mobile browsers (iOS Safari, Chrome Android)                        │
│  └─ Desktop apps (if any)                                              │
│                                                                          │
│  JavaScript enabled required (for React components)                     │
│  Cookies support required (sessionToken storage)                        │
│  HTTPs/TLS 1.2+ (security)                                             │
└─────────────────────────────────────────────────────────────────────────┘


Environment Variables (Vercel):
┌─────────────────────────────────────┐
│ DATABASE_URL                        │
│ DIRECT_URL                          │
│ NEXTAUTH_SECRET (future)            │
│ STRIPE_PUBLIC_KEY (if using)        │
│ STRIPE_SECRET_KEY (if using)        │
│ GROQ_API_KEY (if using)             │
│ SENDGRID_API_KEY (if using)         │
│ AWS_ACCESS_KEY_ID (if using S3)     │
│ AWS_SECRET_ACCESS_KEY (if S3)       │
│ R2_ACCOUNT_ID (if using Cloudflare  │
│ R2_ACCESS_KEY_ID (if R2)            │
│ R2_SECRET_ACCESS_KEY (if R2)        │
└─────────────────────────────────────┘


Monitoring & Observability:
┌─────────────────────────────────────┐
│ Vercel Analytics & Monitoring       │
│ ├─ Function execution times         │
│ ├─ Database query performance       │
│ ├─ Error tracking                   │
│ └─ Traffic patterns                 │
│                                     │
│ Supabase Monitoring                 │
│ ├─ Database connections             │
│ ├─ Query performance                │
│ ├─ Storage usage                    │
│ └─ Backup status                    │
│                                     │
│ Custom Logging                      │
│ ├─ Audit logs (UserAuditLog)        │
│ ├─ Admin logs (AdminAuditLog)       │
│ └─ Error logs (console)             │
└─────────────────────────────────────┘
```

---

**Document Status**: Complete with all diagrams and workflows  
**Last Updated**: February 5, 2026

