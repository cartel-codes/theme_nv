# 🚀 Quick Deployment Reference

## 5-Minute Deployment Checklist

### Before You Deploy

```bash
# 1. Run pre-deployment checks
npm run pre-deploy

# 2. Check database health
npm run db:health

# 3. Run type check (should always pass)
npm run type-check

# 4. Run tests
npm test

# 5. Check build
npm run build
```

### If All Checks Pass ✅

```bash
# 6. Commit changes
git add .
git commit -m "Production deployment: Pre-checks passed"

# 7. Push to production
git push origin main
```

### Verify Deployment (After Push)

1. Check Vercel dashboard for deployment status
2. Visit your production URL and test
3. Monitor logs for errors

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run pre-deploy` | Full pre-deployment validation |
| `npm run db:health` | Database health check |
| `npm run type-check` | TypeScript type checking |
| `npm test` | Run all tests |
| `npm run build` | Build for production |
| `npm run lint` | Check code style |
| `npm run dev` | Start local development |

---

## Deployment Flags

```bash
# Skip tests for faster validation (not recommended)
./scripts/pre-deploy.sh --skip-tests

# Check production database (requires PROD_DATABASE_URL)
./scripts/pre-deploy.sh --prod

# Verbose output for debugging
./scripts/db-health-check.sh --verbose
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| TypeScript errors | Run `npm run type-check` and fix errors |
| Test failures | Run `npm test` and review failures |
| Build fails | Check `npm run build` output for details |
| Database connection | Verify DATABASE_URL and DIRECT_URL in .env |
| Vercel deploy fails | Check Vercel logs and environment variables |

---

## Environment Variables

Make sure these are set in Vercel **or** your `.env` file:

```
DATABASE_URL=        # PostgreSQL connection string
DIRECT_URL=          # Direct database URL (no pooling)
NEXT_PUBLIC_SITE_URL= # Your domain (e.g., https://novraux.com)
R2_ACCESS_KEY_ID=    # Cloudflare R2
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
AI_API_KEY=          # For AI features
ADMIN_PASSWORD=      # Change from default!
```

---

## Rollback (If Issues Found)

```bash
# Find previous commit
git log --oneline | head -5

# Revert to previous version
git revert <commit-hash>
git push origin main

# Vercel will auto-redeploy
```

---

## Status Checks

**After deployment, verify:**

- ✅ Site loads without errors
- ✅ Admin panel `/admin` is accessible
- ✅ API endpoints respond
- ✅ No console errors in browser
- ✅ No deployment errors in Vercel logs

---

## Need Help?

1. **Check Vercel logs:** `vercel logs novraux`
2. **Review error details:** Check browser console & Vercel dashboard
3. **Deployment guide:** See `DEPLOYMENT_GUIDE.md`
4. **Database issues:** Run `npm run db:health`

---

**Last Updated:** 2026-02-05  
**Always run checks before deploying!** 🚀
