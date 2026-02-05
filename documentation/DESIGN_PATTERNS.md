# System Design Patterns & Best Practices

**Document**: Design Patterns & Code Guidelines  
**Date**: February 5, 2026  
**Project**: Novraux E-commerce Platform

---

## TABLE OF CONTENTS

1. [Design Patterns Used](#design-patterns-used)
2. [Code Organization Principles](#code-organization-principles)
3. [Database Design Best Practices](#database-design-best-practices)
4. [API Design Principles](#api-design-principles)
5. [Frontend Component Design](#frontend-component-design)
6. [State Management Pattern](#state-management-pattern)
7. [Security Patterns](#security-patterns)
8. [Error Handling & Validation](#error-handling--validation)
9. [Performance Optimization](#performance-optimization)

---

## DESIGN PATTERNS USED

### 1. Controller-Service-Repository Pattern

**Purpose**: Separation of concerns

```
┌─────────────────────────────────────────┐
│         API Route (Controller)           │
│  Handles: request/response, routing     │
└──────────────────┬──────────────────────┘
                   │ calls
                   ↓
┌─────────────────────────────────────────┐
│        Service/Handler Layer            │
│  Handles: business logic, validation    │
└──────────────────┬──────────────────────┘
                   │ uses
                   ↓
┌─────────────────────────────────────────┐
│      Prisma Repository (ORM)            │
│  Handles: database queries, models      │
└─────────────────────────────────────────┘
```

**Example**:

```typescript
// app/api/cart/add/route.ts (Controller)
export async function POST(req: NextRequest) {
  const { productId, quantity } = await req.json();
  
  // Delegate to service
  const result = await cartService.addItem(productId, quantity);
  return NextResponse.json(result);
}

// lib/cart.ts (Service)
export async function addItem(productId: string, quantity: number) {
  // Validation
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Product not found');
  
  // Business logic
  const cart = await getOrCreateCart();
  
  // Repository call
  return await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: { increment: quantity } }
  });
}
```

### 2. Context Provider Pattern (React)

**Purpose**: Global state without prop drilling

```
┌─────────────────────────────────────┐
│      CartContext.tsx                │
│  ├─ Context definition              │
│  └─ Provider component              │
└────────────────┬────────────────────┘
                 │
                 ├─ Create context
                 ├─ Define type
                 └─ Export provider
                 
┌─────────────────────────────────────┐
│      providers.tsx (Root)           │
│  Wraps app with all providers       │
└────────────────┬────────────────────┘
                 │
┌─────────────────────────────────────┐
│      useCart() hook                 │
│  Consume context anywhere           │
└─────────────────────────────────────┘
```

**Implementation**:

```typescript
// contexts/CartContext.tsx
interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const addToCart = async (productId: string, quantity: number) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    setItems(data.items);
  };
  
  return (
    <CartContext.Provider value={{ items, addToCart, ... }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

// Usage in component
export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  
  return (
    <button onClick={() => addToCart(product.id, 1)}>
      Add to Cart
    </button>
  );
}
```

### 3. Middleware Pattern (Route Protection)

**Purpose**: Cross-cutting concerns (auth, logging, etc.)

```
Request
  │
  ├─→ Middleware Stack
  │    ├─ Parse cookies
  │    ├─ Validate session
  │    ├─ Check permissions
  │    └─ Add user to request
  │
  └─→ Route Handler
       └─ Execute route logic
```

**Implementation**:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Protected routes
  if (pathname.startsWith('/admin')) {
    const session = validateAdminSession(request);
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  if (pathname.startsWith('/checkout')) {
    const session = validateUserSession(request);
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 4. Service Locator Pattern (Utility Modules)

**Purpose**: Centralized, reusable services

```typescript
// lib/auth.ts - Authentication service
export async function validateSession(token: string) {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken: token },
    include: { user: true }
  });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  // Update activity
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActivity: new Date() }
  });
  
  return session.user;
}

// lib/cart.ts - Cart service
export async function addItemToCart(userId: string, productId: string, qty: number) {
  // Implementation...
}

// lib/seo.ts - SEO service
export async function generateSEO(title: string, description: string) {
  // Implementation...
}

// In routes, import and use
import { validateSession } from '@/lib/auth';
```

### 5. Factory Pattern (Model Creation)

**Purpose**: Consistent object creation

```typescript
// lib/factories.ts
export async function createOrderWithItems(
  userId: string,
  items: OrderItem[],
  shippingAddress: ShippingAddress,
  totals: { subtotal: number; tax: number; shipping: number; total: number }
) {
  // Create order
  const order = await prisma.order.create({
    data: {
      userId,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: JSON.stringify(shippingAddress),
    }
  });
  
  // Create order items
  await prisma.orderItem.createMany({
    data: items.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
    }))
  });
  
  return order;
}
```

### 6. Template Method Pattern (Forms)

**Purpose**: Common form flow with variations

```typescript
// components/BaseForm.tsx
interface BaseFormProps {
  title: string;
  onSubmit: (data: any) => Promise<void>;
  fields: FormField[];
  submitLabel?: string;
  successMessage?: string;
}

export function BaseForm(props: BaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      await props.onSubmit(data);
      // Success handling
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2>{props.title}</h2>
      {error && <ErrorBanner message={error} />}
      
      {props.fields.map(field => (
        <FormField key={field.name} {...field} />
      ))}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : (props.submitLabel || 'Submit')}
      </button>
    </form>
  );
}

// ProductForm extends with specific fields
export function ProductForm() {
  return (
    <BaseForm
      title="Create Product"
      fields={[
        { name: 'name', label: 'Product Name', required: true },
        { name: 'price', label: 'Price', type: 'number', required: true },
        // ...
      ]}
      onSubmit={async (data) => {
        await fetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }}
      successMessage="Product created successfully!"
    />
  );
}
```

---

## CODE ORGANIZATION PRINCIPLES

### Directory Structure Rationale

```
app/                          ← Next.js pages & routes
├── (public)/                 ← Public pages (no path prefix)
│   ├── page.tsx              ← Home page /
│   ├── products/             ← Product pages /products
│   └── checkout/             ← Checkout flow /checkout
│
├── (auth)/                   ← Auth pages (no path prefix)
│   ├── auth/login/page.tsx   ← /auth/login
│   └── account/              ← /account (protected)
│
├── admin/                    ← Admin section /admin
│   ├── layout.tsx            ← Admin layout with sidebar
│   ├── posts/                ← Blog management /admin/posts
│   └── products/             ← Product management /admin/products
│
└── api/                      ← API routes
    ├── auth/                 ← Authentication /api/auth/*
    ├── products/             ← Products /api/products/*
    ├── cart/                 ← Cart /api/cart/*
    └── checkout/             ← Checkout /api/checkout/*

components/                   ← Reusable UI components
├── __tests__/                ← Component tests
├── admin/                    ← Admin-specific components
│   ├── ProductForm.tsx
│   └── PostForm.tsx
├── CartDrawer.tsx
├── ProductCard.tsx
└── Header.tsx

lib/                          ← Utilities & services
├── auth.ts                   ← Auth service
├── cart.ts                   ← Cart service
├── seo.ts                    ← SEO utilities
├── prisma.ts                 ← Prisma client singleton
└── __tests__/                ← Library tests

contexts/                     ← React Context
├── CartContext.tsx
└── UserContext.tsx

types/                        ← TypeScript types
├── index.ts
└── models.ts

public/                       ← Static assets
├── images/
└── fonts/

prisma/                       ← Database
├── schema.prisma             ← Database schema
├── migrations/               ← Schema versions
└── seed.ts                   ← Seed data
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case` or `camelCase` | `cartService.ts`, `cart-item.tsx` |
| Directories | `kebab-case` | `admin-dashboard`, `cart-items` |
| Components | `PascalCase` | `CartDrawer`, `ProductCard` |
| Functions | `camelCase` | `addToCart`, `validateEmail` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_CART_ITEMS`, `API_BASE_URL` |
| Types/Interfaces | `PascalCase` | `CartItem`, `UserSession` |
| Enums | `PascalCase` | `OrderStatus`, `UserRole` |
| Boolean variables | `is/has/can prefix` | `isLoading`, `hasError`, `canSubmit` |

---

## DATABASE DESIGN BEST PRACTICES

### 1. Normalization & Relationships

**✅ Good**: Normalized schema

```prisma
model Product {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  price     Decimal  @db.Decimal(10, 2)
  CategoryId String
  category  Category @relation(fields: [CategoryId], references: [id])
  
  orderItems OrderItem[]  // One-to-many
  cartItems  CartItem[]
  
  @@index([slug])
  @@index([categoryId])
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  products Product[] // One-to-many reverse relation
  
  @@index([slug])
}
```

**❌ Bad**: Denormalized (redundant data)

```prisma
model Product {
  id            String
  name          String
  price         Decimal
  categoryName  String          // Don't store - maintain relation
  categorySlug  String          // Don't store - maintain relation
  // ... causes update anomalies
}
```

### 2. ID Generation

**✅ Use consistent ID strategy**:

```prisma
model User {
  id        String   @id @default(cuid())  // CUID: collision-resistant, sortable
  // or
  id        String   @id @default(uuid())  // UUID v4: standard
}

// Don't mix strategies within single table
```

### 3. Timestamps

**✅ Always include for audit trail**:

```prisma
model Order {
  id         String   @id @default(cuid())
  // ... fields
  createdAt  DateTime @default(now())      // Immutable creation time
  updatedAt  DateTime @updatedAt           // Auto-updated on change
}

// Query by date range
const recentOrders = await prisma.order.findMany({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)  // Last 7 days
    }
  }
});
```

### 4. Constraints & Validation

**✅ Database-level constraints**:

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique              // Ensures uniqueness
  phone String?                      // Optional field
  
  @@unique([email, phone])           // Composite unique constraint
  @@index([email])                   // For fast lookups
}

model CartItem {
  id        String @id @default(cuid())
  cartId    String
  productId String
  quantity  Int    @default(1)
  
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
  
  @@unique([cartId, productId])     // Only one per cart
}
```

### 5. Soft Deletes vs Hard Deletes

**✅ Soft delete for audit**:

```prisma
model Product {
  id        String    @id @default(cuid())
  // ... fields
  deletedAt DateTime?                // null = active, timestamp = deleted
  
  @@index([deletedAt])               // For filtering
}

// queries/products.ts
export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { deletedAt: null }       // Only active
  });
}

export async function softDeleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() }  // Mark as deleted, don't remove
  });
}
```

### 6. JSON Fields for Semi-Structured Data

**✅ Use for addresses, metadata**:

```prisma
model Order {
  id               String   @id @default(cuid())
  shippingAddress  Json     // Flexible, no schema migration
  // vs creating AddressTable
  
  metadata         Json?    // Additional data
}

// In code
const order = await prisma.order.create({
  data: {
    // ...
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      country: 'US'
    }
  }
});
```

---

## API DESIGN PRINCIPLES

### 1. RESTful Conventions

| Operation | Method | URL | Expected Status |
|-----------|--------|-----|-----------------|
| List | GET | `/api/products` | 200 OK |
| Create | POST | `/api/products` | 201 Created |
| Read | GET | `/api/products/[id]` | 200 OK |
| Update | PUT | `/api/products/[id]` | 200 OK |
| Delete | DELETE | `/api/products/[id]` | 204 No Content |

### 2. Response Format Consistency

**✅ Consistent structure**:

```typescript
// Success (200)
{
  "data": { /* actual data */ },
  "success": true,
  "message": "Operation successful"
}

// Error (400+)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Required field" }
    ]
  }
}
```

### 3. Error Handling

**✅ Consistent error responses**:

```typescript
export async function handleError(error: any) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', ... } },
      { status: 400 }
    );
  }
  
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', ... } },
      { status: 404 }
    );
  }
  
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', ... } },
      { status: 401 }
    );
  }
  
  // Default 500
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', ... } },
    { status: 500 }
  );
}
```

### 4. Input Validation

**✅ Validate at route**:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Validate input
  const { email, password, firstName } = body;
  
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_FIELDS' } },
      { status: 400 }
    );
  }
  
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_EMAIL' } },
      { status: 400 }
    );
  }
  
  if (password.length < 8) {
    return NextResponse.json(
      { success: false, error: { code: 'WEAK_PASSWORD' } },
      { status: 400 }
    );
  }
  
  // Proceed with logic
}
```

### 5. Pagination

**✅ Consistent pagination**:

```typescript
// Request
GET /api/products?page=1&limit=20&sort=name

// Response
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}

// Implementation
const page = Math.max(1, parseInt(query.page) || 1);
const limit = Math.min(100, parseInt(query.limit) || 20);
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.product.findMany({ skip, take: limit }),
  prisma.product.count()
]);

return {
  data: items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  }
};
```

---

## FRONTEND COMPONENT DESIGN

### 1. Component Organization

**✅ Small, focused components**:

```typescript
// ❌ Bad: 500 lines in one component
export function ProductPage() {
  // Product details, images, reviews, recommendations all here
}

// ✅ Good: Decomposed
export function ProductPage() {
  return (
    <div>
      <ProductHeader product={product} />
      <ProductImages images={product.images} />
      <ProductDetails product={product} />
      <ProductReviews productId={product.id} />
      <RelatedProducts category={product.categoryId} />
    </div>
  );
}

export function ProductImages({ images }: { images: Image[] }) {
  // Pure image carousel
}

export function ProductReviews({ productId }: { productId: string }) {
  // Separate concern: reviews
}
```

### 2. Props Drilling Prevention

**✅ Use Context for deeply nested**:

```typescript
// ❌ Bad: Prop drilling
export function Page({ theme, setTheme }) {
  return <Header theme={theme} setTheme={setTheme} />;
}

export function Header({ theme, setTheme }) {
  return <Nav theme={theme} setTheme={setTheme} />;
}

export function Nav({ theme, setTheme }) {
  return <ThemeToggle theme={theme} setTheme={setTheme} />;
}

// ✅ Good: Use Context
export function Page() {
  return <ThemeProvider><App /></ThemeProvider>;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme(...)}>Toggle</button>;
}
```

### 3. Loading States

**✅ Always handle loading**:

```typescript
export function ProductCard({ productId }: { productId: string }) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/products/${productId}`);
        setProduct(await res.json());
      } catch (err) {
        setError('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productId]);
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return null;
  
  return (
    <div>
      <h2>{product.name}</h2>
      <p>${product.price}</p>
    </div>
  );
}
```

### 4. Form Components

**✅ Separation of form logic from UI**:

```typescript
// hooks/useForm.ts
export function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors(err.fieldErrors || {});
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { values, errors, handleChange, handleSubmit, isSubmitting };
}

// components/LoginForm.tsx
export function LoginForm() {
  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm(
    { email: '', password: '' },
    async (values) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('Login failed');
    }
  );
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email}</span>}
      
      <input
        type="password"
        name="password"
        value={values.password}
        onChange={handleChange}
        placeholder="Password"
      />
      {errors.password && <span>{errors.password}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## STATE MANAGEMENT PATTERN

### 1. Local State (useState)

**✅ For component-level state**:

```typescript
export function Counter() {
  const [count, setCount] = useState(0);  // Local to this component
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

### 2. Lifted State

**✅ For sibling communication**:

```typescript
// Parent component
export function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  
  return (
    <div>
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <AddToCartButton productId="123" quantity={quantity} />
    </div>
  );
}

// Child components receive props
function QuantitySelector({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {/* options */}
    </select>
  );
}
```

### 3. Context (Global State)

**✅ For app-wide state**:

```typescript
// contexts/CartContext.tsx
export function CartProvider({ children }) {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const addToCart = useCallback(async (productId, qty) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: qty })
    });
    const data = await res.json();
    setItems(data.items);
  }, []);
  
  return (
    <CartContext.Provider value={{ items, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}

// Any component
export function CartBadge() {
  const { items } = useCart();
  return <span className="badge">{items.length}</span>;
}
```

---

## SECURITY PATTERNS

### 1. Password Security

**✅ Bcrypt hashing with salt rounds**:

```typescript
import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;  // Higher = slower but more secure

export async function hashPassword(password: string) {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcryptjs.compare(password, hash);
}

// Usage
const hashed = await hashPassword(userPassword);
await prisma.user.create({ email, password: hashed });

// Verification
const isValid = await verifyPassword(inputPassword, user.password);
```

### 2. Session Security

**✅ HTTP-only cookies, session tokens**:

```typescript
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set('sessionToken', token, {
    httpOnly: true,          // No JS access
    secure: process.env.NODE_ENV === 'production',  // HTTPS only
    sameSite: 'lax',         // CSRF protection
    maxAge: 60 * 60 * 24 * 30  // 30 days
  });
}

export function getSessionFromCookies(req: NextRequest) {
  return req.cookies.get('sessionToken')?.value;
}
```

### 3. CSRF Protection

**✅ Same-Site cookies & origin checks**:

```typescript
// Cookies already have SameSite=Lax
// Add origin verification for sensitive operations

export async function validateOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://novraux.com'
  ];
  
  if (!origin || !allowedOrigins.includes(origin)) {
    throw new Error('Invalid origin');
  }
}
```

### 4. Authorization (Route Protection)

**✅ Check user owns resource**:

```typescript
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { orderId } = await req.json();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  
  // Verify user owns order
  if (order.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with operation
}
```

---

## ERROR HANDLING & VALIDATION

### 1. Validation Pipeline

```typescript
export async function validateCheckoutInput(input: unknown) {
  // Type check
  if (typeof input !== 'object' || !input) {
    throw new ValidationError('Invalid input');
  }
  
  const { items, shippingAddress } = input as Record<string, any>;
  
  // Required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Items required');
  }
  
  if (!shippingAddress) {
    throw new ValidationError('Shipping address required');
  }
  
  // Field validation
  items.forEach((item, idx) => {
    if (!item.productId) throw new ValidationError(`Item ${idx}: productId required`);
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new ValidationError(`Item ${idx}: valid quantity required`);
    }
  });
  
  const { firstName, lastName, email, street, city, state, zip } = shippingAddress;
  if (!firstName || !lastName || !email || !street || !city || !state || !zip) {
    throw new ValidationError('Address incomplete');
  }
  
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email');
  }
  
  return { items, shippingAddress };
}
```

### 2. Error Classes

```typescript
export class ApplicationError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

// Usage
if (!user) throw new UnauthorizedError('Login required');
if (!product) throw new NotFoundError('Product');
if (order.userId !== user.id) throw new ForbiddenError('Cannot access this order');
```

---

## PERFORMANCE OPTIMIZATION

### 1. Database Query Optimization

**✅ Select only needed fields**:

```typescript
// ❌ Bad: Fetch all fields
const user = await prisma.user.findUnique({ where: { id } });

// ✅ Good: Select specific fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    firstName: true,
    // Exclude password, sensitive data
  }
});
```

### 2. Query Batching

**✅ Fetch related data efficiently**:

```typescript
// ❌ Bad: N+1 queries
const products = await prisma.product.findMany();
for (const product of products) {
  product.category = await prisma.category.findUnique({
    where: { id: product.categoryId }
  });
}

// ✅ Good: Single query with relations
const products = await prisma.product.findMany({
  include: { category: true }
});
```

### 3. Pagination

**✅ Don't fetch all records**:

```typescript
// ❌ Bad: Load all
const allProducts = await prisma.product.findMany();

// ✅ Good: Paginate
const products = await prisma.product.findMany({
  skip: 0,
  take: 20,
  where: { deletedAt: null }
});
```

### 4. Caching

**✅ Cache static content**:

```typescript
// blog/page.tsx
export const revalidate = 60;  // ISR: revalidate every 60 seconds

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' }
  });
  
  return <BlogListing posts={posts} />;
}

// Revalidate on mutation
export async function POST(req: NextRequest) {
  // Create post
  await revalidatePath('/blog');  // Invalidate cache
  return NextResponse.json({ success: true });
}
```

---

**Document Version**: 1.0  
**Last Updated**: February 5, 2026

