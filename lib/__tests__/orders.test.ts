
import { getUserOrders, getUserOrder, getAdminOrders, getAdminOrder, updateOrderStatus } from '../orders';
import { prisma } from '../prisma';

// Mock Prisma
jest.mock('../prisma', () => ({
    prisma: {
        order: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        }
    }
}));

describe('Orders Library', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserOrders', () => {
        it('should fetch orders for a specific user', async () => {
            const mockOrders = [{ id: 'order1', userId: 'user1' }];
            (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

            const result = await getUserOrders('user1');

            expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: 'user1' },
                orderBy: { createdAt: 'desc' }
            }));
            expect(result).toEqual(mockOrders);
        });
    });

    describe('getUserOrder', () => {
        it('should fetch a specific order for a user ensuring ownership', async () => {
            const mockOrder = { id: 'order1', userId: 'user1' };
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

            const result = await getUserOrder('user1', 'order1');

            expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'order1', userId: 'user1' }
            }));
            expect(result).toEqual(mockOrder);
        });

        it('should return null if order belongs to another user', async () => {
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await getUserOrder('user1', 'order2');

            expect(result).toBeNull();
        });
    });

    describe('getAdminOrders', () => {
        it('should fetch all orders without user restriction', async () => {
            const mockOrders = [{ id: 'order1', userId: 'user1' }, { id: 'order2', userId: 'user2' }];
            (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

            const result = await getAdminOrders();

            expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {},
                orderBy: { createdAt: 'desc' }
            }));
            expect(result).toHaveLength(2);
        });

        it('should filter orders by status', async () => {
            await getAdminOrders({ status: 'paid' });

            expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { status: 'paid' }
            }));
        });
    });

    describe('updateOrderStatus', () => {
        it('should update the status of an order', async () => {
            const mockUpdatedOrder = { id: 'order1', status: 'shipped' };
            (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

            const result = await updateOrderStatus('order1', 'shipped');

            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order1' },
                data: { status: 'shipped' }
            });
            expect(result).toEqual(mockUpdatedOrder);
        });
    });
});
