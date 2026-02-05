# E-commerce Website - Local Development

Modern, SEO-optimized e-commerce platform built with Next.js 14, TypeScript, and PostgreSQL.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Docker)
- **ORM**: Prisma
- **Cache**: Redis (Docker, optional)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Quick Start

```bash
# Clone repository
git clone <your-repo-url>
cd ecommerce-project

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start database (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── products/          # Product pages
│   └── cart/              # Cart page
├── components/            # React components
├── lib/                   # Utilities & helpers
├── prisma/               # Database schema & migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data script
├── types/                # TypeScript types
├── public/               # Static assets
└── docker-compose.yml    # Docker services
```

## Available Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio (DB GUI)
npm run db:reset         # Reset database (destructive)

docker-compose up -d     # Start Docker services
docker-compose down      # Stop Docker services
docker-compose logs      # View logs
```

## Admin Panel

Access the secure admin panel at `http://localhost:3000/admin`

**Default Credentials** (change in production):
- Email: `admin@novraux.com`
- Password: `admin123!`

⚠️ **Important**: Change default password immediately in production!

### Admin Features
- Secure email/password authentication
- Protected admin routes
- Session-based authorization
- Admin dashboard with user profile

### Documentation
- **Quick Start**: See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Complete Guide**: See [documentation/ADMIN_AUTH_GUIDE.md](./documentation/ADMIN_AUTH_GUIDE.md)
- **Setup & Deployment**: See [documentation/SETUP_AND_DEPLOYMENT.md](./documentation/SETUP_AND_DEPLOYMENT.md)
- **API Reference**: See [documentation/API_REFERENCE.md](./documentation/API_REFERENCE.md)

Full documentation available in `/documentation` folder.

## Environment Variables

Create `.env.local` with:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Database Management

### View database in Prisma Studio
```bash
npm run db:studio
```

### Create new migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset database (Warning: deletes all data)
```bash
npm run db:reset
```

## Docker Services

- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

Stop services:
```bash
docker-compose down
```

Remove volumes (deletes all data):
```bash
docker-compose down -v
```

## API Endpoints

- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get single product
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart` - Update cart item
- `DELETE /api/cart` - Remove from cart

## SEO Features

- Server-side rendering (SSR) for all product pages
- Dynamic meta tags and Open Graph
- JSON-LD structured data
- Automatic sitemap generation
- Optimized images (Next.js Image)

## Development Phases

### Phase 1 (Current)
- ✅ Product catalog with SSR
- ✅ Shopping cart (no checkout)
- ✅ SEO optimization
- ✅ Local Docker setup

### Phase 2 (In Progress)
- ✅ Admin authentication (login/signup/logout)
- ✅ Secure admin dashboard
- ✅ DB-backed sessions & cookies
- ✅ Admin profile (name, email, password)
- User accounts & order history
- Wishlist
- Product management via admin panel

### Phase 3 (Later)
- PayPal Enterprise integration
- Order management
- Inventory tracking
- Advanced admin features

## Troubleshooting

**Database connection error:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart
```

**Port already in use:**
```bash
# Change ports in docker-compose.yml
# Or stop conflicting services
```

**Migration issues:**
```bash
# Reset and re-run migrations
npm run db:reset
npm run db:migrate
npm run db:seed
```

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

## License

MIT
