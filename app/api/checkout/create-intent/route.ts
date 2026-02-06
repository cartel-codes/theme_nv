import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

        // Fetch products and variants
        // We will fetch products by ID as before, but also need to handle variants independently or included.
        // Simplest strategy: iterate and fetch individually or fetch all affected products with variants included.
        const productIds = Array.from(new Set(items.map((item: any) => item.productId))) as string[];
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { variants: true }
        });

        // ... (check product existence)

        // Calculate order total
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                // Return error
                return NextResponse.json({ error: 'Product not found' }, { status: 400 });
            }

            let price = Number(product.price);
            let variantId = item.variantId || null;

            if (variantId) {
                const variant = product.variants.find(v => v.id === variantId);
                if (variant) {
                    if (variant.price) {
                        price = Number(variant.price);
                    }
                    // TODO: Check stock specific to variant
                } else {
                    return NextResponse.json({ error: 'Variant not found' }, { status: 400 });
                }
            }

            const quantity = item.quantity || 1;
            const itemTotal = price * quantity;
            subtotal += itemTotal;

            orderItems.push({
                productId: product.id,
                variantId: variantId,
                quantity,
                priceAtPurchase: price,
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
