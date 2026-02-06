import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deductStockForOrder } from '@/lib/inventory';
import { callPayPalAPI } from '@/lib/paypal';

/**
 * POST /api/webhooks/paypal
 * Handles PayPal Webhook events (e.g., CHECKOUT.ORDER.APPROVED)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const eventType = body.event_type;

        console.log(`Received PayPal Webhook: ${eventType}`);

        // 1. Handle Payment Capture
        if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            const resource = body.resource;
            const paypalOrderId = resource.supplementary_data?.related_ids?.order_id || resource.id;

            // Find the local order
            const order = await prisma.order.findFirst({
                where: { paymentId: paypalOrderId },
            });

            if (order && order.status !== 'paid') {
                // Update order status
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'paid',
                        paymentStatus: 'captured',
                    },
                });

                // Deduct inventory
                await deductStockForOrder(order.id);

                console.log(`Order ${order.id} marked as paid via Webhook`);
            }
        }

        // Return 200 to acknowledge receipt
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('PayPal Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
