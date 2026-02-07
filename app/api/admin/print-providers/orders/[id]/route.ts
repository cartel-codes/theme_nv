import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { confirmPrintfulOrder } from '@/lib/print-providers/printful/orders';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const order = await prisma.printOrder.findUnique({
            where: { id: params.id },
            include: {
                order: true,
                provider: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Cancel specific POD order
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    // Cancellation logic to be implemented using Printful API
    // For now, we just fetch it.
    return NextResponse.json({ status: 'Not implemented yet' }, { status: 501 });
}

// PUT: Confirm/Update
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { action } = await req.json();

        if (action === 'confirm') {
            const printOrder = await prisma.printOrder.findUnique({ where: { id: params.id } });
            if (!printOrder) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            const result = await confirmPrintfulOrder(printOrder.orderId);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
