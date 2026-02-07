import { NextRequest, NextResponse } from 'next/server';
import { syncPrintfulProducts, getPrintfulProducts } from '@/lib/print-providers/printful/products';

// GET: List synced products with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '5', 10);

    const result = await getPrintfulProducts(page, pageSize);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET /sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Trigger sync
export async function POST() {
  try {
    console.log('Starting Printful product sync...');
    const result = await syncPrintfulProducts();
    
    // Return summary with message
    return NextResponse.json({
      success: result.success,
      error: result.error,
      count: result.count || 0,
      total: result.total,
      totalAvailable: result.totalAvailable,
      message: result.message || (result.success 
        ? `Successfully synced ${result.count} products from Printful`
        : 'Failed to sync products'),
    });
  } catch (error: any) {
    console.error('POST /sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        count: 0,
      },
      { status: 500 }
    );
  }
}
