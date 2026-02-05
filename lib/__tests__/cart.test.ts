import { getOrCreateCart, getCartSessionId } from '../cart';
import { prisma } from '../prisma';
import { getUserSession } from '../user-auth';
import { cookies } from 'next/headers';

// Mock Dependencies
jest.mock('../prisma', () => ({
    prisma: {
        cart: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        cartItem: {
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock('../user-auth', () => ({
    getUserSession: jest.fn(),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

describe('Cart Persistence & Merging', () => {
    const mockSessionId = 'session_123';
    const mockUserId = 'user_123';
    const mockCartId = 'cart_123';

    beforeEach(() => {
        jest.clearAllMocks();
        (cookies as jest.Mock).mockReturnValue({
            get: jest.fn().mockReturnValue({ value: mockSessionId }),
            set: jest.fn(),
        });
    });

    describe('getOrCreateCart', () => {
        it('returns an anonymous cart when no user is logged in', async () => {
            (getUserSession as jest.Mock).mockResolvedValue(null);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue({ id: mockCartId, items: [] });

            const cart = await getOrCreateCart();

            expect(cart.id).toBe(mockCartId);
            expect(prisma.cart.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { sessionId: mockSessionId }
            }));
        });

        it('returns a user cart when user is logged in', async () => {
            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: 'token_123' };
                    return { value: mockSessionId };
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });

            (prisma.cart.findFirst as jest.Mock).mockImplementation(({ where }) => {
                if (where.userId === mockUserId) return Promise.resolve({ id: 'user_cart', items: [] });
                return Promise.resolve(null);
            });

            const cart = await getOrCreateCart();

            expect(cart.id).toBe('user_cart');
            expect(prisma.cart.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: mockUserId }
            }));
        });

        it('merges an anonymous cart into a user cart when user logs in', async () => {
            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: 'token_123' };
                    return { value: mockSessionId };
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });

            // Mock anonymous cart with items
            (prisma.cart.findFirst as jest.Mock).mockImplementation(({ where }) => {
                if (where.userId === mockUserId) {
                    return Promise.resolve({ id: 'user_cart', items: [] });
                }
                return Promise.resolve(null);
            });

            (prisma.cart.findUnique as jest.Mock).mockImplementation(({ where }) => {
                if (where.sessionId === mockSessionId) {
                    return Promise.resolve({ id: 'anon_cart', items: [{ productId: 'p1', quantity: 2 }] });
                }
                if (where.id === 'anon_cart') {
                    return Promise.resolve({ id: 'anon_cart', items: [{ productId: 'p1', quantity: 2 }] });
                }
                if (where.id === 'user_cart') {
                    return Promise.resolve({ id: 'user_cart', items: [] });
                }
                return Promise.resolve(null);
            });

            // Mock item check in user cart (not found)
            (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

            const cart = await getOrCreateCart();

            expect(prisma.cartItem.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ cartId: 'user_cart', productId: 'p1', quantity: 2 })
            }));
            expect(prisma.cart.delete).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'anon_cart' }
            }));
        });
    });
});
