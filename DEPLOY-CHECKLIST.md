# Pre-Deployment Checklist & Tools

## 🚀 Quick Deploy

Run the pre-deployment script before every production deploy:

```bash
npm run pre-deploy
```

This will automatically check:
- ✅ Environment variables
- ✅ TypeScript types
- ✅ ESLint rules  
- ✅ Production build
- ✅ Database schema
- ✅ Security vulnerabilities
- ✅ Bundle size

---

## 📋 Manual Deployment Steps

### 1. **Local Validation**
```bash
# Run the pre-deployment script
npm run pre-deploy

# If any errors, fix them first
```

### 2. **Database Preparation**
```bash
# Push schema to Supabase (production)
npx prisma db push

# Seed production database (first time only)
npm run db:seed
```

### 3. **Git Commit & Push**
```bash
git add .
git commit -m "Product page redesign - deploy"
git push origin main
```

### 4. **Deploy to Vercel**

**Option A: Automatic (recommended)**
- Vercel auto-deploys when you push to GitHub

**Option B: Manual**
```bash
npm i -g vercel    # Install Vercel CLI
vercel login       # Login once
vercel --prod      # Deploy to production
```

---

## 🛠️ Recommended Tools

### **1. Vercel CLI** (Deployment)
```bash
npm i -g vercel
```
- Preview deployments
- Environment variable management
- Logs and analytics

### **2. Prisma Studio** (Database GUI)
```bash
npm run db:studio
```
- Visual database editor
- Browse products, users, carts
- Quick data management

### **3. Lighthouse** (Performance Audit)
- Built into Chrome DevTools (F12 → Lighthouse)
- Checks: Performance, SEO, Accessibility
- Aim for 90+ scores

### **4. Bundlephobia** (Bundle Analysis)
Visit: https://bundlephobia.com
- Check package sizes before installing
- Optimize bundle weight

### **5. Sentry** (Error Tracking - Optional)
```bash
npm install @sentry/nextjs
```
- Production error monitoring
- Performance tracking
- Free tier available

### **6. Plausible/Umami** (Analytics - Privacy-friendly)
- Better than Google Analytics
- GDPR compliant
- No cookie banners needed

---

## ⚙️ Environment Variables for Vercel

Add these in **Vercel Dashboard → Settings → Environment Variables**:

```bash
# Database (from Supabase)
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...supabase.co:5432/postgres

# Site URL (your Vercel deployment)
NEXT_PUBLIC_SITE_URL=https://novraux.vercel.app

# Admin Credentials
ADMIN_USER=admin
ADMIN_PASSWORD=novraux_luxury

# Optional: Redis (if using caching)
REDIS_URL=redis://...
```

---

## 🔍 Post-Deployment Checks

After deploying, verify:

1. **Homepage loads** → Visit your Vercel URL
2. **Product pages work** → Click on a product
3. **Images load** → Check product gallery
4. **Cart functions** → Try adding to cart
5. **Auth works** → Test login/signup
6. **Admin panel** → Login at `/admin`
7. **Mobile responsive** → Test on phone

---

## 🐛 Common Issues & Fixes

### Build Fails in Vercel
```bash
# Test locally first
npm run build

# Check build logs in Vercel dashboard
# Fix TypeScript/ESLint errors
```

### Database Connection Error
```bash
# Verify connection strings
# Check Supabase project is active
# Ensure DATABASE_URL has ?pgbouncer=true
```

### Images Not Loading
```bash
# Add domain to next.config.js
images: {
  domains: ['your-image-domain.com']
}
```

### Environment Variables Not Working
```bash
# Redeploy after adding env vars
# Check variable names match exactly
# Restart Vercel deployment
```

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard
- **Analytics**: Page views, performance
- **Logs**: Real-time server logs  
- **Deployments**: Rollback if needed

### Database Monitoring (Supabase)
- **Database Health**: CPU, Memory usage
- **Table Editor**: Direct data access
- **Logs**: Query performance

---

## 🎯 Performance Optimization Tips

1. **Image Optimization** - Always use Next.js `<Image>` component ✅ (Done!)
2. **Bundle Size** - Keep under 200KB for First Load JS
3. **Caching** - Add Redis for session/cart caching
4. **CDN** - Vercel auto-handles this
5. **Compression** - Vercel auto-enables Gzip/Brotli

---

## 🔐 Security Best Practices

- ✅ Environment variables in Vercel (not in code)
- ✅ HTTPS only (Vercel auto-enables)
- ✅ API routes protected with authentication
- ✅ SQL injection prevention (Prisma ORM)
- 🔜 Rate limiting (add middleware)
- 🔜 CORS configuration for API routes

---

## 📞 Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Supabase Docs**: https://supabase.com/docs

---

**Happy Deploying! 🚀**
