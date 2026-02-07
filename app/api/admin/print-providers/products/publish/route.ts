import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProductFromPrintful } from '@/lib/print-providers/printful/products';

// POST: Publish a POD product to the store (create local Product)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { externalId, ...productData } = body;

        // externalId is the Printful Product ID (e.g. "792")
        // productData contains { name, price, description, etc. }

        if (!externalId) {
            return NextResponse.json({ error: 'External ID is required' }, { status: 400 });
        }

        const result = await createProductFromPrintful(externalId, productData);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, product: result.product });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
