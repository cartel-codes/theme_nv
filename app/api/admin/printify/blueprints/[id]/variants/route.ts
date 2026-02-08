import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';

// GET /api/admin/printify/blueprints/[id]/variants?providerId=X - Get variants
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blueprintId = parseInt(params.id);
    const providerId = parseInt(req.nextUrl.searchParams.get('providerId') || '');

    if (isNaN(blueprintId) || isNaN(providerId)) {
      return NextResponse.json(
        { error: 'Invalid blueprint ID or provider ID' },
        { status: 400 }
      );
    }

    // Get Printify provider config
    const provider = await prisma.printProvider.findFirst({
      where: { name: 'printify' }
    });

    if (!provider || !provider.apiKey) {
      return NextResponse.json(
        { error: 'Printify not configured' },
        { status: 400 }
      );
    }

    const api = new PrintifyAPI(provider.apiKey);
    const variantsRaw = await api.getBlueprintVariants(blueprintId, providerId);
    const variants = Array.isArray(variantsRaw) ? variantsRaw : (variantsRaw.variants || []);

    return NextResponse.json({ variants });
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}
