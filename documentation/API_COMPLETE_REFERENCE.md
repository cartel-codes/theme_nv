# API Reference & Implementation Guide

**Document**: Complete API Reference  
**Date**: February 5, 2026  
**Project**: Novraux E-commerce Platform

---

## TABLE OF CONTENTS

1. [API Overview](#api-overview)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Products API](#products-api)
4. [Cart API](#cart-api)
5. [Checkout API](#checkout-api)
6. [Admin API](#admin-api)
7. [Error Codes & Responses](#error-codes--responses)
8. [Examples & Workflows](#examples--workflows)

---

## API OVERVIEW

### Base Information

```
Base URL: http://localhost:3001 (development)
Base URL: https://novraux.com (production)
Content-Type: application/json
Authentication: Cookie-based (sessionToken)
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate email, etc.) |
| 500 | Server Error | Unexpected server error |

---

## AUTHENTICATION ENDPOINTS

### 1. User Signup

**POST** `/api/auth/user/signup`

Create a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Request Headers**:
```
Content-Type: application/json
```

**Validation**:
- `email`: Valid email format, must not exist
- `password`: Minimum 8 characters
- `firstName`, `lastName`: Non-empty strings

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Account created successfully"
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already exists",
    "details": [
      {
        "field": "email",
        "message": "Email already registered"
      }
    ]
  }
}
```

**Session Generated**: Yes (HTTP-only cookie set)

**Related Code**:
- [app/api/auth/user/signup/route.ts](../app/api/auth/user/signup/route.ts)
- [lib/auth.ts](../lib/auth.ts) - `signup()` function

---

### 2. User Login

**POST** `/api/auth/user/login`

Authenticate user and create session.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Validation**:
- `email`: Valid format
- `password`: Required, non-empty

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Login successful"
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password incorrect"
  }
}
```

**Session Generated**: Yes (HTTP-only cookie set, 30-day expiration)

**Cookie Details**:
```
Name: sessionToken
HttpOnly: true
Secure: true (production only)
SameSite: Lax
MaxAge: 2592000 (30 days)
```

**Related Code**:
- [app/api/auth/user/login/route.ts](../app/api/auth/user/login/route.ts)
- [lib/auth.ts](../lib/auth.ts) - `login()` function

---

### 3. User Logout

**POST** `/api/auth/user/logout`

Invalidate user session.

**Request**:
```
No body required
Method: POST
```

**Authentication**: Required (sessionToken cookie)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Session**: Invalidated, cookie cleared

**Related Code**:
- [app/api/auth/user/logout/route.ts](../app/api/auth/user/logout/route.ts)

---

### 4. Get Current User

**GET** `/api/auth/user/me`

Get logged-in user's profile.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "createdAt": "2026-02-05T10:00:00Z"
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Please log in first"
  }
}
```

---

### 5. Admin Login

**POST** `/api/auth/admin/login`

Admin user authentication.

**Request**:
```json
{
  "email": "admin@novraux.com",
  "password": "AdminPassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "admin_123",
    "email": "admin@novraux.com",
    "role": "admin"
  }
}
```

**Session**: Admin session created (HTTP-only cookie)

---

---

## PRODUCTS API

### 1. List Products

**GET** `/api/products`

Retrieve products with pagination and filtering.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search in name/description |
| categoryId | string | - | Filter by category |
| sort | string | name | Sort by (name, price, createdAt) |
| order | string | asc | Ascending/descending (asc, desc) |

**Example Request**:
```
GET /api/products?page=1&limit=20&categoryId=cat_123&sort=price&order=asc
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1",
      "name": "Product Name",
      "slug": "product-name",
      "price": "99.99",
      "imageUrl": "https://...",
      "categoryId": "cat_123",
      "createdAt": "2026-02-05T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Related Code**:
- [app/api/products/route.ts](../app/api/products/route.ts)

---

### 2. Get Product by ID

**GET** `/api/products/[id]`

Get single product details.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product ID (CUID) |

**Example Request**:
```
GET /api/products/prod_abc123
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "prod_abc123",
    "name": "Premium Headphones",
    "slug": "premium-headphones",
    "description": "High-quality wireless headphones...",
    "price": "199.99",
    "imageUrl": "https://...",
    "categoryId": "cat_123",
    "category": {
      "id": "cat_123",
      "name": "Electronics",
      "slug": "electronics"
    },
    "keywords": "headphones, audio, wireless",
    "metaTitle": "Premium Headphones - Novraux",
    "metaDescription": "High-quality wireless headphones...",
    "focusKeyword": "headphones",
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-02-05T10:00:00Z"
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found"
  }
}
```

---

### 3. Get Product by Slug

**GET** `/api/products/by-slug/[slug]`

Get product by URL-friendly slug.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Product slug |

**Example Request**:
```
GET /api/products/by-slug/premium-headphones
```

**Response**: Same as Get Product by ID (200 OK)

---

---

## CART API

### 1. Get Cart

**GET** `/api/cart`

Retrieve user's cart with all items.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart_abc123",
    "userId": "user_123",
    "items": [
      {
        "id": "cartitem_1",
        "cartId": "cart_abc123",
        "productId": "prod_1",
        "quantity": 2,
        "product": {
          "id": "prod_1",
          "name": "Premium Headphones",
          "price": "199.99",
          "imageUrl": "https://...",
          "slug": "premium-headphones"
        }
      }
    ],
    "totalItems": 2,
    "totalPrice": "399.98",
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-02-05T10:00:00Z"
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 2. Add Item to Cart

**POST** `/api/cart/add`

Add product to user's cart.

**Authentication**: Required

**Request Body**:
```json
{
  "productId": "prod_abc123",
  "quantity": 1
}
```

**Validation**:
- `productId`: Must exist
- `quantity`: 1-999, integer

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cart_abc123",
    "items": [
      {
        "id": "cartitem_1",
        "cartId": "cart_abc123",
        "productId": "prod_1",
        "quantity": 3,
        "product": { ... }
      }
    ],
    "totalItems": 3,
    "totalPrice": "599.97"
  },
  "message": "Item added to cart"
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be between 1 and 999"
  }
}
```

**Logic**:
- If product already in cart: increment quantity
- If new product: create CartItem
- Prevent duplicates through `cartId_productId` unique constraint

---

### 3. Update Cart Item Quantity

**PUT** `/api/cart/update`

Update quantity of item in cart.

**Authentication**: Required

**Request Body**:
```json
{
  "itemId": "cartitem_1",
  "quantity": 5
}
```

**Validation**:
- `itemId`: Must exist in user's cart
- `quantity`: 1-999, integer

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalItems": 5,
    "totalPrice": "999.95"
  },
  "message": "Quantity updated"
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Cart item not found"
  }
}
```

---

### 4. Remove Item from Cart

**DELETE** `/api/cart`

Remove item from user's cart.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| itemId | string | CartItem ID |

**Example Request**:
```
DELETE /api/cart?itemId=cartitem_1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalItems": 2,
    "totalPrice": "399.98"
  },
  "message": "Item removed from cart"
}
```

---

### 5. Clear Cart

**DELETE** `/api/cart/clear`

Remove all items from cart.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [],
    "totalItems": 0,
    "totalPrice": "0.00"
  },
  "message": "Cart cleared"
}
```

---

---

## CHECKOUT API

### 1. Validate Cart

**POST** `/api/checkout/validate`

Validate cart before checkout and calculate totals.

**Request Body**:
```json
{
  "items": [
    {
      "productId": "prod_1",
      "quantity": 2
    }
  ]
}
```

**Validation**:
- `items`: Not empty array
- `productId`: Must exist
- `quantity`: 1-999

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "prod_1",
        "name": "Premium Headphones",
        "price": "199.99",
        "quantity": 2,
        "itemTotal": "399.98"
      }
    ],
    "subtotal": "399.98",
    "tax": "39.99",
    "shipping": "10.00",
    "total": "449.97"
  },
  "message": "Cart validated successfully"
}
```

**Calculation Logic**:
```
subtotal = sum(item.price × item.quantity)
tax = subtotal × 0.10
shipping = subtotal > 100 ? 0 : 10
total = subtotal + tax + shipping
```

---

### 2. Create Payment Intent

**POST** `/api/checkout/create-intent`

Create order and prepare for payment.

**Authentication**: Required

**Request Body**:
```json
{
  "items": [
    {
      "productId": "prod_1",
      "quantity": 2,
      "price": "199.99"
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "US"
  }
}
```

**Validation**:
- User authenticated
- Items not empty
- All products exist
- Address complete and valid
- Email format valid
- Zip format valid

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "orderId": "order_abc123",
    "clientSecret": "pi_test_secret_123...",
    "total": "449.97",
    "status": "pending"
  },
  "message": "Order created, ready for payment"
}
```

**Order Created with**:
```
status: "pending"
paymentStatus: "pending"
subtotal, tax, shipping, total: calculated
shippingAddress: stored as JSON
userId: from session
```

---

### 3. Complete Checkout

**POST** `/api/checkout/complete`

Finalize payment and complete order.

**Authentication**: Required

**Request Body**:
```json
{
  "orderId": "order_abc123",
  "paymentId": "pi_test_payment_123",
  "paymentStatus": "succeeded"
}
```

**Validation**:
- User authenticated
- Order exists and belongs to user
- Payment status succeeded

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orderId": "order_abc123",
    "status": "paid",
    "order": {
      "id": "order_abc123",
      "userId": "user_123",
      "total": "449.97",
      "status": "paid",
      "paymentStatus": "succeeded",
      "shippingAddress": { ... },
      "items": [ ... ],
      "createdAt": "2026-02-05T10:00:00Z"
    }
  },
  "message": "Order completed successfully"
}
```

**Side Effects**:
- Order status updated to "paid"
- PaymentStatus updated to "succeeded"
- User's cart cleared (all CartItems deleted)
- TODO: Confirmation email sent
- TODO: Fulfillment request created

### 4. Create PayPal Order

**POST** `/api/checkout/paypal/create-order`

Creates a PayPal order and syncs it with the local database.

**Authentication**: Required

**Request Body**:
```json
{
  "items": [
    {
      "productId": "prod_1",
      "variantId": "var_1",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "US"
  }
}
```

**Response** (200 OK):
```json
{
  "id": "PAYPAL_ORDER_ID",
  "localOrderId": "order_abc123",
  "total": 449.97
}
```

---

### 5. Capture PayPal Order

**POST** `/api/checkout/paypal/capture-order`

Captures the payment on PayPal and finalizes the order locally.

**Authentication**: Required

**Request Body**:
```json
{
  "paypalOrderId": "PAYPAL_ORDER_ID"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "orderId": "order_abc123",
  "status": "paid"
}
```

**Side Effects**:
- Order status updated to "paid"
- Inventory deducted for all items
- User's cart cleared

---
    "message": "Payment was not successful"
  }
}
```

---

---

## ADMIN API

### 1. Create Product

**POST** `/api/admin/products`

Create new product.

**Authentication**: Admin required

**Request Body**:
```json
{
  "name": "Premium Headphones",
  "slug": "premium-headphones",
  "price": "199.99",
  "description": "High-quality wireless headphones...",
  "categoryId": "cat_123",
  "imageUrl": "https://...",
  "keywords": "headphones, audio, wireless",
  "metaTitle": "Premium Headphones - Novraux",
  "metaDescription": "High-quality wireless headphones",
  "focusKeyword": "headphones",
  "ogImage": "https://..."
}
```

**Validation**:
- `name`: Non-empty string
- `slug`: Unique, lowercase, kebab-case
- `price`: Valid decimal format
- `categoryId`: Must exist
- `description`: Optional but recommended
- `imageUrl`: Valid URL format

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "prod_new123",
    "name": "Premium Headphones",
    "slug": "premium-headphones",
    "price": "199.99",
    "createdAt": "2026-02-05T10:00:00Z"
  },
  "message": "Product created successfully"
}
```

---

### 2. Update Product

**PUT** `/api/admin/products/[id]`

Update product details.

**Authentication**: Admin required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product ID |

**Request Body**: Same as Create Product

**Response** (200 OK):
```json
{
  "success": true,
  "data": { /* updated product */ },
  "message": "Product updated successfully"
}
```

---

### 3. Delete Product

**DELETE** `/api/admin/products/[id]`

Delete product (soft delete).

**Authentication**: Admin required

**Response** (204 No Content):
```
No body
```

---

### 4. Create Blog Post

**POST** `/api/admin/posts`

Create new blog post.

**Authentication**: Admin required

**Request Body**:
```json
{
  "title": "Getting Started with E-commerce",
  "slug": "getting-started-ecommerce",
  "excerpt": "Learn the basics...",
  "content": "Full HTML content or markdown...",
  "imageUrl": "https://...",
  "keywords": "ecommerce, business, online",
  "metaTitle": "Getting Started with E-commerce",
  "metaDescription": "Learn the basics",
  "focusKeyword": "ecommerce",
  "publishedAt": "2026-02-05T10:00:00Z" // optional, set to now if provided
}
```

**Validation**:
- `title`: Non-empty
- `slug`: Unique
- `content`: Non-empty
- `excerpt`: Recommended

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "post_new123",
    "title": "Getting Started with E-commerce",
    "slug": "getting-started-ecommerce",
    "publishedAt": "2026-02-05T10:00:00Z",
    "createdAt": "2026-02-05T10:00:00Z"
  },
  "message": "Post published successfully"
}
```

**Side Effects**:
- If `publishedAt` provided: post is published
- Revalidation triggered: POST /blog cleared from cache

---

### 5. Update Blog Post

**PUT** `/api/admin/posts/[id]`

Update blog post.

**Authentication**: Admin required

**Request Body**: Same as Create Blog Post

**Response** (200 OK):
```json
{
  "success": true,
  "data": { /* updated post */ },
  "message": "Post updated successfully"
}
```

---

### 6. Create Category

**POST** `/api/admin/categories`

Create new product category.

**Authentication**: Admin required

**Request Body**:
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and accessories",
  "metaTitle": "Electronics - Novraux",
  "metaDescription": "Shop our electronics collection"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": { /* category */ },
  "message": "Category created"
}
```

---

---

## ERROR CODES & RESPONSES

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Error Codes

| Error Code | HTTP Status | Meaning |
|-----------|-----------|---------|
| VALIDATION_ERROR | 400 | Invalid input data |
| MISSING_FIELDS | 400 | Required fields missing |
| INVALID_EMAIL | 400 | Email format invalid |
| WEAK_PASSWORD | 400 | Password doesn't meet requirements |
| DUPLICATE_EMAIL | 409 | Email already registered |
| DUPLICATE_SLUG | 409 | Slug already exists |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Permission denied |
| PAYMENT_FAILED | 400 | Payment processing failed |
| ITEM_NOT_FOUND | 404 | Cart item not found |
| PRODUCT_NOT_FOUND | 404 | Product not found |
| ORDER_NOT_FOUND | 404 | Order not found |
| INVALID_SESSION | 401 | Session expired or invalid |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## EXAMPLES & WORKFLOWS

### Workflow 1: User Registration & Login

```
1. POST /api/auth/user/signup {email, password, firstName, lastName}
   ├─ Validation: email format, password length, not duplicate
   ├─ Database: Create User, Create Cart (1:1), Create Session
   └─ Response: user data + Set-Cookie: sessionToken

2. POST /api/auth/user/login {email, password}
   ├─ Validation: email, password (using bcrypt compare)
   ├─ Database: Find user, validate password, create session
   └─ Response: user data + Set-Cookie: sessionToken

3. Browser auto-includes sessionToken in all subsequent requests
```

### Workflow 2: Shopping & Cart

```
1. GET /api/products?page=1&limit=20
   └─ Response: product listings with pagination

2. GET /api/products/[id]
   └─ Response: product details (name, price, description, images)

3. POST /api/cart/add {productId: "prod_1", quantity: 2}
   ├─ Fetch user's cart (ID from session)
   ├─ Upsert CartItem (merge if exists)
   └─ Response: updated cart with items

4. GET /api/cart
   ├─ Fetch cart + CartItems + Products
   └─ Response: items array with totals

5. PUT /api/cart/update {itemId, quantity: 5}
   └─ Update CartItem quantity

6. DELETE /api/cart?itemId=X
   └─ Remove CartItem
```

### Workflow 3: Complete Checkout

```
STEP 1: Review Cart
  GET /api/cart
  POST /api/checkout/validate {cartItems}

STEP 2: Shipping Address
  Display form, validate client-side

STEP 3: Order Review
  Re-display totals and address summary

STEP 4: Payment
  POST /api/checkout/create-intent
  ├─ Create Order record (status: pending)
  ├─ Create OrderItem records (price snapshot)
  ├─ TODO: Create Stripe payment intent
  └─ Response: {orderId, clientSecret}
  
  Show payment form (Stripe Element)

STEP 5: Complete
  POST /api/checkout/complete {orderId}
  ├─ Verify payment succeeded
  ├─ Update Order status to "paid"
  ├─ Delete all CartItems
  ├─ TODO: Send email
  └─ Response: {orderId, status: "paid"}

STEP 6: Success Page
  Redirect /checkout/success?orderId=XXX
  ├─ Fetch Order data
  ├─ Display confirmation
  └─ Link to home or orders
```

### Workflow 4: Admin Creates Product

```
1. GET /api/admin/categories
   └─ Display category selector

2. POST /api/admin/products {
     name, slug, price, categoryId, description,
     imageUrl, keywords, metaTitle, metaDescription
   }
   ├─ Validate all fields
   ├─ Check slug uniqueness
   └─ Response: created product

3. POST /api/admin/posts (similar for blog)
   ├─ Create post record
   ├─ If publishedAt set: mark published
   ├─ Call revalidatePath('/blog')
   └─ Redirect to post preview
```

### Example cURL Commands

**Signup**:
```bash
curl -X POST http://localhost:3001/api/auth/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3001/api/auth/user/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Get Cart** (with session):
```bash
curl -X GET http://localhost:3001/api/cart \
  -b cookies.txt
```

**Add to Cart**:
```bash
curl -X POST http://localhost:3001/api/cart/add \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "productId": "prod_123",
    "quantity": 1
  }'
```

**Create Product** (Admin):
```bash
curl -X POST http://localhost:3001/api/admin/products \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{
    "name": "Premium Headphones",
    "slug": "premium-headphones",
    "price": "199.99",
    "categoryId": "cat_123",
    "description": "High-quality headphones",
    "imageUrl": "https://..."
  }'
```

---

**Document Status**: Complete  
**Last Updated**: February 5, 2026  
**Next**: Implement Stripe integration based on create-intent API

