import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';
import { resolvePrintifyApiKey } from '@/lib/print-providers/printify/auth';

// GET /api/admin/printify/blueprints/[id]/providers - Get providers for a blueprint
export async function GET(
  req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const blueprintId = parseInt(id);
        if (isNaN(blueprintId)) {
          return NextResponse.json({ error: 'Invalid blueprint ID' }, { status: 400 });
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

    const apiKey = resolvePrintifyApiKey(provider.apiKey);
    const api = new PrintifyAPI(apiKey);
    const providers = await api.getBlueprintProviders(blueprintId);

    return NextResponse.json({ providers });
  } catch (error: any) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
