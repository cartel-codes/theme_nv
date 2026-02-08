import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';
import { resolvePrintifyApiKey } from '@/lib/print-providers/printify/auth';

// GET /api/admin/printify/blueprints - Get all Printify product types
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const blueprints = await api.getBlueprints();

    return NextResponse.json({ blueprints });
  } catch (error: any) {
    console.error('Error fetching blueprints:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blueprints' },
      { status: 500 }
    );
  }
}
