# Novraux Master Roadmap

**Last Updated:** February 7, 2026
**Current Status:** Phase 3 (Early) - POD Foundation Complete

This document serves as the single source of truth for the project's progress, combining the original e-commerce goals with the specific Print-on-Demand (POD) integration plan.

---

## 🏁 Phase 1: Core E-commerce Foundation (Completed)
**Goal:** A functional e-commerce site with user management and basic catalog.

- [x] **Tech Stack Setup**: Next.js 14, TypeScript, Tailwind, Prisma, PostgreSQL.
- [x] **Authentication**: User signup, login, profile management (Custom + NextAuth).
- [x] **Product Catalog**: Database schema, product listing, details page.
- [x] **Shopping Cart**:
    - [x] Add/Remove items.
    - [x] Context-based state management.
    - [x] **Fix**: Guest/User cart merging.
    - [x] **Fix**: POD Product variant handling (Color/Size).
- [x] **Admin Dashboard**: Basic layout and product management.

---

## 🖨️ Phase 2: Print-on-Demand (POD) Foundation (Completed)
**Goal:** Seamless integration with Printful for product sourcing.

- [x] **Database Schema**:
    - [x] `PrintProvider`, `PrintProduct` models.
    - [x] `Inventory` tracking linked to variants.
- [x] **Printful Integration**:
    - [x] SDK/API Client (`lib/print-providers/printful`).
    - [x] Catalog Sync (`syncPrintfulProducts`).
- [x] **Admin POD Interface**:
    - [x] List synced products (`/admin/print-providers`).
    - [x] **Import UI**: Dedicated customization page (`/admin/print-providers/import/[id]`).
- [x] **Product Publishing**:
    - [x] Convert `PrintProduct` to Store `Product`.
    - [x] **AI SEO**: Auto-generate title, description, keywords on import.
    - [x] **Variant Mapping**: Correctly map Printful variants to Store options.
    - [x] **Image Handling**: Import mockups to product gallery.

---

## 💳 Phase 3: Checkout & Orders (Current Priority)
**Goal:** Enable users to actually buy products.

- [ ] **Checkout Logic**:
    - [ ] Checkout page UI.
    - [ ] Address management.
    - [ ] Shipping rate calculation.
- [ ] **Payments**:
    - [ ] Stripe Integration.
    - [ ] PayPal Integration (Refining current setup).
- [ ] **Order Management**:
    - [ ] Order database model.
    - [ ] Order creation API.
    - [ ] User Order History.
    - [ ] Admin Order Dashboard.
- [ ] **POD Order Forwarding**:
    - [ ] Webhook listener for confirmed payments.
    - [ ] Auto-create order in Printful API.

---

## ⭐ Phase 4: Social Proof & community
**Goal:** Build trust through reviews and engagement.

- [ ] **Review System**:
    - [ ] Database model for Reviews/Ratings.
    - [ ] Review submission UI.
    - [ ] Product page review display.
    - [ ] Verified purchase badge.
- [ ] **Wishlist**: Save for later.
- [ ] **Blog/Content**: Enhanced editorial section.

---

## 🚀 Phase 5: Scale & Optimization
**Goal:** Performance and advanced features.

- [ ] **Search & Discovery**: Advanced filtering, search indexing.
- [ ] **Analytics**: Dashboard for sales and views.
- [ ] **Performance**: Image optimization, caching strategies.
- [ ] **SEO**: Automated sitemaps, rich snippets (Schema.org).

---

## 🐛 Known Issues & Backlog

- [ ] **Image Optimization**: Ensure all new POD images rely on Next.js Image with proper sizes (Partially done).
- [ ] **Mobile UI**: Refine Admin UI for mobile devices.
- [ ] **Testing**: Increase unit test coverage for Cart and Order logic.
