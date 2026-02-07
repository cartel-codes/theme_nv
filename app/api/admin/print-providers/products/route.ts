import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all synced POD products
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const providerName = searchParams.get('provider'); // Remove default 'printful'

        const skip = (page - 1) * limit;

        const where: any = {};
        if (providerName) {
            where.provider = { name: providerName };
        }

        const [products, total] = await Promise.all([
            prisma.printProduct.findMany({
                where,
                skip,
                take: limit,
                orderBy: { syncedAt: 'desc' },
            }),
            prisma.printProduct.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            products,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
