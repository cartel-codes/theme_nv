# Printful Print-on-Demand Integration Guide

## Overview

This document covers the complete Printful print-on-demand (POD) integration for Novraux, enabling reselling of brand products with custom designs through Printful as a supplier.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Brand Products Source                      │
│  (Adidas, Nike, etc. - via APIs, imports, or manual add)    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Novraux Product Database                       │
│  - Product metadata, pricing, descriptions                   │
│  - Variant management (color, size, etc.)                    │
│  - Design file uploads and management                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Printful Catalog Synchronization                   │
│  - /api/admin/print-providers/sync - Fetch & store catalog   │
│  - PrintProduct model - Store Printful products              │
│  - Variant data with images and pricing                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│    Product Customization & Design Management                 │
│  - Upload custom designs (logos, graphics)                   │
│  - Generate mockup previews                                  │
│  - Template mapping (front/back, placement)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Order Management & Fulfillment                       │
│  - Order creation in Printful                                │
│  - Tracking & status updates via webhooks                    │
│  - Shipping integration                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Customer Reviews & Feedback                     │
│  - Post-delivery reviews with photos                         │
│  - Quality ratings & product ratings                         │
│  - Community feedback integration                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Brand Product Reselling
- **Catalog Synchronization**: Fetch Printful's full catalog or specific product types
- **Brand Aggregation**: Link products to brands (Adidas, Nike, etc.) via metadata
- **Pricing Management**: Set markups on Printful's base prices
- **Inventory Sync**: Real-time stock availability from Printful

### 2. Product Management
- **Variant Handling**: Color, size, material options
- **Image Management**: Product images, variant previews, mockups
- **Design Templates**: Custom design placement on garments
- **SKU Mapping**: Local SKU to Printful product mapping

### 3. Customer Reviews & Ratings
- **Product Reviews**: 5-star ratings, written reviews with photos
- **Supplier Quality Rating**: Feedback specific to Printful quality
- **Design Quality**: Feedback on custom design printing quality
- **Fulfillment Feedback**: Shipping speed, packaging, condition

### 4. Order Processing
- **Frictionless Flow**: Cart → Checkout → Order creation in Printful → Tracking
- **Payment Integration**: Stripe/PayPal for payments
- **Order Status Tracking**: Real-time Printful order status
- **Webhook Handling**: Automatic updates from Printful

## Database Schema

### Core POD Models

```typescript
// PrintProvider - Printful account connection
model PrintProvider {
  id              String   @id @default(cuid())
  name            String   // "printful"
  apiKey          String   @db.Text
  isActive        Boolean  @default(true)
  shopId          String?
  webhookSecret   String?
  
  printProducts   PrintProduct[]
  printOrders     PrintOrder[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// PrintProduct - Synchronized Printful catalog item
model PrintProduct {
  id              String   @id @default(cuid())
  providerId      String
  provider        PrintProvider @relation(fields: [providerId], references: [id])
  
  externalId      String   // Printful product ID
  blueprintId     String?  // Printful blueprint ID (for custom designs)
  name            String   // Product name
  description     String?  @db.Text
  variants        Json     // Array of variant data {id, size, color, price, image, inStock}
  mockupUrls      Json     // {main, variants: []}
  designFiles     Json     // {fileId, url, placement}
  
  isPublished     Boolean  @default(false)
  syncedAt        DateTime @default(now())
  
  products        Product[]  // Our store products linked to this
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([providerId, externalId])
}

// Enhanced Product model
model Product {
  // ... existing fields ...
  isPrintOnDemand Boolean?
  printProductId  String?
  printProduct    PrintProduct? @relation(fields: [printProductId], references: [id])
  
  // Brand info
  brandName       String?  // "Adidas", "Nike", etc.
  brandLogoUrl    String?
  
  // Reviews
  reviews         Review[]
  averageRating   Float    @default(0)
  reviewCount     Int      @default(0)
}

// PrintOrder - Order in Printful
model PrintOrder {
  id              String   @id @default(cuid())
  providerId      String
  provider        PrintProvider @relation(fields: [providerId], references: [id])
  
  externalOrderId String   @unique // Printful order ID
  orderId         String   // Novraux order ID
  order           Order    @relation(fields: [orderId], references: [id])
  
  status          String   // "draft", "confirmed", "failed", "canceled", "shipped"
  trackingUrl     String?
  estimatedShip   DateTime?
  estimatedDeliv  DateTime?
  
  items           Json     // Order items {printProductId, variantId, qty, files}
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([orderId])
  @@index([externalOrderId])
}

// PrintWebhookLog - Webhook tracking
model PrintWebhookLog {
  id              String   @id @default(cuid())
  event           String   // "order.confirmed", "order.shipment.created"
  payload         Json
  processed       Boolean  @default(false)
  
  createdAt       DateTime @default(now())
}

// Review - Customer reviews
model Review {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  rating          Int      // 1-5 stars
  title           String?
  content         String?  @db.Text
  
  // Quality aspects
  printQuality    Int?     // 1-5 specific to print quality
  fittingSize     Int?     // 1-5 for sizing
  materialQuality Int?     // 1-5 for material
  shippingSpeed   Int?     // 1-5 for fulfillment speed
  
  images          String[] // URLs of review photos
  verified        Boolean  @default(false) // Purchased & fulfilled
  
  likes           Int      @default(0)
  helpful         Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([productId])
  @@index([userId])
}
```

## API Endpoints

### Sync Endpoints
```
GET  /api/admin/print-providers/sync        - List synced products (paginated)
POST /api/admin/print-providers/sync        - Trigger catalog sync
```

### Product Management
```
GET    /api/admin/print-providers/products           - List all POD products
POST   /api/admin/print-providers/products           - Create new POD product
GET    /api/admin/print-providers/products/:id       - Get product details
PATCH  /api/admin/print-providers/products/:id       - Update product
DELETE /api/admin/print-providers/products/:id       - Remove product

GET    /api/admin/print-providers/products/:id/mockups  - Generate mockups
POST   /api/admin/print-providers/products/:id/publish  - Publish to store
```

### Design Management
```
POST   /api/admin/print-providers/designs/upload     - Upload design file
GET    /api/admin/print-providers/designs/:id        - Get design info
DELETE /api/admin/print-providers/designs/:id        - Remove design
POST   /api/admin/print-providers/designs/:id/preview - Preview with mockup
```

### Order Management
```
POST   /api/orders/print-providers/create            - Create order in Printful
GET    /api/orders/:id/print-status                  - Get Printful order status
GET    /api/orders/:id/tracking                      - Get tracking info
```

### Review Endpoints
```
POST   /api/products/:id/reviews                     - Submit review
GET    /api/products/:id/reviews                     - List product reviews
PATCH  /api/reviews/:id                              - Update review
GET    /api/reviews/verified                         - Get verified reviews
POST   /api/reviews/:id/helpful                      - Mark as helpful
```

### Webhook
```
POST   /api/webhooks/printful                        - Printful webhook receiver
```

## Implementation Flow

### 1. Product Sync Flow
```
User clicks "Sync Catalog" 
    ↓
Fetch 10 products from Printful API
    ↓
For each product:
  - Fetch detailed variants
  - Fetch variant images
  - Store in PrintProduct table
    ↓
Return success with count
    ↓
Products appear in product list (paginated)
    ↓
Users can expand to see variants & images
```

### 2. Product Creation Flow
```
User selects a synced Printful product
    ↓
User adds brand info (Adidas, Nike)
    ↓
User sets markup price (e.g., Printful $20 → Store $35)
    ↓
User uploads custom design file
    ↓
System generates mockup preview
    ↓
User publishes to store
    ↓
Product appears in customer storefront
```

### 3. Order Processing Flow
```
Customer selects product & variant
    ↓
Adds to cart
    ↓
Checkout with custom options
    ↓
Payment processed (Stripe/PayPal)
    ↓
Order created in database
    ↓
Trigger: Create order in Printful
    ↓
Printful confirms & ships
    ↓
Webhook updates order status
    ↓
Customer receives tracking link
    ↓
Customer receives product
    ↓
Customer can leave review
```

### 4. Review & Feedback Flow
```
Customer receives product
    ↓
Email reminder to leave review
    ↓
Customer rates & writes review
    ↓
Can upload photos of product
    ↓
Review marked as "verified purchase"
    ↓
Appears on product page
    ↓
Other customers can rate helpfulness
    ↓
Store owner can respond/manage
```

## Current Implementation Status

✅ **Completed:**
- Printful API client setup
- Catalog sync (10 products limit)
- Database schema for POD
- Product sync page with pagination
- Product images & variant display
- Admin configuration page

⏳ **In Progress:**
- Webhook setup for order updates
- Full CRUD for products

📋 **Planned:**
- Design upload & mockup generation
- Order creation in Printful
- Review system with ratings
- Brand aggregation UI
- Pricing management
- Inventory sync
- Customer dashboard
- Advanced filters & search

## Testing

### Manual Testing Checklist
- [ ] Sync 10 products successfully
- [ ] Verify all variant data appears
- [ ] Check images load correctly
- [ ] Pagination works (5 per page)
- [ ] Expand/collapse products smooth
- [ ] Create test order in Printful
- [ ] Receive webhook confirmation
- [ ] Order status updates automatically

### API Testing
```bash
# Test sync endpoint
curl -X POST http://localhost:3001/api/admin/print-providers/sync \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get synced products
curl http://localhost:3001/api/admin/print-providers/sync?page=1&pageSize=5
```

## Troubleshooting

### Common Issues

**Sync Timeout**
- Limit reduced to 10 products to avoid API rate limits
- Batches process with 500ms delays
- Increase timeout in browser if needed

**Images Not Loading**
- Verify Printful CDN URLs are correct
- Check CORS settings if image requests fail
- Use image proxy if external URLs blocked

**Missing Variants**
- Some products may have limited variant data from Printful
- Variants are fetched on-demand to avoid huge payloads
- Check Printful dashboard for complete variant list

**Webhook Issues**
- Verify webhook secret matches `.env.local`
- Check firewall allows Printful → Your Server
- Monitor webhook logs in database

## References

- [Printful API Docs](https://www.printful.com/docs)
- [Printful Product Catalog](https://www.printful.com/api/docs)
- [Webhook Events](https://www.printful.com/docs/webhooks)
- [Order API](https://www.printful.com/docs/orders)
