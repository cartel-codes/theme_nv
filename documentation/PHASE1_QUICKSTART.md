# Novraux POD Implementation - Phase 1 Quick Start

## Phase 1 Overview (Weeks 1-2)

This phase focuses on completing the order-to-fulfillment pipeline with Printful.

### What We're Building
```
Customer Places Order
         ↓
Payment Processed
         ↓
Order Created in Printful ← We'll build this
         ↓
Printful Manufactures
         ↓
Webhook Updates Status ← We'll build this
         ↓
Customer Receives Tracking
         ↓
Customer Gets Product
```

---

## Task 1: Webhook Receiver Setup

### 1.1 Create Webhook Endpoint

**File**: `app/api/webhooks/printful/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-printful-hmac-sha256') || '';
    const secret = process.env.PRINTFUL_WEBHOOK_SECRET || '';

    // Verify signature
    if (!verifyWebhookSignature(body, signature, secret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    // Log webhook
    await prisma.printWebhookLog.create({
      data: {
        event: type,
        payload: event,
        processed: false,
      },
    });

    // Handle different event types
    switch (type) {
      case 'order.confirmed':
        await handleOrderConfirmed(data);
        break;
      case 'order.shipment.created':
        await handleShipmentCreated(data);
        break;
      case 'order.failed':
        await handleOrderFailed(data);
        break;
      case 'order.canceled':
        await handleOrderCanceled(data);
        break;
      default:
        console.log('Unhandled event type:', type);
    }

    // Mark as processed
    await prisma.printWebhookLog.updateMany({
      where: { event: type, processed: false },
      data: { processed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Handler: Order Confirmed
async function handleOrderConfirmed(data: any) {
  const printOrder = await prisma.printOrder.findUnique({
    where: { externalOrderId: data.id.toString() },
    include: { order: true },
  });

  if (!printOrder) {
    console.warn(`PrintOrder not found for Printful ID: ${data.id}`);
    return;
  }

  // Update order status
  await prisma.order.update({
    where: { id: printOrder.orderId },
    data: {
      status: 'confirmed',
      updatedAt: new Date(),
    },
  });

  // Send customer email
  await sendEmail({
    to: printOrder.order.customerEmail,
    template: 'order-confirmed',
    data: {
      orderNumber: printOrder.order.orderNumber,
      estimatedShip: data.estimated_ship_date,
    },
  });
}

// Handler: Shipment Created
async function handleShipmentCreated(data: any) {
  const printOrder = await prisma.printOrder.update({
    where: { externalOrderId: data.id.toString() },
    data: {
      status: 'shipped',
      trackingUrl: data.tracking_url,
      estimatedDeliv: new Date(data.estimated_delivery_date),
      updatedAt: new Date(),
    },
    include: { order: true },
  });

  // Send customer tracking email
  await sendEmail({
    to: printOrder.order.customerEmail,
    template: 'order-shipped',
    data: {
      orderNumber: printOrder.order.orderNumber,
      trackingUrl: data.tracking_url,
      carrier: data.carrier,
    },
  });
}

// Handler: Order Failed
async function handleOrderFailed(data: any) {
  const printOrder = await prisma.printOrder.update({
    where: { externalOrderId: data.id.toString() },
    data: {
      status: 'failed',
      updatedAt: new Date(),
    },
    include: { order: true },
  });

  // Send alert to customer
  await sendEmail({
    to: printOrder.order.customerEmail,
    template: 'order-failed',
    data: {
      orderNumber: printOrder.order.orderNumber,
      reason: data.error?.message,
    },
  });

  // Notify admin
  console.error(`Order failed: ${data.id} - ${data.error?.message}`);
}

// Handler: Order Canceled
async function handleOrderCanceled(data: any) {
  await prisma.printOrder.update({
    where: { externalOrderId: data.id.toString() },
    data: { status: 'canceled' },
  });
}

// Helper: Send Email (integrate with your email provider)
async function sendEmail(options: any) {
  try {
    // TODO: Implement email sending (SendGrid, Resend, etc.)
    console.log('Email would be sent:', options);
  } catch (error) {
    console.error('Email error:', error);
  }
}
```

### 1.2 Update Environment Variables

Add to `.env.local`:
```env
# Already there:
PRINTFUL_API_KEY=gH5JE4ybjX2BnvUer2s2dqpaqpjSIAeKWUp5upxI

# Add the webhook secret (generated earlier)
PRINTFUL_WEBHOOK_SECRET=your_webhook_secret
```

### 1.3 Register Webhook with Printful

**Manual via API**:
```bash
curl -X POST https://api.printful.com/webhooks \
  -H "Authorization: Bearer gH5JE4ybjX2BnvUer2s2dqpaqpjSIAeKWUp5upxI" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/webhooks/printful",
    "event": "*"
  }'
```

**Webhook Events to Enable**:
- `order.confirmed`
- `order.shipment.created`
- `order.failed`
- `order.canceled`

### 1.4 Test Webhook Receiver

**Create test endpoint** `app/api/webhooks/printful/test/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET || '';
  const body = JSON.stringify({
    type: 'order.confirmed',
    data: {
      id: 12345,
      status: 'confirmed',
      estimated_ship_date: '2026-02-14',
    },
  });

  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Send test webhook
  const res = await fetch('http://localhost:3001/api/webhooks/printful', {
    method: 'POST',
    headers: {
      'x-printful-hmac-sha256': signature,
      'Content-Type': 'application/json',
    },
    body,
  });

  return NextResponse.json(await res.json());
}
```

---

## Task 2: Order Creation in Printful

### 2.1 Create Order API Client Method

**File**: `lib/print-providers/printful/orders.ts`

```typescript
import { PrintfulAPI } from './api';
import { prisma } from '@/lib/prisma';

const printfulAPI = new PrintfulAPI(process.env.PRINTFUL_API_KEY || '');

export interface PrintfulOrderItem {
  variant_id: number;  // Printful variant ID
  quantity: number;
  files?: Array<{
    type: string;     // "embroidery", "screen_print", "dtf"
    url: string;      // Design file URL
    options?: Record<string, any>;
  }>;
}

export interface PrintfulOrderData {
  items: PrintfulOrderItem[];
  recipient: {
    name: string;
    address1: string;
    city: string;
    state_code: string;
    zip_code: string;
    country_code: string;
    phone?: string;
    email?: string;
  };
}

export async function createPrintfulOrder(
  orderData: PrintfulOrderData
): Promise<{ id: number; uid: string; status: string }> {
  try {
    const response = await printfulAPI.client.post('/orders', {
      external_id: `order_${Date.now()}`,
      shipping: 'STANDARD',
      items: orderData.items,
      recipient: orderData.recipient,
    });

    if (!response.data.result) {
      throw new Error('Invalid Printful response');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error creating Printful order:', error.response?.data);
    throw new Error(
      `Failed to create order: ${error.response?.data?.error?.message || error.message}`
    );
  }
}

export async function confirmPrintfulOrder(externalOrderId: string) {
  try {
    const response = await printfulAPI.client.post(
      `/orders/${externalOrderId}/confirm`
    );
    return response.data.result;
  } catch (error: any) {
    console.error('Error confirming order:', error);
    throw error;
  }
}

export async function cancelPrintfulOrder(externalOrderId: string) {
  try {
    const response = await printfulAPI.client.delete(
      `/orders/${externalOrderId}`
    );
    return response.data.result;
  } catch (error: any) {
    console.error('Error canceling order:', error);
    throw error;
  }
}

export async function getPrintfulOrderStatus(externalOrderId: string) {
  try {
    const response = await printfulAPI.client.get(`/orders/${externalOrderId}`);
    return response.data.result;
  } catch (error: any) {
    console.error('Error getting order status:', error);
    throw error;
  }
}
```

### 2.2 API Endpoint to Create Order

**File**: `app/api/orders/printful/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPrintfulOrder, confirmPrintfulOrder } from '@/lib/print-providers/printful/orders';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already in Printful
    const existingPrintOrder = await prisma.printOrder.findFirst({
      where: { orderId },
    });

    if (existingPrintOrder) {
      return NextResponse.json(
        { error: 'Order already sent to Printful' },
        { status: 400 }
      );
    }

    // Build Printful order
    const printfulItems = order.items.map((item: any) => ({
      variant_id: parseInt(item.variant.printVariantId),
      quantity: item.quantity,
      files: item.designUrls?.map((url: string) => ({
        type: 'dtf', // Direct-to-fabric
        url,
      })) || [],
    }));

    const printfulOrderData = {
      items: printfulItems,
      recipient: {
        name: order.customer.name,
        address1: order.shippingAddress,
        city: order.shippingCity,
        state_code: order.shippingState,
        zip_code: order.shippingZip,
        country_code: 'US',
        email: order.customer.email,
      },
    };

    // Create order in Printful
    console.log('Creating Printful order...', printfulOrderData);
    const printfulOrder = await createPrintfulOrder(printfulOrderData);

    // Store in database
    const savedPrintOrder = await prisma.printOrder.create({
      data: {
        orderId,
        providerId: (await prisma.printProvider.findFirst({
          where: { name: 'printful' },
        }))?.id || '',
        externalOrderId: printfulOrder.id.toString(),
        status: 'draft',
        items: printfulOrderData,
      },
    });

    // Confirm order (auto-submit for production)
    if (process.env.PRINTFUL_AUTO_CONFIRM === 'true') {
      await confirmPrintfulOrder(printfulOrder.id.toString());
      
      await prisma.printOrder.update({
        where: { id: savedPrintOrder.id },
        data: { status: 'confirmed' },
      });
    }

    return NextResponse.json({
      success: true,
      printOrderId: savedPrintOrder.id,
      externalOrderId: printfulOrder.id,
      status: printfulOrder.status,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 2.3 Trigger Order Creation on Checkout

**In your checkout handler**:

```typescript
// After payment successful:

// 1. Create order in database
const order = await prisma.order.create({
  data: {
    customerId: userId,
    items: {
      createMany: {
        data: cartItems, // From cart
      },
    },
    status: 'pending',
    total: totalAmount,
    // ... other details
  },
});

// 2. Send to Printful
const response = await fetch('/api/orders/printful/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: order.id }),
});

if (!response.ok) {
  // Handle error: refund payment, notify customer
  throw new Error('Failed to process order');
}

// 3. Clear cart
// 4. Redirect to order confirmation
```

---

## Task 3: Design Upload System

### 3.1 Design Upload Endpoint

**File**: `app/api/admin/designs/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const placement = formData.get('placement') as string; // "front", "back", etc.

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (PDF, PNG, JPG, etc.)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use PNG, JPG, or PDF' },
        { status: 400 }
      );
    }

    // Upload to R2
    const fileName = `designs/${productId}/${placement}-${Date.now()}-${file.name}`;
    const url = await uploadToR2(file, fileName);

    // Save to database
    const design = await prisma.productDesign.create({
      data: {
        productId,
        name: file.name,
        fileUrl: url,
        placement,
        fileSize: file.size,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      design: {
        id: design.id,
        url: design.fileUrl,
        placement: design.placement,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 3.2 Design Management UI

**File**: `components/admin/DesignUploader.tsx`

```tsx
'use client';

import { useState } from 'react';

export function DesignUploader({ productId }: { productId: string }) {
  const [uploading, setUploading] = useState(false);
  const [designs, setDesigns] = useState<any[]>([]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);
      formData.append('placement', 'front');

      const res = await fetch('/api/admin/designs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setDesigns([...designs, data.design]);
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Upload Design</h3>
      
      <input
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={handleUpload}
        disabled={uploading}
        className="border rounded p-2 w-full"
      />

      {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}

      <div className="mt-4 space-y-2">
        {designs.map((design) => (
          <div key={design.id} className="flex items-center justify-between border rounded p-2">
            <span>{design.placement}: {design.name}</span>
            <img src={design.url} alt="" className="w-12 h-12 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 4: Update Order Model

Add to Prisma schema:

```prisma
model ProductDesign {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  
  name      String
  fileUrl   String
  placement String   // "front", "back", "sleeve", etc.
  fileSize  Int
  
  uploadedAt DateTime @default(now())
  
  @@index([productId])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_product_designs
```

---

## Testing Checklist

- [ ] Webhook endpoint created and working
- [ ] Can receive test webhook requests
- [ ] Order creation endpoint created
- [ ] Design upload working
- [ ] Files storing in R2
- [ ] Database storing design records
- [ ] Order status updates from Printful webhooks
- [ ] Customer emails sent on status changes

---

## Next: Phase 2 Preparation

- Start planning product CRUD interface
- Design product management page layout
- Plan brand management system
- Prepare pricing management logic

---

## Quick Reference

### Key Files Created
1. `app/api/webhooks/printful/route.ts` - Webhook receiver
2. `lib/print-providers/printful/orders.ts` - Order creation logic
3. `app/api/orders/printful/create/route.ts` - Order creation endpoint
4. `app/api/admin/designs/upload/route.ts` - Design upload
5. `components/admin/DesignUploader.tsx` - Upload UI

### Environment Variables Needed
- `PRINTFUL_API_KEY` ✅ (already set)
- `PRINTFUL_WEBHOOK_SECRET` ✅ (already set)
- `PRINTFUL_AUTO_CONFIRM` (set to "true" for auto-submission)
- `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` (if not already set)

### Database Migrations Needed
```bash
npx prisma migrate dev --name add_product_designs
```

---

## Support & Debugging

**Check webhook logs**:
```typescript
const logs = await prisma.printWebhookLog.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

**Monitor order status**:
```typescript
const orders = await prisma.printOrder.findMany({
  include: { order: true },
});
```

**Test API locally**:
```bash
curl -X POST http://localhost:3001/api/webhooks/printful/test
```
