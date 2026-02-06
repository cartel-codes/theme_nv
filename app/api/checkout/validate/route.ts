import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/checkout/validate
 * Validates cart and calculates totals
 * 
 * Request body:
 * {
 *   cartItems: [{ productId, quantity }, ...]
 * }
 * 
 * Response:
 * {
 *   items: [{ productId, name, price, quantity, total }, ...],
 *   subtotal: number,
 *   tax: number,
 *   shipping: number,
 *   total: number
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cartItems } = body;

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return NextResponse.json(
                { error: 'Cart is empty' },
                { status: 400 }
            );
        }

        // Fetch product details for all items with variants
        const productIds = cartItems.map((item: any) => item.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { variants: true },
        });

        // Map products and validate
        const items = cartItems.map((item: any) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }

            let price = Number(product.price);
            let variantName = '';

            if (item.variantId) {
                const variant = product.variants.find(v => v.id === item.variantId);
                if (variant) {
                    if (variant.price) price = Number(variant.price);
                    variantName = `${variant.name}: ${variant.value}`;
                }
            }

            const quantity = Math.max(1, Math.min(999, item.quantity || 1));
            const itemTotal = price * quantity;

            return {
                productId: product.id,
                variantId: item.variantId || null,
                name: product.name,
                variantName,
                slug: product.slug,
                price: price,
                quantity,
                total: itemTotal,
            };
        });

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax example
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
        const total = subtotal + tax + shipping;

        return NextResponse.json({
            items,
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            total: Math.round(total * 100) / 100,
        });
    } catch (error) {
        console.error('Checkout validation error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Validation failed',
            },
            { status: 400 }
        );
    }
}
