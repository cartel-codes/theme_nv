# Printify Integration - Quick Testing Guide

## 🚀 Getting Started

### Prerequisites
- Dev server running: `npm run dev` (should be on `http://localhost:3001`)
- Admin login credentials ready
- Printify account with API token configured

### Step 1: Verify Server is Running
```bash
curl http://localhost:3001/
# Should return HTML (200 OK)
```

---

## 📋 Test Scenarios

### Scenario 1: View Print Providers Page
1. Go to: `http://localhost:3001/admin/print-providers`
2. You should see:
   - Printful card (with status)
   - Printify card (marked as "AI CREATOR")
   - Settings card
3. Check console for any errors

**Expected Outcome**: Page loads without errors

---

### Scenario 2: Sync Printify Catalog
1. Click on "Printify" card, OR
2. Go to: `http://localhost:3001/admin/print-providers/printify`
3. Click "Sync Catalog" button
4. Wait for sync to complete

**Expected Console Output**:
```
Starting Printify Sync...
Provider Found. Shop ID: [shop-id]
Syncing from Shop ID: [shop-id]
Found [N] products.
[Product 1] ✓ Synced
[Product 2] ✓ Synced
...
✓ Sync completed. Synced: [N] products
```

**What to Check**:
- Check browser DevTools → Console for errors
- Check Network tab for API calls to Printify
- Verify database has new `PrintProduct` records

---

### Scenario 3: Create Custom Product
1. Go to: `http://localhost:3001/admin/print-providers/create`
2. Select a blueprint (e.g., "T-Shirt")
3. Select a print provider (e.g., "Monster Digital")
4. Wait for variants to load
5. Enter product title (e.g., "My Custom Tee")
6. Choose upload or AI generation:
   - **Upload**: Paste image URL or upload Base64
   - **AI**: Enter prompt like "cyberpunk cat in neon glasses, vector art"
7. Click "Create & Publish"

**Expected Console Output**:
```
Uploading image to Printify...
Upload response: { id: "...", ... }
Creating product on Printify...
Creating product with payload: { title: "...", ... }
Create product response: { id: "...", ... }
Publishing product...
Publish product response: { id: "...", visible: true }
Syncing locally so it appears in our DB immediately
✓ Product created and synced!
```

**What to Check**:
- Image uploads successfully (check upload response)
- Product creation doesn't error
- Check Printify dashboard for new product
- Verify product appears in `/admin/print-providers/printify` list

---

### Scenario 4: Import Synced Product
1. Go to: `http://localhost:3001/admin/print-providers/printify`
2. Click "Import" on any product
3. Customize details:
   - Change product name if desired
   - Set pricing
   - Select which variants to include
4. Click "Publish Product"

**Expected Outcome**:
- Product appears in `/admin/products` list
- Product has all variants from Printify
- SEO metadata is auto-generated
- Product is searchable in storefront

---

## 🔍 Debugging Tips

### Monitor Logs
```bash
# Watch the dev server logs in real-time
tail -f dev.log
```

### Check Database
```bash
# Open Prisma Studio
npm run db:studio
```
Then inspect tables:
- `PrintProvider` - Should have Printify entry
- `PrintProduct` - Synced products
- `Product` - Published products
- `ProductVariant` - Variants for published products

### API Debugging
Open browser DevTools (F12) and check:
1. **Console Tab**: Look for any errors or warnings
2. **Network Tab**: 
   - Request to `/api/admin/print-providers/sync`
   - Request to `/api/admin/print-providers/create`
   - Request to `/api/admin/print-providers/products/publish`
3. **Application Tab**: Check cookies/session validity

### Manual API Test
```bash
# Test sync endpoint
curl -X POST http://localhost:3001/api/admin/print-providers/sync \
  -H "Content-Type: application/json" \
  -d '{"provider":"printify"}'

# Test product creation
curl -X POST http://localhost:3001/api/admin/print-providers/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product",
    "blueprintId": 3,
    "providerId": 29,
    "variantIds": [1, 2],
    "imageUrl": "https://placehold.co/600x600.png"
  }'
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Printify not configured or Shop ID missing"
**Solution**: 
1. Ensure Printify API key is valid in database
2. Run sync first to populate Shop ID
3. Check `.env.local` has `ENCRYPTION_KEY` set

### Issue: "Failed to upload image"
**Solution**:
1. Verify image URL is publicly accessible
2. Try using a known working URL like `https://placehold.co/600x600.png`
3. Check console for actual Printify API error response
4. Ensure image format is supported (PNG, JPG, GIF)

### Issue: "No valid variant IDs provided"
**Solution**:
1. Ensure variant selection worked properly
2. Check that variants are loading from blueprint/provider combo
3. Verify variant IDs are numeric

### Issue: "Plugin not found" or 404 errors
**Solution**:
1. Restart dev server: `Ctrl+C` then `npm run dev`
2. Clear `.next` folder: `rm -rf .next`
3. Ensure all files are properly saved

---

## ✅ Success Checklist

- [ ] Dev server starts without errors
- [ ] Can access `/admin/print-providers`
- [ ] Print providers page loads and displays Printify option
- [ ] Sync button works and fetches products from Printify
- [ ] Create page loads with blueprint selection
- [ ] Image upload/AI generation works
- [ ] Product creation succeeds (check Printify dashboard)
- [ ] Published product appears in `/admin/products`
- [ ] Product variants are properly created
- [ ] Product is visible in storefront

---

## 📞 Need Help?

If you encounter errors:
1. Check the console for the exact error message
2. Check the server logs (dev.log)
3. Verify API credentials are correct
4. Look for detailed error responses in Network tab
5. Review the [PRINTIFY_FIXES_SUMMARY.md](./PRINTIFY_FIXES_SUMMARY.md) for context

The updated code now includes extensive logging, so most issues should be visible in the console.
