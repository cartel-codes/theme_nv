import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getOrCreateCart } from '@/lib/cart';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findUnique: jest.fn(),
        },
        productVariant: {
            findUnique: jest.fn(),
        },
        cartItem: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}));
jest.mock('@/lib/cart');
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

describe('Add to Cart API - Authentication Scenarios', () => {
    const mockProductId = 'product_123';
    const mockUserId = 'user_789';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Scenario 1: Product Validation', () => {
        it('should return 404 when product does not exist', async () => {
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: 'nonexistent_product', quantity: 1 }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Product not found');
        });

        it('should return 400 when productId is missing', async () => {
            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ quantity: 1 }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('productId is required');
        });
    });

    describe('Scenario 2: Valid Cart Operations', () => {
        it('should successfully add product to cart', async () => {
            const mockProduct = {
                id: mockProductId,
                name: 'Test Product',
                price: 29.99,
            };

            const mockCart = {
                id: 'cart_123',
                userId: mockUserId,
                items: [],
            };

            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
            (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
            (prisma.cartItem.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.cartItem.create as jest.Mock).mockResolvedValue({
                id: 'item_1',
                cartId: 'cart_123',
                productId: mockProductId,
                quantity: 1,
            });

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 1 }),
            });

            const response = await POST(request);

            expect(response.status).toBe(200);
            expect(prisma.cartItem.create).toHaveBeenCalledWith({
                data: {
                    cartId: 'cart_123',
                    productId: mockProductId,
                    variantId: null,
                    quantity: 1,
                },
            });
        });

        it('should update quantity when adding existing product', async () => {
            const existingItem = {
                id: 'item_1',
                cartId: 'cart_123',
                productId: mockProductId,
                quantity: 2,
            };

            (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: mockProductId });
            (getOrCreateCart as jest.Mock).mockResolvedValue({ id: 'cart_123', items: [] });
            (prisma.cartItem.findFirst as jest.Mock).mockResolvedValue(existingItem);

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 1 }),
            });

            await POST(request);

            expect(prisma.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'item_1' },
                data: { quantity: 3 },
            });
        });
    });

    describe('Scenario 3: Multiple Quantity', () => {
        it('should add multiple quantities of same product', async () => {
            (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: mockProductId });
            (getOrCreateCart as jest.Mock).mockResolvedValue({ id: 'cart_123', items: [] });
            (prisma.cartItem.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.cartItem.create as jest.Mock).mockResolvedValue({
                id: 'item_1',
                cartId: 'cart_123',
                productId: mockProductId,
                quantity: 5,
            });

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 5 }),
            });

            await POST(request);

            expect(prisma.cartItem.create).toHaveBeenCalledWith({
                data: {
                    cartId: 'cart_123',
                    productId: mockProductId,
                    variantId: null,
                    quantity: 5,
                },
            });
        });
    });
});
