import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/checkout/complete
 * Completes the payment and order
 * 
 * Request body:
 * {
 *   orderId: string,
 *   paymentId: string  // Stripe payment intent ID
 * }
 * 
 * Response:
 * {
 *   orderId: string,
 *   status: string,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated
        const sessionToken = request.cookies.get('sessionToken')?.value;
        if (!sessionToken) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { orderId, paymentId, paymentStatus } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Fetch the order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, items: { include: { product: true } } },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Verify the order belongs to the current user
        const userSession = await prisma.userSession.findUnique({
            where: { sessionToken },
            include: { user: true },
        });

        if (!userSession || userSession.userId !== order.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // If payment status is not succeeded, mark as failed
        if (paymentStatus !== 'succeeded') {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'failed',
                    status: 'cancelled',
                },
            });

            return NextResponse.json({
                orderId,
                status: 'failed',
                message: 'Payment failed',
            });
        }

        // Update order to paid status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: 'succeeded',
                status: 'paid',
                paymentId,
            },
            include: { items: { include: { product: true } } },
        });

        // Clear the user's cart after successful order
        try {
            const userCart = await prisma.cart.findUnique({
                where: { userId: userSession.userId },
            });

            if (userCart) {
                await prisma.cartItem.deleteMany({
                    where: { cartId: userCart.id },
                });
            }
        } catch (err) {
            console.error('Failed to clear cart:', err);
            // Don't fail the order if cart clearing fails
        }

        // TODO: Send confirmation email
        // TODO: Update inventory/stock
        // TODO: Create fulfillment request

        return NextResponse.json({
            orderId: updatedOrder.id,
            status: 'success',
            message: 'Order confirmed',
            order: {
                id: updatedOrder.id,
                total: updatedOrder.total,
                status: updatedOrder.status,
                createdAt: updatedOrder.createdAt,
            },
        });
    } catch (error) {
        console.error('Complete checkout error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to complete checkout',
            },
            { status: 500 }
        );
    }
}
