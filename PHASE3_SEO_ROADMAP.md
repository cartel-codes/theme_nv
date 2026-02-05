# Phase 3: Dynamic SEO Management - Roadmap

**Date**: February 5, 2026  
**Project**: Novraux E-commerce Platform  
**Phase**: 3 (Admin SEO Management)  
**Status**: Planning

---

## 🎯 Phase 3 Overview

Phase 3 focuses on **database-driven SEO management** - allowing non-technical team members to optimize SEO for products, articles, and categories through an intuitive admin interface.

### Why Phase 3 Matters
- Scales SEO management (instead of hardcoding in code)
- Empowers marketing team to optimize without code changes
- Follows industry best practices (Shopify, WooCommerce, BigCommerce)
- Smart fallbacks prevent empty/missing SEO tags
- Real-time preview and validation

---

## 📋 Phase 3 Sub-Phases

### Phase 3.1: Core SEO Fields & Database (This Phase)
**Timeline**: 1-2 weeks  
**Complexity**: Medium

#### Tasks
- [ ] Add SEO fields to Prisma schema (Product, Article, Category)
- [ ] Create database migration
- [ ] Seed database with SEO data for existing products
- [ ] Add SEO fields to admin product form
- [ ] Add SEO fields to admin article form
- [ ] Update API endpoints to save/retrieve SEO data
- [ ] Update frontend to read SEO from database
- [ ] Implement fallback logic (auto-generate from content)

#### Database Changes
```prisma
model Product {
  // ... existing fields ...
  
  // NEW: SEO Fields
  metaTitle       String?     // Custom title for search results (50-60 chars)
  metaDescription String?     // Custom description (150-160 chars)
  ogImage         String?     // Custom OG image for social sharing
  schemaBrand     String?     @default("Novraux")
  schemaCondition String?     @default("NewCondition")
}

model Article {
  // ... existing fields ...
  
  // NEW: SEO Fields  
  metaTitle       String?
  metaDescription String?
  ogImage         String?
  focusKeyword    String?
}

model Category {
  // ... existing fields ...
  
  // NEW: SEO Fields
  metaTitle       String?
  metaDescription String?
}
```

#### Frontend Implementation
- Update `app/products/[slug]/page.tsx` to read SEO from database
- Update `app/blog/[slug]/page.tsx` to read SEO from database
- Implement smart fallbacks in metadata generation
- Inject Product/Article schema.org JSON-LD

---

### Phase 3.2: Admin UX Enhancements (Next Phase)
**Timeline**: 1-2 weeks  
**Complexity**: Medium

#### Tasks
- [ ] Create SEO preview component (Google search results preview)
- [ ] Add character count indicators for meta fields
- [ ] Add validation warnings (title too long, description format)
- [ ] Add auto-generate suggestions from product name/description
- [ ] Add SEO health indicator (✅ Good / ⚠️ Needs work)
- [ ] Create SEO settings page with tips/guidelines
- [ ] Add field descriptions and helper text

#### Component: SEO Preview
Shows how the product appears in Google search results:
```
[Meta Title]
[URL slug]
[Meta Description...]
```

#### Component: Character Counters
- Meta title: Current/60 characters (with color warning)
- Meta description: Current/160 characters (with color warning)

#### Component: SEO Health Check
- ✅ Meta title set (required)
- ✅ Meta description set (required)
- ✅ Product description detailed (100+ words)
- ✅ Images have alt text
- ✅ Focus keyword present in content

---

### Phase 3.3: Advanced Tools (Later Phase)
**Timeline**: 2-3 weeks  
**Complexity**: High

#### Tasks
- [ ] Bulk edit SEO metadata (edit 100 products at once)
- [ ] Auto-generate SEO for all products missing it
- [ ] Find duplicate meta titles/descriptions
- [ ] Find missing OG images
- [ ] Find products missing alt text on images
- [ ] Create SEO audit dashboard
- [ ] Generate SEO report (PDF export)
- [ ] Keyword density analyzer (optional)
- [ ] Readability scoring (Yoast-like, optional)

#### Bulk Operations
```
Tools → Bulk SEO Actions
├── Auto-generate missing SEO
├── Fix duplicate descriptions
├── Add missing OG images
└── Generate audit report
```

#### SEO Audit Dashboard
```
Overview
├── Total products: 150
├── With meta title: 120 (80%)
├── With meta description: 115 (76%)
├── Missing OG image: 30 (20%)
└── Duplicate descriptions: 5

Issues by Type
├── Missing meta title: 30 products
├── Too long meta description: 5 products
├── Missing alt text: 45 images
└── Duplicate meta descriptions: 5 products
```

---

## 📊 Implementation Checklist

### Phase 3.1: Core (This Week)

#### Database & Backend
- [ ] Update Prisma schema with SEO fields
- [ ] Create migration file
- [ ] Update admin API endpoints to handle SEO fields
- [ ] Implement fallback logic in metadata generation
- [ ] Test migration script

#### Admin Panel
- [ ] Add SEO section to product form
- [ ] Add SEO section to article form
- [ ] Add SEO fields to category editor
- [ ] Test form submission and data saving
- [ ] Verify data appears in database

#### Frontend
- [ ] Update product page to use database SEO
- [ ] Update article page to use database SEO
- [ ] Add schema.org JSON-LD injection
- [ ] Test in browser DevTools (check meta tags)
- [ ] Verify Google can see metadata (inspect page source)

#### Testing
- [ ] Unit tests for fallback logic
- [ ] Integration tests for API endpoints
- [ ] Manual testing of admin form
- [ ] Manual verification in dev server

---

### Phase 3.2: UX Enhancements (Next)

#### Components
- [ ] Build SEO preview component
- [ ] Build character counter component
- [ ] Build validation component
- [ ] Build SEO health indicator component
- [ ] Build auto-suggest component

#### Features
- [ ] Wire preview component to admin form
- [ ] Wire character counters
- [ ] Wire validation (show/hide warnings)
- [ ] Wire auto-suggest button
- [ ] Wire health indicator

#### Styling
- [ ] Match Novraux design system
- [ ] Add helpful tooltips
- [ ] Add error states
- [ ] Add success states

---

### Phase 3.3: Advanced Tools (Phase 4)

- [ ] Build bulk editor UI
- [ ] Implement bulk update API
- [ ] Build audit dashboard
- [ ] Implement audit scanning logic
- [ ] Create reports generator

---

## 🔧 Technical Implementation Details

### Fallback Logic (CRITICAL)

```typescript
// lib/seo.ts

export function generateMetaTitle(product: Product): string {
  // Use custom if set, otherwise auto-generate
  if (product.metaTitle) return product.metaTitle;
  
  // Fallback: {ProductName} | Novraux
  return `${product.name} | Novraux`;
}

export function generateMetaDescription(product: Product): string {
  // Use custom if set
  if (product.metaDescription) return product.metaDescription;
  
  // Fallback: First 155 chars of description
  if (product.description && product.description.length > 155) {
    return product.description.slice(0, 155) + '...';
  }
  
  // Fallback: Generic description
  return `Shop ${product.name} at Novraux. Premium luxury fashion.`;
}

export function generateMetaImage(product: Product): string {
  // Use custom OG image if set
  if (product.ogImage) return product.ogImage;
  
  // Fallback: First product image
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  
  // Fallback: Brand image
  return 'https://novraux.com/og-default.png';
}
```

### Schema.org Implementation

```typescript
// Generate Product schema for rich snippets
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "image": product.images,
  "brand": {
    "@type": "Brand",
    "name": product.schemaBrand || "Novraux"
  },
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "USD",
    "availability": product.stock > 0 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "123"
  }
};
```

---

## 🎯 Success Criteria

### Phase 3.1 Complete When
- ✅ All SEO fields in database for products/articles
- ✅ Admin can edit SEO via UI
- ✅ Frontend reads from database (not hardcoded)
- ✅ Fallbacks working for all edge cases
- ✅ Meta tags visible in page source (DevTools)
- ✅ No errors in console

### Phase 3.2 Complete When
- ✅ SEO preview component working
- ✅ Character counters accurate
- ✅ Validation warnings showing
- ✅ Auto-suggestions generating
- ✅ Health indicator calculating correctly
- ✅ All components styled and polished

### Phase 3.3 Complete When
- ✅ Bulk operations working at scale (1000+ products)
- ✅ Audit dashboard showing correct data
- ✅ Reports generating and downloadable
- ✅ Performance optimized (no slow queries)
- ✅ Documentation complete

---

## 📚 Resources & References

- **Next.js Metadata API**: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- **Prisma Migration**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Schema.org**: https://schema.org/Product
- **Google Search Central**: https://developers.google.com/search
- **Shopify SEO Best Practices**: https://help.shopify.com/en/manual/online-store/pages/seo

---

## 📝 Notes

- Start with just Product SEO, then expand to Articles/Categories
- Keep fallbacks simple and performant
- Test with Google Search Console (once deployed)
- Monitor keyword rankings post-launch
- Iterate based on Google Analytics data
