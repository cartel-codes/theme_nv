# Deploy Novraux to Vercel (Free)

## Free hosting stack

| Service | Free tier | Purpose |
|---------|-----------|---------|
| **Vercel** | Unlimited hobby projects | Host Next.js app |
| **Supabase** | 500MB PostgreSQL, 2 projects | Database (replace Docker) |
| **Cloudflare** | Free | Domain (novraux.com) |

## Steps

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. New project → choose region
3. Copy **Connection string** (URI) from Settings → Database

### 2. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add environment variables:
   - `DATABASE_URL` = your Supabase connection string (use "Transaction" pooler for serverless)
   - `NEXT_PUBLIC_SITE_URL` = `https://novraux.com` (or your Vercel URL)

4. Deploy

### 3. Run migrations on Supabase

After first deploy, run migrations against your Supabase DB:

```bash
DATABASE_URL="your-supabase-url" npm run db:migrate
DATABASE_URL="your-supabase-url" npm run db:seed
```

Or use Supabase SQL editor to run the migration files manually.

### 4. Connect domain (optional)

In Vercel: Project → Settings → Domains → Add `novraux.com`

Point Cloudflare DNS to Vercel (CNAME or A record as instructed).

---

**Note:** Vercel free tier has cold starts and 100GB bandwidth/month. Perfect for testing SEO and traffic.
