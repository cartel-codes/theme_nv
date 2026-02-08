import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProductFromPrintify } from '@/lib/print-providers/printify/products';

// POST: Publish a POD product to the store (create local Product)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { externalId, provider, ...productData } = body;

        if (!externalId) {
            return NextResponse.json({ error: 'External ID is required' }, { status: 400 });
        }

        // 1. Detect Provider if not provided
        let targetProvider = provider;
        if (!targetProvider) {
            const printProduct = await prisma.printProduct.findFirst({
                where: { externalId },
                include: { provider: true }
            });
            targetProvider = printProduct?.provider.name;
        }

        if (targetProvider && targetProvider !== 'printify') {
            return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
        }

        const result = await createProductFromPrintify(externalId, productData);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, product: result.product });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
