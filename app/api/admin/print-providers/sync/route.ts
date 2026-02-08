import { NextResponse } from 'next/server';
import { syncPrintifyProducts } from '@/lib/print-providers/printify/products';

export async function POST(request: Request) {
  try {
    const { provider } = await request.json().catch(() => ({ provider: 'printify' }));

    if (provider && provider !== 'printify') {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const result = await syncPrintifyProducts();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error || 'Sync failed' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Keep GET for backward compatibility if needed, or simple trigger
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (provider && provider !== 'printify') {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  const result = await syncPrintifyProducts();
  return NextResponse.json(result);
}
