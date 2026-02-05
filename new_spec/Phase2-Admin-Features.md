# Phase 2: Admin Backoffice & Advanced Product Management

## Overview
Phase 2 focuses on empowering the site administrator to manage content dynamically without code changes. We will implement a secure backoffice for managing products and collections, upgrade the product data model to support galleries, and refine the single product page for maximum conversion and SEO visibility.

## 1. Database Schema Upgrades
To support the new requirements, the Prisma schema needs the following updates:

### **Product Images (One-to-Many)**
Move from a single `imageUrl` string to a dedicated `ProductImage` table to support galleries.
```prisma
model Product {
  // ... existing fields
  images      ProductImage[]
  // ...
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  order     Int      @default(0)
  isPrimary Boolean  @default(false)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

### **SEO Metadata Fields**
Add dedicated SEO fields to products and collections for granular control.
- `metaTitle`
- `metaDescription`
- `keywords`

## 2. Admin Backoffice Features
A protected `/admin` route accessible only to authenticated users (using NextAuth.js or basic middleware protection initially).

### **Dashboard**
- Quick stats (Total Products, Total Orders, Recent Activity).

### **Product Management (CRUD)**
- **Create/Edit Product**: 
  - Fields: Name, Slug, Description, Price, Category.
  - **Image Uploader**: Drag-and-drop interface to upload multiple images (stored in Supabase Storage or similar).
  - **Reorder Images**: UI to set the primary image and gallery order.
  - **SEO Settings**: Preview and edit meta tags.
- **List View**: Filterable list of all products with status (Draft/Published).

### **Collection Management**
- Create and edit Categories.
- Manage collection-specific SEO.

## 3. SEO-Focused Single Product Page
Revamp `app/products/[slug]/page.tsx` to utilize the new multi-image data.

### **Features**
- **Image Gallery**: A high-end masonry or carousel view for product images.
- **Structured Data (JSON-LD)**: Enhanced `Product` schema with multiple images, price, availability, and brand info.
- **Metadata**: Dynamic generation of `title` and `description` from the new DB fields.
- **Related Products**: Dynamic suggestion based on Category.

## 4. Implementation Priorities
1.  **Schema Migration**: Update DB structure.
2.  **Auth Setup**: Implement basic security for `/admin`.
3.  **Backoffice UI**: Build the forms and list views.
4.  **Frontend Update**: Refactor Product Page to use new schema.
