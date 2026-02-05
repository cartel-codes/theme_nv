import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/user-auth';
import { getOrCreateCart } from '@/lib/cart';

jest.mock('@/lib/prisma');
jest.mock('@/lib/user-auth');
jest.mock('@/lib/cart');
jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

describe('Add to Cart API - Authentication Scenarios', () => {
    const mockProductId = 'product_123';
    const mockUserId = 'user_789';
    const mockSessionToken = 'valid_token_abc';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Scenario 1: Unauthenticated User Attempts to Add to Cart', () => {
        it('should return 401 when no session token is present', async () => {
            const { cookies } = await import('next/headers');
            (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn(() => undefined), // No session token
            });

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 1 }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toContain('Authentication required');
            expect(prisma.product.findUnique).not.toHaveBeenCalled();
        });

        it('should return 401 with helpful message for guest users', async () => {
            const { cookies } = await import('next/headers');
            (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn(() => undefined),
            });

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 1 }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(data.error).toBe('Authentication required. Please log in to add items to cart.');
        });
    });

    describe('Scenario 2: Expired Session Token', () => {
        it('should return 401 when session token is expired/invalid', async () => {
            const { cookies } = await import('next/headers');
            (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: 'expired_token' };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue(null); // Expired session

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 1 }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toContain('Invalid or expired session');
        });
    });

    describe('Scenario 3: Valid Authenticated User', () => {
        it('should successfully add product to cart when user is authenticated', async () => {
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

            const { cookies } = await import('next/headers');
            (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' },
            });
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
            (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
            (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);
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

            const { cookies } = await import('next/headers');
            (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' },
            });
            (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: mockProductId });
            (getOrCreateCart as jest.Mock).mockResolvedValue({ id: 'cart_123', items: [] });
            (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(existingItem);

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 1 }),
            });

            await POST(request);

            expect(prisma.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'item_1' },
                data: { quantity: 3 }, // 2 + 1
            });
        });
    });

    describe('Scenario 4: Product Validation', () => {
        it('should return 404 when product does not exist', async () => {
            const { cookies } = await import('next/headers');
            (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' },
            });
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(null); // Product not found

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
                body: JSON.stringify({ quantity: 1 }), // Missing productId
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('productId is required');
        });
    });

    describe('Scenario 5: Multiple Quantity', () => {
        it('should add multiple quantities of same product', async () => {
            const { cookies } = await import('next/headers');
            (cookies as jest.Mock).mockResolvedValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' },
            });
            (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: mockProductId });
            (getOrCreateCart as jest.Mock).mockResolvedValue({ id: 'cart_123', items: [] });
            (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

            const request = new Request('http://localhost:3000/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: mockProductId, quantity: 5 }),
            });

            await POST(request);

            expect(prisma.cartItem.create).toHaveBeenCalledWith({
                data: {
                    cartId: 'cart_123',
                    productId: mockProductId,
                    quantity: 5,
                },
            });
        });
    });
});
