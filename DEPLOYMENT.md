# Deploy Novraux to Vercel (Free)

To deploy this project, you need **both** Supabase and Prisma. Here is why:

1.  **Supabase** is your **Database Host**. It provides the actual PostgreSQL database where your data (products, categories, etc.) will be stored in the cloud.
2.  **Prisma** is your **ORM (Object-Relational Mapper)**. It is the tool inside your code that communicates with Supabase. You use it to define your data models (in `schema.prisma`) and run queries.

## Free Hosting Stack

| Service | Free tier | Purpose |
|---------|-----------|---------|
| **Vercel** | Unlimited hobby projects | Hosts the Next.js application |
| **Supabase** | 500MB PostgreSQL | Hosts the database (replaces local Docker) |
| **Prisma** | Open Source | Manages the database connection and queries |

## Steps to Deploy

### 1. Set Up Supabase
1. Create a new project on [Supabase.com](https://supabase.com).
2. Go to **Project Settings** → **Database**.
3. Under **Connection string**, select the **URI** tab.
4. There is a toggle labeled **"Use connection pooling"**. This is how you switch between the two strings:

#### **A. Transaction Pooler (Port 6543)**
1.  Turn the **"Use connection pooling"** toggle **ON**.
2.  Select **Mode: Transaction** (important!).
3.  Copy the URL. It should end with `:6543/postgres?pgbouncer=true...`.
4.  **Use for:** `DATABASE_URL` in Vercel.

#### **B. Direct Connection (Port 5432)**
1.  Turn the **"Use connection pooling"** toggle **OFF**.
2.  Copy the URL. It should end with `:5432/postgres`.
3.  **Use for:** `DIRECT_URL` in Vercel.

> [!IMPORTANT]
> Always replace `[YOUR-PASSWORD]` (or `[PWD]`) in those strings with the password you set when creating the Supabase project.

### 2. Deploy to Vercel
1. Push your code to a GitHub repository.
2. Open [Vercel](https://vercel.com) and import your repository.
3. In the **Environment Variables** section, add the following:
   - `DATABASE_URL`: The Transaction Pooler string from Supabase.
   - `DIRECT_URL`: The Direct Connection string from Supabase.
   - `NEXT_PUBLIC_SITE_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`).

### 3. Initialize the Production Database
Once Vercel starts deploying, it might fail initially because the database is empty. You need to push your schema and seed the data:

```bash
# Push your local schema to Supabase
npx prisma db push

# (Optional) Seed the database with initial products
npm run db:seed
```

### 4. Continuous Deployment
Every time you push code to GitHub, Vercel will automatically redeploy your app. If you change your `schema.prisma` file, you should run `npx prisma db push` again to update the Supabase database structure.

