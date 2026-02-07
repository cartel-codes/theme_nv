// Quick Start Implementation Guide for Print-on-Demand
// Follow these steps to integrate Printful into Novraux

/**
 * STEP 1: Install Dependencies
 * ----------------------------
 * Run in terminal:
 * npm install axios form-data
 * npm install --save-dev @types/node
 */

/**
 * STEP 2: Environment Variables
 * ------------------------------
 * Add to .env.local:
 * 
 * PRINTFUL_API_KEY=your_api_key_here
 * PRINTFUL_WEBHOOK_SECRET=your_webhook_secret
 * ENCRYPTION_KEY=generate_a_random_32_byte_hex_string
 */

/**
 * STEP 3: Database Migration
 * ---------------------------
 * 
 * Method A: Copy the schema additions
 * 1. Open: prisma/print-on-demand.schema.prisma
 * 2. Copy the 4 new models (PrintProvider, PrintProduct, PrintOrder, PrintWebhookLog)
 * 3. Paste into your main prisma/schema.prisma
 * 4. Add the modifications to Product, Order, OrderItem models
 * 5. Run: npx prisma migrate dev --name add_print_on_demand
 * 6. Run: npx prisma generate
 * 
 * Method B: Use the complete schema file as reference
 */

/**
 * STEP 4: Create Directory Structure
 * -----------------------------------
 * Create these files:
 */

// lib/print-providers/types.ts
export interface PrintProvider {
  id: string;
  name: 'printful' | 'printify';
  apiKey: string;
}

export interface PrintProduct {
  id: string;
  externalId: string;
  name: string;
  variants: any[];
}

export interface PrintOrderItem {
  variantId: string;
  quantity: number;
  designUrl?: string;
}

export interface CreateOrderData {
  recipient: {
    name: string;
    email?: string;
    address1: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
  items: PrintOrderItem[];
}

/**
 * STEP 5: API Client Implementation
 * ----------------------------------
 * Create: lib/print-providers/printful/api.ts
 */

// Minimal Printful API Client (expand as needed)
import axios, { AxiosInstance } from 'axios';

export class PrintfulAPI {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.printful.com',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Test connection
  async testConnection() {
    try {
      const { data } = await this.client.get('/stores');
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get catalog products
  async getProducts() {
    const { data } = await this.client.get('/products');
    return data.result;
  }

  // Get product details
  async getProduct(id: number) {
    const { data } = await this.client.get(`/products/${id}`);
    return data.result;
  }

  // Create order
  async createOrder(orderData: any) {
    const { data } = await this.client.post('/orders', orderData);
    return data.result;
  }

  // Confirm order (start production)
  async confirmOrder(orderId: string) {
    const { data } = await this.client.post(`/orders/@${orderId}/confirm`);
    return data.result;
  }

  // Get order status
  async getOrder(orderId: string) {
    const { data } = await this.client.get(`/orders/@${orderId}`);
    return data.result;
  }
}

/**
 * STEP 6: Create API Test Endpoint
 * ---------------------------------
 * Create: app/api/admin/print-providers/test/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrintfulAPI } from '@/lib/print-providers/printful/api';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (provider === 'printful') {
      const api = new PrintfulAPI(apiKey);
      const result = await api.testConnection();
      
      return NextResponse.json(result);
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Unsupported provider' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * STEP 7: Create Basic Admin Configuration Page
 * ----------------------------------------------
 * Create: app/admin/print-providers/page.tsx
 */

'use client';

import { useState } from 'react';

export default function PrintProvidersPage() {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function testConnection() {
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/print-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'printful', 
          apiKey 
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Print-on-Demand Configuration</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Printful API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Printful API key..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            Get your API key from: Printful Dashboard → Store Settings → API
          </p>
        </div>

        <button
          onClick={testConnection}
          disabled={!apiKey || testing}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {testing ? 'Testing Connection...' : 'Test Connection'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-medium mb-2 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Connection Successful!' : '❌ Connection Failed'}
            </h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {result?.success && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Save this API key in your environment variables</li>
              <li>Sync product catalog</li>
              <li>Set up webhooks</li>
              <li>Test order creation</li>
            </ol>
          </div>
        )}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">📚 Documentation</h3>
        <p className="text-sm text-yellow-800">
          See PRINT_ON_DEMAND_INTEGRATION_RESEARCH.md for complete implementation guide
        </p>
      </div>
    </div>
  );
}

/**
 * STEP 8: Testing Checklist
 * --------------------------
 * 
 * ✅ 1. Environment variables set
 * ✅ 2. Database migrated successfully
 * ✅ 3. API client created
 * ✅ 4. Test endpoint working
 * ✅ 5. Admin page accessible
 * ✅ 6. API connection test successful
 * 
 * Next: Implement product sync, order creation, and webhooks
 */

/**
 * STEP 9: Common Issues & Solutions
 * ----------------------------------
 * 
 * Issue: "Invalid API key"
 * Solution: Check that API key is correct and has no extra spaces
 * 
 * Issue: "Connection timeout"
 * Solution: Check firewall settings, increase timeout value
 * 
 * Issue: "Database error"
 * Solution: Ensure migration ran successfully with `npx prisma migrate status`
 * 
 * Issue: "Module not found"
 * Solution: Restart Next.js dev server after adding new files
 */

/**
 * SAMPLE .env.local FILE
 * ----------------------
 * 
 * # Existing variables
 * DATABASE_URL="postgresql://..."
 * DIRECT_URL="postgresql://..."
 * 
 * # Print-on-Demand
 * PRINTFUL_API_KEY="your_api_key_from_printful_dashboard"
 * PRINTFUL_WEBHOOK_SECRET="generate_random_string"
 * ENCRYPTION_KEY="generate_32_byte_hex_with_node_crypto"
 * 
 * # Optional: Printify (if using both)
 * PRINTIFY_API_TOKEN="your_printify_token"
 * PRINTIFY_SHOP_ID="your_shop_id"
 */

/**
 * TO GENERATE ENCRYPTION KEY:
 * ----------------------------
 * Run in Node.js:
 * 
 * const crypto = require('crypto');
 * console.log(crypto.randomBytes(32).toString('hex'));
 */

export {};
