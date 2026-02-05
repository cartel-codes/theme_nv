# Novraux — Ideas & Brainstorming

> Central place to organize ideas, track progress, and brainstorm the brand.

---

## 1. Project Overview

Novraux is a fashion/clothing brand being built from the ground up with a focus on **SEO-first strategy**, **100% free and open-source tooling**, and a **dark luxury editorial aesthetic** (YSL / Hermès inspired). The goal is to build a fully functional, SEO-optimized e-commerce store and custom WordPress theme — without spending money on themes, plugins, or hosting during the build phase.

---

## 2. What's Done So Far

| Item | Status | Details |
|------|--------|---------|
| Brand Name | ✅ Done | Novraux |
| Domain | ✅ Done | novraux.com — registered on Cloudflare |
| Social Media | ✅ Done | Instagram, TikTok, X, Pinterest, Facebook — all @novraux |
| Security | ✅ Done | 2FA, password manager, auto-renew on domain |
| Coming Soon Page | ✅ Done | Static HTML page deployed on Vercel (dark luxury editorial design) |
| WordPress + WooCommerce | ✅ Done | Installed locally, PayPal connected |

---

## 3. Design Inspiration (YSL + Hermès)

| Brand | Key Traits to Adopt |
|-------|---------------------|
| **YSL** | Clean minimalism, large high-impact imagery, monochromatic, bold campaign visuals, streamlined nav, visual storytelling |
| **Hermès** | Poetic copywriting, emotional storytelling, heritage/craftsmanship, "house for objects" not just store, sophisticated language |

**Landing page focus:** Editorial hero, big imagery, evocative copy, products + blog as content pillars.

---

## 4. Phase 1 MVP — Traffic Test (Free Hosting)

**Goal:** See if SEO + products + blog articles can drive organic traffic.

| Element | Purpose |
|---------|---------|
| **Landing page** | Hero + featured products + latest articles |
| **Products** | SEO-optimized product pages (keywords, schema) |
| **Blog** | Content marketing, long-tail SEO, "fashion" / "style" keywords |
| **Hosting** | **Vercel** (free) — perfect for Next.js |
| **Database** | **Supabase** (free tier) or **Vercel Postgres** — replace local Docker for prod |

**Free stack:**
- Vercel: Free hobby tier (unlimited personal projects)
- Supabase: Free PostgreSQL (500MB, 2 projects)
- Domain: novraux.com on Cloudflare (already have)

**SEO checklist:** SSR, sitemap, robots.txt, JSON-LD, meta tags, canonical URLs ✓ (already built)

---

## 5. Phase 3: Dynamic SEO Management (Admin Panel)

**Goal:** Empower non-technical admins to optimize SEO for every product/article without code changes.

### Implementation Strategy
- Database-driven SEO (instead of hardcoded)
- Admin panel UI for managing SEO metadata
- Dynamic metadata rendering from database
- Smart fallbacks (auto-generate from product data)
- SEO health indicators and preview tools

### Key Components
| Component | Purpose | Priority |
|-----------|---------|----------|
| **Database Schema** | Add SEO fields to Product, Article, Category | Phase 3.1 |
| **Admin SEO Tab** | Edit meta title, description, OG image | Phase 3.1 |
| **Search Preview** | Show how it looks in Google results | Phase 3.2 |
| **Character Counters** | Validate meta length in real-time | Phase 3.2 |
| **Auto-Generate** | Suggest SEO from product name/description | Phase 3.2 |
| **SEO Health Indicator** | Show ✅/⚠️ for missing SEO | Phase 3.2 |
| **Bulk Tools** | Bulk edit, auto-generate for 100s of products | Phase 3.3 |
| **Audit Dashboard** | Find duplicate metas, missing alt text | Phase 3.3 |

### Database Schema Updates Required
```
Product Model:
  - metaTitle (String)
  - metaDescription (String)
  - ogImage (String)
  - schemaBrand (String) - default: "Novraux"
  - schemaCondition (String) - default: "NewCondition"

Article Model:
  - metaTitle (String)
  - metaDescription (String)
  - ogImage (String)
  - focusKeyword (String)

Category Model:
  - metaTitle (String)
  - metaDescription (String)
```

### Benefits
- ✅ Non-technical team can optimize SEO
- ✅ Per-product keyword targeting
- ✅ Easy to maintain at scale (100+ products)
- ✅ Smart fallbacks prevent empty meta tags
- ✅ Visual feedback on SEO quality
- ✅ Follow best practices (like Shopify, WooCommerce)

---

## 6. Ideas & Brainstorming

<!-- Add new ideas, features, or notes below -->

