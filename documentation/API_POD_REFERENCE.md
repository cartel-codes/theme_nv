# Print-on-Demand (POD) API Reference

This document outlines the API endpoints created for the Printful integration (Phase 4).

## Base URL
`/api/admin/print-providers`

## Authentication
All admin endpoints require an authenticated admin session.

---

## ⚙️ Configuration

### Get Configuration
**GET** `/config`

Checks if the POD provider is configured.

**Response:**
```json
{
  "configured": true,
  "provider": {
    "name": "printful",
    "isActive": true,
    "hasApiKey": true
  }
}
```

### Save Configuration
**POST** `/config`

Saves the provider's API Key (encrypts it before storage).

**Body:**
```json
{
  "apiKey": "your_printful_api_key"
}
```

**Response:**
```json
{
  "success": true,
  "provider": { "name": "printful", "isActive": true }
}
```

---

## 🔄 Product Sync

### Trigger Sync
**POST** `/sync`

Triggers a sync of products from Printful to the local database.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "message": "Successfully synced 5/10 products..."
}
```

---

## 👕 Products

### List Synced Products
**GET** `/products`

Returns a paginated list of products synced from the POD provider.

**Query Params:**
- `page`: Page number (default 1)
- `limit`: Items per page (default 50)

**Response:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "T-Shirt",
      "externalId": "792",
      "mockupUrls": { "main": "..." }
    }
  ],
  "pagination": { ... }
}
```

### Publish Product
**POST** `/products/publish`

Creates a local `Product` record from a synced POD product, making it available in your store.

**Body:**
```json
{
  "externalId": "792",
  "name": "My Cool T-Shirt",
  "price": 29.99,
  "description": "..."
}
```

**Response:**
```json
{
  "success": true,
  "product": { ... }
}
```

---

## 📦 Orders

### List Orders
**GET** `/orders`

Returns a paginated list of POD orders.

**Query Params:**
- `page`: Page number (default 1)
- `limit`: Items per page (default 50)
- `status`: Filter by status (optional)

**Response:**
```json
{
  "data": [ ... ],
  "pagination": { "total": 100, "page": 1, "limit": 50 }
}
```

### Create Order
**POST** `/orders`

Manually triggers the creation of a POD order for a given local order ID.

**Body:**
```json
{
  "orderId": "local_order_id"
}
```

### Get Order Details
**GET** `/orders/[id]`

Returns details for a specific POD order record.

### Confirm Order
**PUT** `/orders/[id]`

Confirms a draft order at Printful.

**Body:**
```json
{
  "action": "confirm"
}
```

---

## 🪝 Webhooks

### Handle Webhook
**POST** `/api/webhooks/printful`

Public endpoint for receiving Printful events (e.g., `package_shipped`, `order_failed`).
