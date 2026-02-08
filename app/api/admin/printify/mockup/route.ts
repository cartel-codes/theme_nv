import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';
import { resolvePrintifyApiKey } from '@/lib/print-providers/printify/auth';

// POST /api/admin/printify/mockup - Generate mockup preview
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { blueprintId, providerId, variantIds, imageId } = body;

    if (!blueprintId || !providerId || !variantIds || !imageId) {
      return NextResponse.json(
        { error: 'Missing required fields: blueprintId, providerId, variantIds, imageId' },
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

    const apiKey = resolvePrintifyApiKey(provider.apiKey);
    const api = new PrintifyAPI(apiKey);
    const mockup = await api.createMockup(
      parseInt(blueprintId),
      parseInt(providerId),
      variantIds.map((id: any) => parseInt(id)),
      imageId
    );

    return NextResponse.json({ mockup });
  } catch (error: any) {
    console.error('Error generating mockup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate mockup' },
      { status: 500 }
    );
  }
}
