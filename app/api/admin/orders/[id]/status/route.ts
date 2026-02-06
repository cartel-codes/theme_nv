
import { updateOrderStatus } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await getSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await request.json();

        // Basic validation
        const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updatedOrder = await updateOrderStatus(params.id, status);

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Failed to update order status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
