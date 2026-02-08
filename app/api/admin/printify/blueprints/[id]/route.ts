import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';

// GET /api/admin/printify/blueprints/[id] - Get blueprint details (providers + variants for first provider)
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
        if (isNaN(blueprintId)) {
            return NextResponse.json({ error: 'Invalid blueprint ID' }, { status: 400 });
        }

        // Get Printify provider config
        const providerConfig = await prisma.printProvider.findFirst({
            where: { name: 'printify' }
        });

        if (!providerConfig || !providerConfig.apiKey) {
            return NextResponse.json(
                { error: 'Printify not configured' },
                { status: 400 }
            );
        }

        const api = new PrintifyAPI(providerConfig.apiKey);

        // 1. Get Full Blueprint Data (for images and info)
        const blueprint = await api.getBlueprint(blueprintId);

        // 2. Get Providers
        const providers = await api.getBlueprintProviders(blueprintId);

        // 3. Get Variants for the first provider by default
        let variants: any[] = [];
        if (providers.length > 0) {
            const variantsRes = await api.getBlueprintVariants(blueprintId, providers[0].id);
            variants = Array.isArray(variantsRes) ? variantsRes : (variantsRes.variants || []);
        }

        return NextResponse.json({
            blueprint,
            providers,
            variants
        });
    } catch (error: any) {
        console.error('Error fetching blueprint details:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch blueprint details' },
            { status: 500 }
        );
    }
}
