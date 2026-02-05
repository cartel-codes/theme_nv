import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        const { variantId } = await params;
        const body = await request.json();
        const { name, value, sku, price, stock } = body;

        // Check if variant exists
        const existingVariant = await prisma.productVariant.findUnique({
            where: { id: variantId },
        });

        if (!existingVariant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
        }

        // Check SKU uniqueness if changed
        if (sku && sku !== existingVariant.sku) {
            const duplicateSku = await prisma.productVariant.findUnique({
                where: { sku },
            });
            if (duplicateSku) {
                return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
            }
        }

        // Update variant
        const variant = await prisma.productVariant.update({
            where: { id: variantId },
            data: {
                ...(name && { name }),
                ...(value && { value }),
                ...(sku && { sku }),
                ...(price !== undefined && { price: price ? parseFloat(price) : null }),
                // Update inventory if stock provided
                ...(stock !== undefined && {
                    inventory: {
                        upsert: {
                            create: {
                                productId: existingVariant.productId,
                                quantity: parseInt(stock),
                            },
                            update: {
                                quantity: parseInt(stock),
                            },
                        },
                    },
                }),
            },
            include: {
                inventory: true,
            },
        });

        return NextResponse.json(variant);
    } catch (error) {
        console.error('Failed to update variant:', error);
        return NextResponse.json(
            { error: 'Failed to update variant' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        const { variantId } = await params;

        await prisma.productVariant.delete({
            where: { id: variantId },
        });

        return NextResponse.json({ message: 'Variant deleted successfully' });
    } catch (error) {
        console.error('Failed to delete variant:', error);
        return NextResponse.json(
            { error: 'Failed to delete variant' },
            { status: 500 }
        );
    }
}
