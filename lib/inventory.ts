import { prisma } from './prisma';

/**
 * Deducts stock from inventory for items in an order
 * This should be called after a successful payment
 */
export async function deductStockForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: true,
                    variant: true,
                },
            },
        },
    });

    if (!order) throw new Error('Order not found');

    const updates = [];

    for (const item of order.items) {
        // Determine which inventory record to update
        const where = item.variantId
            ? { variantId: item.variantId }
            : { productId: item.productId, variantId: null };

        // Update quantity
        const update = prisma.inventory.updateMany({
            where,
            data: {
                quantity: {
                    decrement: item.quantity,
                },
            },
        });

        updates.push(update);
    }

    await prisma.$transaction(updates);
}

/**
 * Checks if all items in an order are in stock
 */
export async function checkStockAvailability(items: { productId: string; variantId?: string | null; quantity: number }[]) {
    for (const item of items) {
        const inventory = await prisma.inventory.findFirst({
            where: {
                productId: item.productId,
                variantId: item.variantId || null,
            },
        });

        if (!inventory || inventory.quantity < item.quantity) {
            return {
                available: false,
                productId: item.productId,
                message: `Oops! One of the items is no longer in stock.`,
            };
        }
    }

    return { available: true };
}
