import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callPayPalAPI } from '@/lib/paypal';
import { deductStockForOrder } from '@/lib/inventory';
import { sendOrderConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';


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

        const userSession = await prisma.userSession.findUnique({
            where: { sessionToken },
            include: { user: true },
        });

        if (!userSession || !userSession.user) {
            return NextResponse.json({ error: 'User session invalid' }, { status: 401 });
        }

        const { paypalOrderId } = await request.json();
        if (!paypalOrderId) {
            return NextResponse.json({ error: 'PayPal Order ID is required' }, { status: 400 });
        }

        // 1. Capture PayPal Order
        console.log('[PayPal] Starting capture for order', paypalOrderId);

        const captureData = await callPayPalAPI(`/v2/checkout/orders/${paypalOrderId}/capture`, 'POST');

        console.log('[PayPal] Capture response summary', {
            id: (captureData as any)?.id,
            status: (captureData as any)?.status,
            intent: (captureData as any)?.intent,
        });

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

        if (order.userId !== userSession.userId) {
            console.error('[PayPal] Capture attempted by mismatched user', {
                orderId: order.id,
                orderUserId: order.userId,
                sessionUserId: userSession.userId,
            });
            return NextResponse.json({ error: 'Not authorized to capture this order' }, { status: 403 });
        }

        const strictValidation = process.env.PAYPAL_STRICT_VALIDATION === 'true' || process.env.NODE_ENV === 'production';

        try {
            const purchaseUnit = (captureData as any)?.purchase_units?.[0];
            const captureAmount = purchaseUnit?.payments?.captures?.[0]?.amount;
            if (captureAmount?.value && captureAmount?.currency_code) {
                const capturedTotal = parseFloat(captureAmount.value);
                const localTotal = Number(order.total);
                if (captureAmount.currency_code !== 'USD') {
                    console.error('[PayPal] Currency mismatch on capture', {
                        paypalOrderId,
                        currency: captureAmount.currency_code,
                    });
                    if (strictValidation) {
                        return NextResponse.json({ error: 'Payment currency mismatch' }, { status: 400 });
                    }
                }

                if (Number.isFinite(capturedTotal) && Math.abs(capturedTotal - localTotal) > 0.01) {
                    console.error('[PayPal] Amount mismatch on capture', {
                        paypalOrderId,
                        capturedTotal,
                        localTotal,
                    });
                    if (strictValidation) {
                        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
                    }
                }
            }
        } catch (validationError) {
            console.error('[PayPal] Failed to validate capture amount', validationError);
            // Do not fail capture solely on validation parsing error, but log for investigation.
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

        // 5. Send Email
        try {
            // Re-fetch order with full details for email
            const fullOrder = await prisma.order.findUnique({
                where: { id: order.id },
                include: { items: { include: { product: true, variant: true } } }
            });

            if (fullOrder && userSession.user?.email) {
                // Clean casting for type compatibility
                const typedOrder: any = fullOrder;
                await sendOrderConfirmation(typedOrder, userSession.user.email);
            }
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Non-blocking error
        }


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
