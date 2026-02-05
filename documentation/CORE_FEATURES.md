# Novraux — Core Features Documentation

> Documentation for the original e-commerce features: products, cart, blog, and SEO.

**Last Updated**: February 2026

---

## Overview

This document covers the core storefront features built before the admin panel. These features power the public-facing site.

---

## 1. Products

### Product Catalog

- **Route**: `/products`
- **Data**: Product model with `name`, `slug`, `description`, `price`, `imageUrl`, `category`, SEO fields
- **Features**: Product listing, category filtering, sorting (via API)

### Product Detail

- **Route**: `/products/[slug]`
- **Data**: Single product by slug
- **Features**: Add to cart, JSON-LD schema, Open Graph meta

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products. Query params: `category`, `sort`, `order` |
| GET | `/api/products/[id]` | Get single product (by id or slug) |

### Product Model (Prisma)

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  imageUrl    String?
  metaTitle   String?
  metaDescription String?
  keywords    String?
  images      ProductImage[]
  categoryId  String?
  category    Category?
  ...
}
```

---

## 2. Shopping Cart

### Cart Page

- **Route**: `/cart`
- **Persistence**: Session-based for guests, user-linked for authenticated users
- **Features**: Add, update quantity, remove items; cart total; checkout button

### Cart Drawer

- **Component**: `components/CartDrawer.tsx`
- **Trigger**: Opens automatically on add-to-cart, or via CartIcon click
- **Features**: 
  - Slide-out panel from right
  - Product images, quantities, prices
  - Quick quantity controls (+/-)
  - "View Full Cart" and "Proceed to Checkout" buttons
  - ESC key or click-outside to close

### Cart Context (Global State)

- **File**: `contexts/CartContext.tsx`
- **Provider**: `CartProvider` wraps the app in `layout.tsx`
- **Hook**: `useCart()` for accessing cart state and actions
- **Functions**:
  - `addToCart(productId, quantity)` — adds item, opens drawer
  - `updateQuantity(itemId, quantity)` — updates item
  - `removeItem(itemId)` — removes item
  - `refreshCart()` — re-fetches cart from API
  - `openDrawer()` / `closeDrawer()` — drawer visibility

### Checkout

- **Route**: `/checkout`
- **Status**: Placeholder page (Stripe integration pending)
- **Features Preview**: Card, Apple Pay, Google Pay support coming

### Cart Logic

- **lib/cart.ts**: `getOrCreateCart()`, `getCartSessionId()` — handles both guest and authenticated carts
- **Authentication**: Add-to-cart requires login (redirects to `/auth/login`)
- **Cart Merge**: Guest cart items merge into user cart on login

### API Endpoints

| Method | Endpoint | Body | Auth Required | Description |
|--------|----------|------|---------------|-------------|
| GET | `/api/cart` | — | No | Get cart items |
| POST | `/api/cart` | `{ productId, quantity? }` | **Yes** | Add to cart |
| PUT | `/api/cart` | `{ itemId, quantity }` | No | Update quantity |
| DELETE | `/api/cart?itemId=xxx` | — | No | Remove item |

### Cart Cookie

- **Name**: `cart_session_id`
- **Purpose**: Anonymous cart identification (merged on login)

---

## 3. Blog (Journal)

### Blog Listing

- **Route**: `/blog`
- **Data**: Post model

### Blog Post

- **Route**: `/blog/[slug]`
- **Data**: Single post by slug
- **Features**: Article JSON-LD, meta tags

### Post Model (Prisma)

```prisma
model Post {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  excerpt     String?
  content     String
  imageUrl    String?
  publishedAt DateTime
  ...
}
```

### Content Management

- Posts are managed via database (Prisma Studio or future admin UI)
- No CMS integration yet — content is in DB

---

## 4. SEO

### Implemented

- **lib/seo.ts**: `generateMetadata()`, `generateJsonLd()` — dynamic meta
- **app/sitemap.ts**: Dynamic sitemap (products, blog, static pages)
- **app/robots.ts**: robots.txt with sitemap URL
- **JSON-LD**: Product schema, Article schema for blog posts

### Meta Tags

- Title, description
- Open Graph (og:title, og:description, og:image)
- Twitter cards
- Canonical URLs

### Environment

- `NEXT_PUBLIC_SITE_URL`: Used for canonical URLs, sitemap, OG images

---

## 5. Design System

### Colors (from test-index.html)

- `--bg`: #0a0a0a
- `--text`: #e8e4df
- `--text-dim`: #6b6560
- `--accent`: #c9a96e (gold)
- `--border`: rgba(201, 169, 110, 0.12)

### Fonts

- **Cormorant Garamond**: Headings, serif
- **Inter**: UI, sans-serif

### Effects

- Grain overlay
- Ambient gradient background
- Dark luxury editorial styling (YSL / Hermès inspired)

---

## 6. Public Pages Summary

| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero, featured products, latest blog |
| `/products` | Product catalog |
| `/products/[slug]` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout (placeholder for Stripe) |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/about` | About page |
| `/contact` | Contact page |

---

## 7. Related Files

```
app/
├── page.tsx              # Homepage
├── products/
│   └── [slug]/
│       └── AddToCartButton.tsx
├── cart/
│   ├── page.tsx          # Cart page
│   └── CartActions.tsx   # Quantity controls
├── checkout/
│   └── page.tsx          # Checkout placeholder
├── blog/
├── about/
├── contact/
├── sitemap.ts
└── robots.ts

contexts/
└── CartContext.tsx       # Global cart state

lib/
├── cart.ts               # Cart logic (get/create)
├── seo.ts
└── prisma.ts

components/
├── Header.tsx
├── Footer.tsx
├── ProductCard.tsx
├── CartIcon.tsx          # Cart badge (uses CartContext)
└── CartDrawer.tsx        # Slide-out cart panel
```

---

## 8. Quick Reference

- **Add product**: Use Prisma Studio or admin products API
- **Add blog post**: Insert into `Post` table via Prisma
- **Cart**: Requires authentication to add items; uses CartContext for global state
- **Cart Drawer**: Opens on add-to-cart or click CartIcon
- **SEO**: Set `NEXT_PUBLIC_SITE_URL` in production

