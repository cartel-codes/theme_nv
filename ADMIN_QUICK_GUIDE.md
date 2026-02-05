# Phase 2 Admin Backoffice - Quick Start Guide

## 🚀 Accessing the Admin Panel

**URL**: `http://localhost:3001/admin`  
**Default Credentials**: 
- Email: `admin@novraux.com`
- Password: `password`

## 📍 Admin Navigation

### Main Menu (Left Sidebar)
```
Novraux
├── Dashboard          → Overview & statistics
├── Products           → Product CRUD management  
├── Collections        → Category management
├── Orders             → Coming soon
├── Profile            → Account settings
└── [Return to Store]  → Exit admin panel
```

## 🎛️ Key Admin Features

### Products Page (`/admin/products`)
- **Search**: Filter by name, slug, description
- **List View**: Table with product details
- **Pagination**: 20 items per page
- **Actions**: Edit, Delete buttons
- **New Product**: "+ Add Product" button

### Create/Edit Product (`/admin/products/new` or `/admin/products/[id]`)
**Sections**:
1. **Basic Information**
   - Product Name (required)
   - Slug/URL (required, must be unique)
   - Description (optional)
   - Price (required)
   - Category (optional)

2. **Product Images**
   - Drag-drop upload area
   - Click to select files
   - Reorder images (up/down arrows)
   - Edit alt text per image
   - Remove image (X button)
   - Primary image auto-marked (first)

3. **SEO Settings**
   - Meta Title (0-60 chars)
   - Meta Description (0-160 chars)  
   - Keywords (comma-separated)
   - Real-time character counters

### Collections Page (`/admin/collections`)
- **List View**: All categories with product counts
- **Inline Form**: Create/Edit in same page
- **Fields**: Name, Slug, Meta Title, Meta Description
- **Actions**: Edit, Delete buttons

### Dashboard (`/admin`)
- **Stats Cards**:
  - Total Products
  - Total Collections
  - Average Product Price
  - Orders (placeholder)
- **Recent Products**: Last 5 products added
- **Quick Actions**: Shortcuts to common tasks

---

## 📡 API Endpoints Reference

### Products API

```bash
# List products (paginated, searchable)
GET /api/admin/products?search=luxe&page=1&limit=20

# Create product
POST /api/admin/products
{
  "name": "Silk Scarf",
  "slug": "silk-scarf",
  "description": "Premium silk scarf",
  "price": "199.99",
  "categoryId": "cat-123",
  "metaTitle": "Premium Silk Scarf | Novraux",
  "metaDescription": "Luxury silk scarf from Novraux",
  "keywords": "silk, scarf, luxury",
  "images": [
    {"url": "https://...", "alt": "Front view"}
  ]
}

# Get single product
GET /api/admin/products/:id

# Update product
PUT /api/admin/products/:id
{
  "name": "New Name",
  "price": "249.99",
  // ... other fields
}

# Delete product
DELETE /api/admin/products/:id

# Add images to product
POST /api/admin/products/:id/images
{
  "images": [
    {"url": "https://...", "alt": "Back view"}
  ]
}

# Reorder images (sets order & primary)
PUT /api/admin/products/:id/images
{
  "images": [
    {"id": "img-1", "order": 0},
    {"id": "img-2", "order": 1}
  ]
}
```

### Categories API

```bash
# List categories (searchable)
GET /api/admin/categories?search=luxury

# Create category
POST /api/admin/categories
{
  "name": "Premium Scarves",
  "slug": "premium-scarves",
  "metaTitle": "Premium Scarves Collection | Novraux",
  "metaDescription": "Browse our premium scarf collection"
}

# Get single category
GET /api/admin/categories/:id

# Update category
PUT /api/admin/categories/:id
{
  "name": "Luxury Scarves",
  "metaTitle": "New Title"
}

# Delete category
DELETE /api/admin/categories/:id
```

---

## 🖼️ Image Management Tips

### Recommended Specifications
- **Format**: PNG, JPG, WebP
- **Dimensions**: 1200x1400px (portrait) or 1400x1200px (landscape)
- **File Size**: < 500KB per image
- **Aspect Ratio**: 6:7 for product photos

### Best Practices
1. **First Image = Primary**: Auto-selected as main image
2. **Multiple Views**: Front, back, detail shots
3. **Consistent Styling**: Similar lighting, background
4. **Alt Text**: Descriptive (e.g., "front view of silk scarf")
5. **Order**: Most important images first

---

## 🔍 SEO Optimization Checklist

### Product Page SEO
- [ ] Meta Title (under 60 chars)
- [ ] Meta Description (120-160 chars)
- [ ] Keywords (3-5 relevant terms)
- [ ] Multiple product images (min 3)
- [ ] Descriptive product name
- [ ] Unique slug (no duplicates)
- [ ] Category assigned
- [ ] Alt text on all images

### Category Page SEO
- [ ] Category name matches intent
- [ ] Unique slug
- [ ] Meta title for category
- [ ] Meta description
- [ ] Products assigned to category

---

## ⚙️ Common Workflows

### Workflow 1: Add New Product

1. Go to **Products** → **"+ Add Product"**
2. Fill **Basic Information**:
   - Name: "Cashmere Sweater"
   - Slug: "cashmere-sweater"
   - Price: "349.99"
   - Category: Select from dropdown
3. **Upload Images**:
   - Drag 3-5 product images
   - Edit alt text for each
   - Images auto-ordered
4. **SEO Settings**:
   - Meta Title: "Premium Cashmere Sweater - Novraux"
   - Meta Description: "Luxury cashmere sweater crafted with care"
   - Keywords: "cashmere, sweater, luxury"
5. Click **Create Product**

### Workflow 2: Update Product Images

1. Go to **Products** → Click **Edit** on product
2. Scroll to **Product Images**
3. **Add Images**: Drag new images to uploader
4. **Reorder**: Use up/down arrows
5. **Remove**: Click X on unwanted images
6. Click **Update Product**

### Workflow 3: Manage Categories

1. Go to **Collections**
2. **Create New**:
   - Fill form at top
   - Name, Slug, SEO fields
   - Click "Create Collection"
3. **Edit**: Click Edit button on row
4. **Delete**: Click Delete (products stay, uncategorized)

---

## 🔐 Security Tips

- **Logout**: Always logout when leaving
- **Password**: Change default password in Profile
- **Session Timeout**: 24 hours inactivity = logout
- **Admin Only**: Never share login credentials
- **Secure Connection**: Use HTTPS in production

---

## 🐛 Troubleshooting

### Images Not Uploading
- Check file format (PNG, JPG, WebP)
- Ensure file size < 500KB
- Try a different browser
- Clear browser cache

### Product Not Saving
- Verify all required fields filled (Name, Slug, Price)
- Check slug uniqueness (no duplicates)
- Ensure category exists (if assigning)
- Check browser console for errors

### Can't Login
- Verify email spelling
- Reset password if forgotten
- Check database seed executed
- Clear browser cookies/cache

### Slow Performance
- Reduce image file sizes
- Check internet connection
- Disable browser extensions
- Try incognito mode

---

## 📱 Mobile Considerations

- **Optimized Layout**: Responsive on all devices
- **Touch-Friendly**: Large buttons, adequate spacing
- **Image Upload**: File picker works on mobile
- **Reordering**: Arrow buttons easy to tap
- **Tables**: Horizontal scroll on small screens

---

## 📚 Related Documentation

- **Full API Reference**: `/documentation/API_REFERENCE.md`
- **Architecture Guide**: `/documentation/ARCHITECTURE_GUIDE.md`
- **Deployment Guide**: `/documentation/SETUP_AND_DEPLOYMENT.md`
- **SEO Guide**: `/new_spec/seo-track.md`

---

## ✨ Pro Tips

1. **Bulk Update**: Create template product, duplicate, edit
2. **Category Strategy**: Group related products
3. **Image Optimization**: Use TinyPNG before upload
4. **SEO Keywords**: Research popular search terms
5. **Regular Backups**: Database exported weekly
6. **Metadata Preview**: Check Google Search Console
7. **Analytics**: Monitor product view trends

---

**Last Updated**: February 5, 2026  
**Version**: 2.0 (Phase 2 Complete)

For issues or feature requests, contact the development team.
