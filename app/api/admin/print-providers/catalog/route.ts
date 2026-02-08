
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrintifyAPI } from '@/lib/print-providers/printify/api';
import { resolvePrintifyApiKey } from '@/lib/print-providers/printify/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const blueprintId = searchParams.get('blueprint_id');
        const providerId = searchParams.get('provider_id');

        // Get Credentials
        const provider = await prisma.printProvider.findFirst({ where: { name: 'printify' } });
        if (!provider || !provider.apiKey) {
            return NextResponse.json({ error: 'Printify not configured' }, { status: 400 });
        }

        const apiKey = resolvePrintifyApiKey(provider.apiKey);
        const api = new PrintifyAPI(apiKey);

        let data;
        switch (type) {
            case 'blueprints':
                data = await api.getBlueprints();
                break;
            case 'providers':
                if (!blueprintId) return NextResponse.json({ error: 'Missing blueprint_id' }, { status: 400 });
                data = await api.getBlueprintProviders(Number(blueprintId));
                break;
            case 'variants':
                if (!blueprintId || !providerId) return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
                data = await api.getBlueprintVariants(Number(blueprintId), Number(providerId));
                break;
            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Catalog API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
