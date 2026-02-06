import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callPayPalAPI } from '@/lib/paypal';
import { deductStockForOrder } from '@/lib/inventory';

/**
 * POST /api/checkout/paypal/capture-order
 * 1. Captures the payment on PayPal
 * 2. Updates the local order status to 'paid'
 */
export async function POST(request: NextRequest) {
    try {
        const sessionToken = request.cookies.get('userSession')?.value;
        if (!sessionToken) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        const { paypalOrderId } = await request.json();
        if (!paypalOrderId) {
            return NextResponse.json({ error: 'PayPal Order ID is required' }, { status: 400 });
        }

        // 1. Capture PayPal Order
        const captureData = await callPayPalAPI(`/v2/checkout/orders/${paypalOrderId}/capture`, 'POST');

        if (captureData.status !== 'COMPLETED') {
            return NextResponse.json({
                error: 'PayPal payment not completed',
                details: captureData
            }, { status: 400 });
        }

        // 2. Find local order
        const order = await prisma.order.findFirst({
            where: { paymentId: paypalOrderId },
        });

        if (!order) {
            return NextResponse.json({ error: 'Local order not found' }, { status: 404 });
        }

        // 3. Update Order Status
        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'paid',
                paymentStatus: 'captured',
            }
        });

        // 4. Deduct Inventory
        try {
            await deductStockForOrder(order.id);
        } catch (stockError) {
            console.error('Failed to deduct stock:', stockError);
            // We don't want to fail the whole response if stock deduction fails 
            // because the payment WAS captured. We should log it and handle manually.
        }

        // TODO: Trigger Email here

        return NextResponse.json({
            success: true,
            orderId: updatedOrder.id,
            status: updatedOrder.status
        });

    } catch (error) {
        console.error('PayPal Order Capture Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to capture PayPal order' },
            { status: 500 }
        );
    }
}
