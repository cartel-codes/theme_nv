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
        const eventType = body?.event_type;

        if (!eventType) {
            console.error('[PayPal Webhook] Missing event_type in payload', body);
            return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
        }

        console.log('[PayPal Webhook] Received event', {
            eventType,
            id: body?.id,
            resourceType: body?.resource_type,
        });

        // 1. Handle Payment Capture
        if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            const resource = body?.resource;

            if (!resource) {
                console.error('[PayPal Webhook] Missing resource on PAYMENT.CAPTURE.COMPLETED', body);
                return NextResponse.json({ error: 'Invalid webhook resource' }, { status: 400 });
            }

            if (resource.status && resource.status !== 'COMPLETED') {
                console.warn('[PayPal Webhook] Capture resource not completed', {
                    id: resource.id,
                    status: resource.status,
                });
            }

            const paypalOrderId = resource.supplementary_data?.related_ids?.order_id || resource.id;

            if (!paypalOrderId) {
                console.error('[PayPal Webhook] Could not determine PayPal order ID from resource', resource);
                return NextResponse.json({ error: 'Missing PayPal order id' }, { status: 400 });
            }

            // Find the local order with all necessary details for email and stock
            const order = await prisma.order.findFirst({
                where: { paymentId: paypalOrderId },
                include: {
                    user: { select: { email: true } },
                    items: {
                        include: {
                            product: true,
                            variant: true
                        }
                    }
                }
            });

            if (!order) {
                console.warn('[PayPal Webhook] Local order not found for PayPal order id', paypalOrderId);
            }

            if (order && order.status !== 'paid') {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'paid',
                        paymentStatus: 'captured',
                    },
                });

                // Send Order Confirmation Email
                try {
                    const { sendOrderConfirmation } = await import('@/lib/email');
                    if (order.user?.email) {
                        await sendOrderConfirmation(order, order.user.email);
                        console.log(`[PayPal Webhook] Sent confirmation email to ${order.user.email}`);
                    }
                } catch (emailError) {
                    console.error('[PayPal Webhook] Failed to send confirmation email', emailError);
                }

                try {
                    await deductStockForOrder(order.id);
                } catch (stockError) {
                    console.error('[PayPal Webhook] Failed to deduct stock for order', {
                        orderId: order.id,
                        error: stockError,
                    });
                }

                console.log(`[PayPal Webhook] Order ${order.id} marked as paid via webhook`);
            }
        } else {
            // Log but gracefully ignore other event types so they don't cause failures.
            console.log('[PayPal Webhook] Unhandled event type received', eventType);
        }

        // Return 200 to acknowledge receipt
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('PayPal Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
