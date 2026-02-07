import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const variants = await prisma.productVariant.findMany({
            where: { productId: id },
            include: {
                inventory: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(variants);
    } catch (error) {
        console.error('Failed to fetch variants:', error);
        return NextResponse.json(
            { error: 'Failed to fetch variants' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, value, sku, price, stock } = body;

        // Validate request
        if (!name || !value || !sku) {
            return NextResponse.json(
                { error: 'Name, value, and SKU are required' },
                { status: 400 }
            );
        }

        // Check if SKU exists
        const existingSku = await prisma.productVariant.findUnique({
            where: { sku },
        });

        if (existingSku) {
            return NextResponse.json(
                { error: 'SKU already exists' },
                { status: 400 }
            );
        }

        // Create warehouse if missing (simple fallback)
        let warehouse = await prisma.warehouse.findFirst({ where: { name: 'Main Warehouse' } });
        if (!warehouse) {
            warehouse = await prisma.warehouse.create({
                data: { name: 'Main Warehouse', isActive: true }
            });
        }

        // Create variant with inventory
        const variant = await prisma.productVariant.create({
            data: {
                productId: id,
                name,
                value,
                sku,
                price: price ? parseFloat(price) : null,
                inventory: {
                    create: {
                        productId: id,
                        warehouseId: warehouse.id,
                        quantity: stock ? parseInt(stock) : 0,
                    },
                },
            },
            include: {
                inventory: true,
            },
        });

        return NextResponse.json(variant, { status: 201 });
    } catch (error) {
        console.error('Failed to create variant:', error);
        return NextResponse.json(
            { error: 'Failed to create variant' },
            { status: 500 }
        );
    }
}
