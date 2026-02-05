# Novraux Admin Documentation

Welcome to the Novraux Admin Documentation! This folder contains comprehensive guides for the admin authentication system and related features.

## 📚 Quick Navigation

### Essential Guides

1. **[ADMIN_AUTH_GUIDE.md](./ADMIN_AUTH_GUIDE.md)** - Complete authentication system overview
   - Features and architecture
   - Quick start guide
   - Managing admin users
   - Security considerations
   - Troubleshooting

2. **[SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md)** - Setup and deployment instructions
   - Local development setup
   - Production deployment guide
   - Supabase-specific configuration
   - Security hardening
   - Troubleshooting production issues

3. **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API endpoint documentation
   - Authentication endpoints (login, signup, logout)
   - Session management
   - Protected routes
   - Error handling
   - Testing examples
   - Best practices

4. **[CORE_FEATURES.md](./CORE_FEATURES.md)** - Original storefront features
   - Products catalog and detail pages
   - Shopping cart (session-based)
   - Blog (Journal)
   - SEO (sitemap, meta tags, JSON-LD)

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:migrate
npm run db:seed

# 3. Start development server
npm run dev

# 4. Access admin panel
# Visit http://localhost:3000/admin/login
# Default credentials: admin@novraux.com / admin123!
```

⚠️ **Important**: Change default password immediately in production!

## 🎯 By Use Case

### I want to...

- **Deploy to production** → See [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md#production-deployment)
- **Create a new admin account** → See [ADMIN_AUTH_GUIDE.md](./ADMIN_AUTH_GUIDE.md#managing-admin-users)
- **Reset a forgotten password** → See [ADMIN_AUTH_GUIDE.md](./ADMIN_AUTH_GUIDE.md#troubleshooting)
- **Understand the API** → See [API_REFERENCE.md](./API_REFERENCE.md)
- **Configure Supabase** → See [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md#supabase-specific-configuration)
- **Troubleshoot login issues** → See [ADMIN_AUTH_GUIDE.md](./ADMIN_AUTH_GUIDE.md#troubleshooting)
- **Integrate auth into custom endpoints** → See [API_REFERENCE.md](./API_REFERENCE.md#protecting-routes)

## 🔐 Security Checklist

Before going live, ensure you've completed:

- [ ] Generated new admin credentials (not using defaults)
- [ ] Set up PostgreSQL database
- [ ] Enabled HTTPS/SSL
- [ ] Configured environment variables securely
- [ ] Ran database migrations
- [ ] Seeded database with admin user
- [ ] Tested login/logout flow
- [ ] Reviewed security settings
- [ ] Set up monitoring/logging
- [ ] Configured rate limiting

See [Security Hardening](./SETUP_AND_DEPLOYMENT.md#security-hardening-for-production) for details.

## 📋 File Structure

```
documentation/
├── README.md                      # This file
├── ADMIN_AUTH_GUIDE.md           # Main authentication guide
├── SETUP_AND_DEPLOYMENT.md       # Setup and deployment guide
└── API_REFERENCE.md              # API documentation
```

## 🛠️ Development Workflows

### Local Development

```bash
npm run dev
```

Visit http://localhost:3000/admin/login

### Database Management

```bash
# View and edit database
npm run db:studio

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed

# Reset database (dev only!)
npm run db:reset
```

### Testing APIs

```bash
# Using cURL
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@novraux.com","password":"admin123!"}'

# Using REST Client (VS Code extension)
# See API_REFERENCE.md for examples
```

## 🔍 Key Features

### Authentication System
- ✅ Email/password based login
- ✅ Secure password hashing (bcryptjs)
- ✅ Session management with cookies
- ✅ Protected routes via middleware
- ✅ Logout functionality

### Admin Panel
- ✅ Clean, intuitive dashboard
- ✅ User profile display in sidebar
- ✅ Quick action buttons
- ✅ Statistics cards
- ✅ Navigation to product/collection management

### Database
- ✅ PostgreSQL with Prisma ORM
- ✅ AdminUser model for auth
- ✅ Automatic migrations
- ✅ Seed data included

## 📖 Documentation Standards

All documentation uses:
- **Markdown** formatting
- **Code examples** in TypeScript/JavaScript
- **Clear headings** for easy navigation
- **Practical use cases** for each feature
- **Troubleshooting sections** for common issues

## 🆘 Getting Help

### Resources

1. **Prisma Documentation**: https://www.prisma.io/docs/
2. **Next.js Documentation**: https://nextjs.org/docs/
3. **Bcryptjs Documentation**: https://github.com/dcodeIO/bcrypt.js
4. **Supabase Documentation**: https://supabase.com/docs/

### Common Issues

See the **Troubleshooting** sections in:
- [ADMIN_AUTH_GUIDE.md](./ADMIN_AUTH_GUIDE.md#troubleshooting)
- [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md#troubleshooting-production-deployment)

### Reporting Issues

If you find bugs or documentation issues:
1. Check the troubleshooting guides first
2. Review the code in `lib/auth.ts`, `lib/session.ts`, and `middleware.ts`
3. Check GitHub issues or project management tool

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 4, 2026 | Initial release with login/signup/logout |

## 🎓 Learning Path

### For New Developers

1. Start with [Quick Start](#quick-start) above
2. Read [ADMIN_AUTH_GUIDE.md](./ADMIN_AUTH_GUIDE.md) - Overview section
3. Try local setup and test the login flow
4. Read [API_REFERENCE.md](./API_REFERENCE.md) - understand endpoints
5. Explore code in `app/api/auth/` and `lib/auth.ts`

### For DevOps/Deployment

1. Read [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md)
2. Follow Production Deployment section
3. Configure environment variables
4. Run migrations and seed data
5. Test auth flow in production
6. Implement security hardening steps

### For API Integration

1. Review [API_REFERENCE.md](./API_REFERENCE.md)
2. Check endpoint examples
3. Test with cURL or Postman
4. Implement error handling
5. Use provided TypeScript client library

## 💡 Best Practices

### Security
- Always use HTTPS in production
- Store credentials in environment variables
- Never commit `.env` files
- Use strong passwords (8+ characters)
- Rotate credentials periodically
- Implement rate limiting on auth endpoints

### Development
- Use TypeScript for type safety
- Follow existing code patterns
- Add tests for new auth features
- Document API changes
- Keep dependencies updated

### Deployment
- Test thoroughly before production
- Use environment-specific configs
- Set up monitoring and alerts
- Plan for disaster recovery
- Regular backups

---

**Last Updated**: February 4, 2026  
**Documentation Version**: 1.0.0  
**Project**: Novraux E-commerce Platform
