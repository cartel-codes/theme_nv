import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callPayPalAPI } from '@/lib/paypal';

export const dynamic = 'force-dynamic';
/**
 * POST /api/checkout/paypal/create-order
 * 1. Validates the cart
 * 2. Creates a local order in the DB
 * 3. Creates a PayPal order and returns the PayPal order ID
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate User
        const sessionToken = request.cookies.get('userSession')?.value;
        if (!sessionToken) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        const userSession = await prisma.userSession.findUnique({
            where: { sessionToken },
            include: { user: true },
        });

        if (!userSession || !userSession.user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // 2. Parse and Validate Body
        const body = await request.json();
        const { items, shippingAddress } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
            return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 });
        }

        // 3. Fetch Products and Calculate Totals (Server-side validation)
        const productIds = Array.from(new Set(items.map((item: any) => item.productId))) as string[];
        const products = await prisma.product.findMany({
            where: { 
                id: { in: productIds },
                isPublished: true 
            },
            include: { variants: true }
        });

        // Stock Check
        for (const item of items) {
            const inventory = await prisma.inventory.findFirst({
                where: {
                    productId: item.productId,
                    variantId: item.variantId || null,
                },
            });

            if (!inventory || inventory.quantity < item.quantity) {
                return NextResponse.json({
                    error: `Item "${products.find(p => p.id === item.productId)?.name}" is out of stock.`
                }, { status: 400 });
            }
        }

        let subtotal = 0;
        const orderItemsData = [];

        for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
            }

            let price = Number(product.price);
            let variantId = item.variantId || null;

            if (variantId) {
                const variant = product.variants.find(v => v.id === variantId);
                if (variant && variant.price) {
                    price = Number(variant.price);
                }
            }

            const quantity = item.quantity || 1;
            subtotal += price * quantity;

            orderItemsData.push({
                productId: product.id,
                variantId: variantId,
                quantity,
                priceAtPurchase: price,
            });
        }

        const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
        const total = Math.round((subtotal + tax + shipping) * 100) / 100;

        // 4. Create Local Order
        const order = await prisma.order.create({
            data: {
                userId: userSession.userId,
                subtotal: Math.round(subtotal * 100) / 100,
                tax: Math.round(tax * 100) / 100,
                shipping: Math.round(shipping * 100) / 100,
                total: total,
                status: 'pending',
                shippingAddress: JSON.stringify(shippingAddress),
                paymentStatus: 'pending',
                items: {
                    create: orderItemsData,
                },
            },
        });

        // 5. Create PayPal Order
        const paypalOrder = await callPayPalAPI('/v2/checkout/orders', 'POST', {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    reference_id: order.id,
                    amount: {
                        currency_code: 'USD',
                        value: total.toFixed(2),
                    },
                    description: `Order ${order.id} from Novraux`,
                },
            ],
            application_context: {
                brand_name: 'Novraux',
                shipping_preference: 'NO_SHIPPING', // Already collected
                user_action: 'PAY_NOW',
            }
        });

        // Update local order with PayPal Order ID
        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentId: paypalOrder.id,
            },
        });

        return NextResponse.json({
            id: paypalOrder.id, // PayPal order ID
            localOrderId: order.id,
            total: total
        });

    } catch (error) {
        console.error('PayPal Order Creation Error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create PayPal order', details: String(error) },
            { status: 500 }
        );
    }
}
