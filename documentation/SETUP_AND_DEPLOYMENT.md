# Admin Authentication Setup & Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Production Deployment](#production-deployment)
3. [Supabase-Specific Configuration](#supabase-specific-configuration)
4. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- PostgreSQL database (local or remote)
- Git

### Step 1: Install Dependencies

```bash
cd /path/to/novraux
npm install
```

### Step 2: Configure Environment Variables

Update your `.env` file with database credentials:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/novraux"
DIRECT_URL="postgresql://postgres:password@localhost:5432/novraux"

# Redis (optional - for caching)
REDIS_URL="redis://localhost:6379"

# Site URL (used for SEO, sitemap, canonical URLs)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Admin Credentials (Optional - for legacy/fallback support)
ADMIN_USER=admin
ADMIN_PASSWORD=novraux_luxury
```

### Step 3: Setup Database

```bash
# Create and apply migrations
npm run db:migrate

# Seed database with sample data and default admin user
npm run db:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/admin/login` in your browser.

**Default Credentials:**
- Email: `admin@novraux.com`
- Password: `admin123!`

⚠️ Change these immediately!

### Step 5: (Optional) Explore Database with Prisma Studio

```bash
npm run db:studio
```

Opens an interactive UI to view and manage database records.

---

## Production Deployment

### Deployment Checklist

- [ ] Generate new admin credentials (see below)
- [ ] Set up PostgreSQL database on hosting provider
- [ ] Configure environment variables on hosting platform
- [ ] Review security settings
- [ ] Test login/logout functionality
- [ ] Set up monitoring/logging
- [ ] Configure SSL/HTTPS

### Deployment Steps

#### 1. Generate Secure Admin Credentials

Before deploying, create a strong admin account. Use this script locally:

```bash
# Run this locally to generate a secure password hash
node -e "
const bcrypt = require('bcryptjs');
const password = process.argv[1];
bcrypt.hash(password, 10, (err, hash) => {
  if (err) console.error(err);
  console.log('Hash:', hash);
});
" "YourStrongPassword123!"
```

Or use an online bcrypt generator: https://bcrypt-generator.com/

#### 2. Set Up Database on Production

For **Supabase** (recommended):
1. Create new project on supabase.com
2. Copy connection strings to deployment environment
3. Follow [Supabase-Specific Configuration](#supabase-specific-configuration)

For **Other Hosting** (AWS RDS, DigitalOcean, etc.):
1. Create PostgreSQL database
2. Get connection string
3. Set `DATABASE_URL` and `DIRECT_URL` environment variables

#### 3. Deploy Using Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

During setup:
1. Select or create a project
2. Vercel will detect Next.js automatically
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SITE_URL`

#### 4. Run Migrations on Production

After deployment:

```bash
# Using Vercel CLI
vercel env ls          # List environment variables
vercel env add ...     # Add new variables if needed

# Manually via Vercel dashboard
# Then run migrations via deployment hook or terminal
npm run db:migrate
npm run db:seed
```

Or add a build script in `package.json`:

```json
{
  "scripts": {
    "build": "npm run db:migrate && next build"
  }
}
```

#### 5. Update Environment Variables on Hosting Platform

Navigate to your hosting dashboard and set:

```
DATABASE_URL = postgresql://...
DIRECT_URL = postgresql://...
NEXT_PUBLIC_SITE_URL = https://your-domain.com
NODE_ENV = production
```

---

## Supabase-Specific Configuration

### Why Supabase?

Supabase provides:
- Managed PostgreSQL with automatic backups
- Real-time capabilities for future features
- Built-in authentication (if expanding later)
- Generous free tier for startups

### Step-by-Step Supabase Setup

#### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Enter project name and password
4. Wait for project to be created (~5 minutes)

#### 2. Get Connection Strings

In your Supabase project dashboard:

1. Navigate to **Settings** → **Database**
2. Under "Connection string", select **Node.js**
3. Copy both URLs:
   - **Pooler** (for `DATABASE_URL`) - for Prisma with connection pooling
   - **Direct** (for `DIRECT_URL`) - for migrations and introspection

Example:
```
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-1-region.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:password@aws-1-region.supabase.co:5432/postgres"
```

#### 3. Update .env

```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-1-region.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:password@aws-1-region.supabase.co:5432/postgres"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

#### 4. Initialize Database

```bash
npm run db:migrate
npm run db:seed
```

#### 5. Verify in Supabase

1. In Supabase dashboard, go to **SQL Editor**
2. Run query:
   ```sql
   SELECT * FROM "AdminUser";
   ```
3. You should see the default admin user

#### 6. Backup Strategy

Supabase automatically backs up daily. For manual backups:

1. In Supabase dashboard → **Backups** (Pro plan required)
2. Or use `pg_dump` to export:
   ```bash
   pg_dump "postgresql://..." > backup.sql
   ```

---

## Security Hardening for Production

### 1. Update Default Admin Credentials

**DO NOT USE DEFAULT CREDENTIALS IN PRODUCTION!**

```bash
# Connect to Supabase via Prisma Studio
npm run db:studio
```

1. Find the default admin user (admin@novraux.com)
2. Delete it or change password
3. Create new admin account with strong credentials

### 2. Enable HTTPS

Vercel/hosting platforms handle this automatically. Ensure:
- `NODE_ENV=production` is set
- SSL certificates are valid
- Redirect HTTP → HTTPS

### 3. Configure CORS

If your admin panel is on a different domain:

```typescript
// app/api/auth/login/route.ts - add CORS headers
const response = NextResponse.json(...);
response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL);
return response;
```

### 4. Rate Limiting

Prevent brute-force attacks (add to API routes):

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
});

export async function POST(req: NextRequest) {
  const { success } = await ratelimit.limit('auth-' + req.ip);
  if (!success) return new NextResponse('Too many requests', { status: 429 });
  // ... rest of auth logic
}
```

### 5. Audit Logging

Add logging for security events:

```typescript
// lib/audit.ts
export async function logAuthEvent(event: {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT';
  userId?: string;
  email?: string;
  ip?: string;
  timestamp: Date;
}) {
  // Log to database, external service (Datadog, Sentry), or file
  console.log('[AUDIT]', event);
}
```

### 6. Environment Variable Security

✅ **DO:**
- Store sensitive values in `.env.local` (not in version control)
- Use different credentials for dev/staging/production
- Rotate passwords periodically
- Use secrets manager (GitHub Secrets, Vercel Secrets, etc.)

❌ **DON'T:**
- Commit `.env` files to Git
- Share credentials via email
- Use same credentials across environments
- Log sensitive data

---

## Troubleshooting Production Deployment

### Issue: "Cannot connect to database"

**Solutions:**
1. Verify connection strings in environment variables
2. Check firewall/IP whitelist on database provider
3. Test connection locally first with same `.env`
4. Verify PostgreSQL service is running

### Issue: "Prisma migrations not applied"

**Solution:**
```bash
# Via Vercel dashboard, run in terminal:
npm run db:migrate
```

Or add to `package.json` build script:
```json
"build": "prisma migrate deploy && next build"
```

### Issue: "Session cookie not working"

**Causes & Solutions:**
1. **HTTPS not enabled**: Production requires HTTPS. Check hosting platform settings.
2. **SameSite cookie issue**: Ensure hosting uses same domain for API calls.
3. **Cookie domain mismatch**: For subdomains, adjust in `lib/session.ts`:
   ```typescript
   cookieStore.set('admin_session', token, {
     domain: '.your-domain.com', // Allow subdomains
     // ... other options
   });
   ```

### Issue: "Default admin user not created after seed"

**Solutions:**
1. Check if user already exists (avoid duplicates)
2. Run seed manually:
   ```bash
   npm run db:seed
   ```
3. Verify AdminUser table exists:
   ```bash
   npm run db:studio
   ```

### Issue: "bcryptjs module not found"

**Solution:**
```bash
npm install
npm run postinstall
```

---

## Monitoring & Maintenance

### Regular Tasks

**Weekly:**
- Check admin login logs
- Monitor database size
- Review error logs

**Monthly:**
- Update dependencies: `npm update`
- Review and rotate admin credentials if needed
- Backup database manually

**Quarterly:**
- Security audit of auth system
- Review and update documentation
- Test disaster recovery procedures

### Useful Commands

```bash
# Check database status
npm run db:studio

# View logs (Vercel)
vercel logs

# View environment variables
vercel env ls

# Run migrations
npm run db:migrate

# Reset database (⚠️ DESTRUCTIVE - dev only!)
npm run db:reset
```

---

## Next Steps

1. ✅ Complete production deployment
2. 📚 Review [ADMIN_AUTH_GUIDE.md](./ADMIN_AUTH_GUIDE.md) for usage
3. 🔐 Implement additional security features (2FA, audit logging)
4. 📊 Set up monitoring and alerting
5. 🔄 Plan regular backup and disaster recovery tests

---

**Last Updated**: February 4, 2026  
**Version**: 1.0.0
