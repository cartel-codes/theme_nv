# Copilot Instructions for Novraux Codebase

Welcome to the Novraux codebase! This document provides essential guidance for AI coding agents to be productive in this project. Follow these instructions to understand the architecture, workflows, and conventions.

---

## 🏗️ Big Picture Architecture

### Key Components
- **Frontend**: Built with Next.js, located in the `app/` directory. Includes pages, layouts, and global styles.
- **Backend**: API routes in `app/api/` handle server-side logic.
- **Database**: PostgreSQL managed via Prisma ORM. Schema defined in `prisma/schema.prisma`.
- **Authentication**: Email/password-based system with bcryptjs for hashing. Managed in `lib/auth.ts` and `middleware.ts`.
- **Admin Panel**: Accessible at `/admin`. Key files:
  - `app/admin/layout.tsx`
  - `app/admin/page.tsx`

### Data Flow
1. **Frontend**: User interactions trigger API calls.
2. **Backend**: API routes process requests and interact with the database.
3. **Database**: Prisma handles queries and migrations.

---

## 🔄 Developer Workflows

### Local Development
1. Install dependencies: `npm install`
2. Setup database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
3. Start the development server: `npm run dev`
4. Access the app at `http://localhost:3000`.

### Testing
- Run all tests: `npm test`
- Test specific components: `npm test -- components/__tests__/`

### Debugging
- Use `console.log` for quick debugging.
- Check `lib/` for reusable utilities.
- Review middleware in `middleware.ts` for request/response handling.

---

## 📋 Project-Specific Conventions

### Code Style
- Follow TypeScript best practices.
- Use functional components and React hooks.
- Place reusable components in `components/`.

### File Naming
- Use `camelCase` for files and directories.
- Test files are named `*.test.ts` or `*.test.tsx`.

### API Design
- API routes are in `app/api/`.
- Use RESTful principles.
- Protect sensitive routes with middleware.

---

## 🔗 Integration Points

### External Dependencies
- **Prisma**: Database ORM. See `prisma/`.
- **Supabase**: Used for authentication and storage.
- **Tailwind CSS**: Utility-first CSS framework. Configured in `tailwind.config.ts`.

### Cross-Component Communication
- Use React Context for shared state (e.g., `contexts/CartContext.tsx`).
- Pass props explicitly between components.

---

## 📂 Key Files and Directories

- `app/`: Frontend pages and layouts.
- `lib/`: Backend utilities (e.g., `auth.ts`, `session.ts`).
- `prisma/`: Database schema and migrations.
- `components/`: Reusable UI components.
- `documentation/`: Guides and references.

---

## 🆘 Getting Help

### Common Issues
- **Database Errors**: Check `prisma/schema.prisma` and run `npm run db:reset`.
- **Authentication Issues**: Debug `lib/auth.ts` and `middleware.ts`.
- **Styling Problems**: Review `tailwind.config.ts` and `globals.css`.

### Resources
- Prisma Docs: https://www.prisma.io/docs/
- Next.js Docs: https://nextjs.org/docs/
- Tailwind CSS Docs: https://tailwindcss.com/docs

---

For further details, refer to the `README.md` files in the root and `documentation/` directories.