# Deployment Guide - Novraux E-Commerce

## Pre-Deployment Checklist

Before pushing to production, always run the comprehensive pre-deployment script:

### Quick Start

```bash
# Run full pre-deployment checks
./scripts/pre-deploy.sh

# Run with product database mode
./scripts/pre-deploy.sh --prod

# Skip tests for faster iteration
./scripts/pre-deploy.sh --skip-tests
```

### Database Health Check

Run the database health check script separately to validate schema and data integrity:

```bash
# Check development database
./scripts/db-health-check.sh

# Check production database (after setting PROD_DATABASE_URL)
./scripts/db-health-check.sh --prod

# Verbose output for debugging
./scripts/db-health-check.sh --verbose
```

## What the Scripts Check

### Pre-Deployment Script (`./scripts/pre-deploy.sh`)

| Step | Check | What it validates |
|------|-------|------------------|
| 1 | Environment Variables | DATABASE_URL, DIRECT_URL, R2 keys, Site URL |
| 2 | Prisma Schema | Schema syntax and model definitions |
| 3 | Database Connection | Can connect and query the database |
| 4 | TypeScript | No type errors or compilation issues |
| 5 | Unit Tests | All tests pass (can skip with `--skip-tests`) |
| 6 | Next.js Build | Production build completes successfully |
| 7 | Build Size | Checks bundle size is reasonable (<300MB) |

**Exit Code:**
- `0` = All checks passed, safe to deploy
- `1` = One or more checks failed, fix issues before deploying

### Database Health Check Script (`./scripts/db-health-check.sh`)

| Step | Check | Details |
|------|-------|---------|
| 1 | Schema Validation | Validates Prisma schema syntax |
| 2 | Table Status | Counts records in all tables |
| 3 | Foreign Keys | Verifies relationships are intact |
| 4 | Performance | Runs query performance tests |
| 5 | Data Integrity | Checks for duplicates and NULL violations |

## Step-by-Step Deployment

### 1. Local Development & Testing

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests locally
npm test

# Check types
npm run type-check
```

### 2. Pre-Deployment Validation

```bash
# Run the main pre-deployment checks
./scripts/pre-deploy.sh

# Output should end with:
# ✓ All checks passed! Ready for deployment.
```

### 3. Database Validation

```bash
# Ensure database schema and data are healthy
./scripts/db-health-check.sh

# Output should end with:
# ✓ Database health is good!
```

### 4. Git Commit

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Pre-deployment: All checks passed, ready for production"

# Show what you're about to push
git log --oneline -5
```

### 5. Push to Repository

```bash
# Push to main branch (Vercel will auto-deploy)
git push origin main

# Or explicitly push to production
git push origin main --force-with-lease
```

### 6. Verify Deployment

Once pushed, verify:

1. **GitHub Actions** - Check that CI/CD pipeline passes
2. **Vercel Dashboard** - Monitor deployment progress
3. **Production URL** - Test the live site
4. **Sentry/Error Tracking** - Check for errors

## Troubleshooting

### TypeScript Errors

If TypeScript check fails:

```bash
# See detailed errors
npm run type-check

# Common issues:
# - AdminUser model fields changed
# - Session types don't match
# - API response types don't match components
```

**Fix:**
```bash
# Find and fix all TS errors
npm run type-check -- --noEmit | less

# Use the exact error messages to locate issues
```

### Database Connection Failures

If database connection check fails:

```bash
# Check your database URL is valid
echo $DATABASE_URL

# Test connection directly via Prisma
npx prisma db execute --stdin < /dev/null

# View Prisma logs
DEBUG=prisma:* npm run build
```

**Common causes:**
- `DATABASE_URL` not set in `.env`
- Database server is down
- Connection limit exceeded
- VPN/network access issue

### Build Failures

If the build fails:

```bash
# Clean rebuild
rm -rf .next node_modules/.cache

# Try building again with verbose output
npm run build -- --debug

# Check for circular dependencies
npm ls
```

### Test Failures

If tests fail:

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- auth.test.ts

# Update snapshots if intentionally changed
npm test -- -u
```

## Environment Variables for Production

Set these in your Vercel dashboard or `.env.production`:

### Required for Production

```env
# Database
DATABASE_URL=postgresql://...production...
DIRECT_URL=postgresql://...production...

# R2 (Cloudflare)
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
R2_BUCKET_NAME=...
R2_ENDPOINT=...

# Site
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_R2_PUBLIC_URL=https://...

# Admin
ADMIN_USER=admin
ADMIN_PASSWORD=... (must be changed from default)

# APIs
AI_API_KEY=...
AI_MODEL=llama-3.3-70b-versatile
GOOGLE_AI_KEY=...
```

### Optional

```env
REDIS_URL=redis://...       # For caching
HUGGINGFACE_API_KEY=...     # For alternative AI
```

## Monitoring After Deployment

### Immediate Check (First 5 minutes)

```bash
# Check deployed site is running
curl https://yourdomain.com | head -20

# Check admin panel loads
curl -s https://yourdomain.com/admin | grep -i "novraux"

# Test API endpoint
curl https://yourdomain.com/api/admin/profile
# Should return 401 (Unauthorized) - means API is working
```

### Health Checks

```bash
# Vercel logs
vercel logs novraux-production

# Check database connection in production
# Log into Vercel dashboard and check Function logs

# Monitor error rates
# Check Sentry, LogRocket, or similar monitoring tool
```

### Performance Metrics

- **First Contentful Paint (FCP)** - Should be < 2 seconds
- **Largest Contentful Paint (LCP)** - Should be < 2.5 seconds
- **Cumulative Layout Shift (CLS)** - Should be < 0.1
- **Response Time** - Should be < 200ms for API endpoints

View in:
- Vercel Analytics dashboard
- Google PageSpeed Insights
- WebPageTest

## Rollback Plan

If issues are found in production:

```bash
# Find the previous working commit
git log --oneline | head -10

# Revert to previous version
git revert <commit-hash>
git push origin main

# Or reset to specific commit (use with caution)
git reset --hard <commit-hash>
git push origin main --force-with-lease
```

Vercel will automatically redeploy with the new code.

## Production Maintenance

### Regular Checks

Schedule these periodically:

```bash
# Weekly: Check database health
./scripts/db-health-check.sh --prod

# Monthly: Update dependencies
npm update
npm audit

# Quarterly: Review and optimize database
npx prisma client generate  # Keep types in sync
```

### Database Backups

Ensure automated backups are configured in your database provider (Supabase):

1. Login to Supabase dashboard
2. Go to Database > Backups
3. Verify daily backups are enabled
4. Test restore process quarterly

## Security Checklist

- [ ] All environment variables are set in Vercel
- [ ] No secrets committed to git (check with: `git log -p | grep -i password|key|secret`)
- [ ] Admin password changed from default
- [ ] CORS properly configured
- [ ] Rate limiting enabled on API routes
- [ ] SQL injection protection (Prisma handles this)
- [ ] CSRF tokens on forms
- [ ] SSL/HTTPS enforced
- [ ] Admin panel requires authentication
- [ ] Sensitive routes have proper middleware checks

## Key Files

- `.env` / `.env.production` - Environment variables
- `prisma/schema.prisma` - Database schema
- `scripts/pre-deploy.sh` - Pre-deployment validation
- `scripts/db-health-check.sh` - Database health check
- `next.config.js` - Next.js configuration
- `vercel.json` - Vercel deployment config (if exists)

## Getting Help

If deployment fails:

1. **Check error messages** - Read the full error output
2. **Review logs** - `vercel logs` command
3. **Check environment variables** - Verify all are set in Vercel
4. **Test locally** - Reproduce issue locally first
5. **Review recent changes** - What changed since last successful deploy?

## Contact & Support

- **Issues** - GitHub Issues in repository
- **Deployment** - Vercel Dashboard (dashboard.vercel.com)
- **Database** - Supabase Dashboard (supabase.com)
- **Monitoring** - Check your error tracking service

---

**Last Updated:** 2026-02-05  
**Next Review:** 2026-03-05
