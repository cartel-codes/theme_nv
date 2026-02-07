import { NextRequest, NextResponse } from 'next/server';
import { PrintfulAPI } from '@/lib/print-providers/printful/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey } = body;

    if (!provider) {
      return NextResponse.json({ 
        success: false, 
        error: 'Provider is required' 
      }, { status: 400 });
    }

    if (provider === 'printful') {
      const key = apiKey || process.env.PRINTFUL_API_KEY;
      
      if (!key) {
        return NextResponse.json({ 
          success: false, 
          error: 'API key is required' 
        }, { status: 400 });
      }

      const api = new PrintfulAPI(key);
      const result = await api.testConnection();
      
      return NextResponse.json(result);
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Unsupported provider. Currently only "printful" is supported.' 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Print provider test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Test failed'
    }, { status: 500 });
  }
}

// GET endpoint to check current configuration
export async function GET() {
  try {
    const hasApiKey = !!process.env.PRINTFUL_API_KEY;
    const hasWebhookSecret = !!process.env.PRINTFUL_WEBHOOK_SECRET;
    const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;

    return NextResponse.json({
      configured: hasApiKey && hasWebhookSecret && hasEncryptionKey,
      details: {
        apiKey: hasApiKey ? '✓ Configured' : '✗ Missing',
        webhookSecret: hasWebhookSecret ? '✓ Configured' : '✗ Missing',
        encryptionKey: hasEncryptionKey ? '✓ Configured' : '✗ Missing',
      },
      provider: process.env.DEFAULT_PRINT_PROVIDER || 'printful'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
