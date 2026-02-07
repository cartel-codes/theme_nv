import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPrintfulOrder, confirmPrintfulOrder } from '@/lib/print-providers/printful/orders';

// GET: List all POD orders
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const status = searchParams.get('status');

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const total = await prisma.printOrder.count({ where });
        const orders = await prisma.printOrder.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            include: {
                order: {
                    select: { orderNumber: true, user: { select: { email: true } } }
                },
                provider: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            data: orders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Manually create a POD order
export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const result = await createPrintfulOrder(orderId);

        if (!result.success) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
