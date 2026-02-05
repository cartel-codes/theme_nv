# Novraux Architecture & Database Guide

This document provides a technical overview of the Novraux e-commerce system, including the database schema, authentication flows, and shopping cart logic.

---

## 🏗️ System Architecture (UML)

### **Class Diagram (Data Models)**
The following diagram illustrates the core data entities and their relationships.

```mermaid
classDiagram
    User "1" -- "0..1" Cart : has
    User "1" -- "0..*" UserSession : owns
    User "1" -- "0..*" UserAuditLog : records
    Cart "1" -- "0..*" CartItem : contains
    Product "1" -- "0..*" CartItem : added_to
    Product "1" -- "0..*" ProductImage : has
    Product "1" -- "0..1" Category : belongs_to
    
    class User {
        +String id
        +String email
        +String password
        +String firstName
        +String lastName
        +Boolean isActive
    }
    
    class Cart {
        +String id
        +String sessionId
        +String userId
        +DateTime updatedAt
    }
    
    class CartItem {
        +String id
        +String cartId
        +String productId
        +Int quantity
    }
    
    class Product {
        +String id
        +String name
        +String slug
        +Decimal price
        +String categoryId
    }
    
    class Category {
        +String id
        +String name
        +String slug
    }
```

### **Authentication & Cart Flow**
This sequence diagram shows how guest carts are merged into user accounts upon login.

```mermaid
sequenceDiagram
    participant Guest as Guest User
    participant App as Frontend Application
    participant API as Cart API (/api/cart)
    participant DB as PostgreSQL Database
    
    Guest->>App: Add Item to Cart
    App->>API: POST /api/cart (productId)
    API->>DB: Check for cart_session_id cookie
    DB-->>API: No cart found
    API->>DB: CREATE Cart (sessionId=XYZ)
    API->>DB: CREATE CartItem
    DB-->>Guest: Set cart_session_id cookie
    
    Note over Guest,DB: User Logins
    
    Guest->>App: Log In
    App->>API: GET /api/cart (after login)
    API->>DB: Find session by userSession cookie
    API->>DB: Find cart by userId
    API->>DB: Find cart by guest sessionId (XYZ)
    Note right of API: Merging logic triggered
    API->>DB: Move CartItems from XYZ to userCart
    API->>DB: DELETE Guest Cart (XYZ)
    DB-->>Guest: Return Merged Cart Items
```

---

## 📊 Database Schema (Prisma)

The project uses **Prisma** with a **PostgreSQL** database. Below is the breakdown of the most critical models.

### **1. Product Models**
- **`Product`**: Stores name, price, description, and SEO metadata.
- **`ProductImage`**: Linked to products, supports multiple images with an order and primary flag.
- **`Category`**: Hierarchical organization for products.

### **2. Commerce Models**
- **`Cart`**: Unique by `sessionId` (for guests) and `userId` (for logged-in users).
- **`CartItem`**: Junction table between `Cart` and `Product`, tracking quantities.

### **3. User & Auth Models**
- **`User`**: Main customer account table.
- **`UserSession`**: Tracks active login tokens, IP addresses, and user agents.
- **`UserAuditLog`**: Security tracking for all authentication events.
- **`AdminUser` / `AdminSession`**: Separate tables for the backoffice management staff.

---

## 🔒 Security Summary
- **Password Hashing**: All passwords are encrypted using `bcryptjs` with 10 salt rounds.
- **Session Tokens**: 32-byte hex strings generated via `crypto.randomBytes`.
- **Cookies**: HTTP-Only, Secure (in production), and SameSite=Lax to prevent CSRF.
- **Middleware**: Server-side route protection for both `/admin` and `/account` segments.
