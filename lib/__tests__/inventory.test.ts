import { checkStockAvailability } from '../inventory';
import { prisma } from '../prisma';

// Mock prisma
jest.mock('../prisma', () => ({
    prisma: {
        inventory: {
            findFirst: jest.fn(),
        },
    },
}));

describe('Inventory Utility', () => {
    describe('checkStockAvailability', () => {
        it('should return available: true if stock is sufficient', async () => {
            (prisma.inventory.findFirst as jest.Mock).mockResolvedValue({
                quantity: 10,
            });

            const result = await checkStockAvailability([
                { productId: 'prod_1', quantity: 5 }
            ]);

            expect(result.available).toBe(true);
        });

        it('should return available: false if stock is insufficient', async () => {
            (prisma.inventory.findFirst as jest.Mock).mockResolvedValue({
                quantity: 2,
            });

            const result = await checkStockAvailability([
                { productId: 'prod_1', quantity: 5 }
            ]);

            expect(result.available).toBe(false);
            expect(result.message).toContain('no longer in stock');
        });

        it('should return available: false if item is not found in inventory', async () => {
            (prisma.inventory.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await checkStockAvailability([
                { productId: 'prod_not_found', quantity: 1 }
            ]);

            expect(result.available).toBe(false);
        });
    });
});
