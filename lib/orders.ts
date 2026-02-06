
import { prisma } from './prisma';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderFilter {
    status?: OrderStatus;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Get all orders for a specific user (User View)
 */
export async function getUserOrders(userId: string) {
    return prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    product: {
                        select: { name: true, images: true }
                    },
                    variant: {
                        select: { name: true }
                    }
                }
            }
        }
    });
}

/**
 * Get a single order for a user (User View - Secure)
 */
export async function getUserOrder(userId: string, orderId: string) {
    return prisma.order.findFirst({
        where: {
            id: orderId,
            userId: userId
        },
        include: {
            items: {
                include: {
                    product: true,
                    variant: true
                }
            }
        }
    });
}

/**
 * Get all orders (Admin View)
 */
export async function getAdminOrders(filter?: OrderFilter) {
    const where: any = {};

    if (filter?.status) {
        where.status = filter.status;
    }

    if (filter?.userId) {
        where.userId = filter.userId;
    }

    if (filter?.startDate || filter?.endDate) {
        where.createdAt = {};
        if (filter.startDate) where.createdAt.gte = filter.startDate;
        if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    return prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { email: true, firstName: true, lastName: true }
            },
            items: {
                include: {
                    product: { select: { name: true } },
                }
            }
        }
    });
}

/**
 * Get single order details (Admin View)
 */
export async function getAdminOrder(orderId: string) {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: {
                select: { id: true, email: true, firstName: true, lastName: true }
            },
            items: {
                include: {
                    product: true,
                    variant: true
                }
            }
        }
    });
}

/**
 * Update order status (Admin Action)
 */
export async function updateOrderStatus(orderId: string, status: any) {
    return prisma.order.update({
        where: { id: orderId },
        data: { status }
    });
}
