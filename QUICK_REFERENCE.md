# Admin Authentication - Quick Reference Card

## 🚀 Getting Started (5 minutes)

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Login at `http://localhost:3000/admin/login`
- Email: `admin@novraux.com`
- Password: `admin123!`

---

## 📍 Key Locations

| What | Where |
|------|-------|
| Auth APIs | `/app/api/auth/` |
| Login Page | `/app/admin/login/page.tsx` |
| Signup Page | `/app/admin/signup/page.tsx` |
| Auth Utilities | `/lib/auth.ts` |
| Session Management | `/lib/session.ts` |
| Route Protection | `/middleware.ts` |
| Database Schema | `/prisma/schema.prisma` |
| Documentation | `/documentation/` |

---

## 🔐 Authentication Flow

```
User Input (Login Form)
    ↓
POST /api/auth/login
    ↓
Validate Credentials
    ↓
Create Session Cookie
    ↓
Redirect to /admin
```

---

## 🛡️ Protected Routes

All `/admin/*` routes except:
- `/admin/login` (allows GET, POST for authentication)
- `/admin/signup` (allows GET, POST for account creation)

Redirect logic: Missing/invalid session → `/admin/login`

---

## 📱 API Endpoints

### Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Signup
```bash
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### Logout
```bash
POST /api/auth/logout
(uses session cookie)
```

---

## 💾 Database

### AdminUser Table
```sql
CREATE TABLE "AdminUser" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL (hashed),
  name TEXT,
  role TEXT DEFAULT 'admin',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Seed Default User
```bash
npm run db:seed
```

---

## 📚 Using Session in Code

### Server Component
```typescript
import { getSession } from '@/lib/session';

const session = await getSession();
if (!session) redirect('/admin/login');
```

### API Route
```typescript
import { getSession } from '@/lib/session';

const session = await getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Client Component
```typescript
// Sessions NOT accessible from client-side
// Use API routes to check authentication status
```

---

## 🔑 Password Management

### Hash Password
```typescript
import { hashPassword } from '@/lib/auth';
const hash = await hashPassword('plainTextPassword');
```

### Verify Password
```typescript
import { comparePassword } from '@/lib/auth';
const isValid = await comparePassword('plainText', 'hash');
```

### Update Password
```typescript
import { updateAdminUserPassword } from '@/lib/auth';
await updateAdminUserPassword(userId, 'newPassword123');
```

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Can't login | Check if AdminUser exists in DB (`npm run db:studio`) |
| Infinite redirect to login | Clear cookies, restart server |
| bcryptjs not found | `npm install` |
| Database connection error | Verify DATABASE_URL in `.env` |
| Middleware not protecting | Restart dev server |

---

## 🔧 Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:studio       # Open database UI

# Database
npm run db:migrate      # Apply migrations
npm run db:seed         # Seed default data
npm run db:reset        # Reset database (⚠️ dev only!)

# Building
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
```

---

## 📋 Environment Variables

```env
# REQUIRED
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# OPTIONAL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_USER=admin
ADMIN_PASSWORD=novraux_luxury
```

---

## 🔒 Security Reminders

✅ DO:
- Use HTTPS in production
- Store `.env` in `.gitignore`
- Use strong passwords (8+ chars)
- Hash passwords before storage
- Validate input on server

❌ DON'T:
- Expose credentials in code
- Store passwords in plain text
- Use same credentials everywhere
- Trust client-side validation alone
- Log sensitive data

---

## 📖 Full Documentation

- **Setup & Deployment**: `/documentation/SETUP_AND_DEPLOYMENT.md`
- **Auth Guide**: `/documentation/ADMIN_AUTH_GUIDE.md`
- **API Reference**: `/documentation/API_REFERENCE.md`
- **Implementation Summary**: `/IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Deploy to Production

1. Update default admin password
2. Configure DATABASE_URL and DIRECT_URL
3. Set NEXT_PUBLIC_SITE_URL to your domain
4. Run `npm run db:migrate`
5. Run `npm run db:seed`
6. Deploy to Vercel/hosting platform
7. Test login in production

---

## 📞 Quick Links

- **Prisma Schema**: `/prisma/schema.prisma`
- **Middleware**: `/middleware.ts`
- **Auth Utilities**: `/lib/auth.ts`
- **Session Utils**: `/lib/session.ts`
- **Login API**: `/app/api/auth/login/route.ts`
- **Admin Layout**: `/app/admin/layout.tsx`

---

**Last Updated**: February 4, 2026  
**Quick Reference Version**: 1.0.0
