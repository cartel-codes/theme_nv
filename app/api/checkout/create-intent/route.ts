import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/checkout/create-intent
 * Creates a Stripe payment intent
 * 
 * Request body:
 * {
 *   items: [{ productId, quantity }, ...],
 *   shippingAddress: { ... }
 * }
 * 
 * Response:
 * {
 *   clientSecret: string,
 *   total: number,
 *   orderId: string
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
        const { items, shippingAddress, email } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Cart is empty' },
                { status: 400 }
            );
        }

        if (!shippingAddress) {
            return NextResponse.json(
                { error: 'Shipping address is required' },
                { status: 400 }
            );
        }

        // Validate shippingAddress has required fields
        const { street, city, state, zip, country } = shippingAddress;
        if (!street || !city || !state || !zip || !country) {
            return NextResponse.json(
                { error: 'Invalid shipping address' },
                { status: 400 }
            );
        }

        // Fetch user from session
        const userSession = await prisma.userSession.findUnique({
            where: { sessionToken },
            include: { user: true },
        });

        if (!userSession || !userSession.user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        // Fetch products and validate availability
        const productIds = items.map((item: any) => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
            return NextResponse.json(
                { error: 'Some products not found' },
                { status: 400 }
            );
        }

        // Calculate order total
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                return NextResponse.json(
                    { error: `Product ${item.productId} not found` },
                    { status: 400 }
                );
            }

            const quantity = item.quantity || 1;
            const itemTotal = Number(product.price) * quantity;
            subtotal += itemTotal;

            orderItems.push({
                productId: product.id,
                quantity,
                priceAtPurchase: product.price,
            });
        }

        const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
        const total = subtotal + tax + shipping;

        // Create order in database with pending status
        const order = await prisma.order.create({
            data: {
                userId: userSession.userId,
                subtotal: Math.round(subtotal * 100) / 100,
                tax: Math.round(tax * 100) / 100,
                shipping: Math.round(shipping * 100) / 100,
                total: Math.round(total * 100) / 100,
                status: 'pending',
                shippingAddress: JSON.stringify(shippingAddress),
                paymentStatus: 'pending',
                items: {
                    create: orderItems,
                },
            },
            include: { items: true },
        });

        // TODO: In production, integrate with Stripe here
        // For now, return a mock client secret
        const clientSecret = `pi_${Buffer.from(order.id).toString('base64').substring(0, 20)}`;

        return NextResponse.json({
            clientSecret,
            total: Math.round(total * 100) / 100,
            orderId: order.id,
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to create payment intent',
            },
            { status: 500 }
        );
    }
}
