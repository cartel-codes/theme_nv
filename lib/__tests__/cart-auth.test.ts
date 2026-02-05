import { getOrCreateCart } from '../cart';
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

describe('Cart Authentication Scenarios', () => {
    const mockSessionId = 'session_abc123';
    const mockUserId = 'user_xyz789';
    const mockSessionToken = 'token_valid123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Scenario 1: Unauthenticated User (Guest)', () => {
        it('should create a guest cart with sessionId when no user is logged in', async () => {
            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    if (name === 'userSession') return undefined;
                    return undefined;
                }),
                set: jest.fn(),
            });
            (getUserSession as jest.Mock).mockResolvedValue(null);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.cart.create as jest.Mock).mockResolvedValue({
                id: 'cart_guest_1',
                sessionId: mockSessionId,
                userId: null,
                items: []
            });

            const cart = await getOrCreateCart();

            expect(cart.sessionId).toBe(mockSessionId);
            expect(cart.userId).toBeNull();
            expect(prisma.cart.create).toHaveBeenCalledWith(expect.objectContaining({
                data: { sessionId: mockSessionId }
            }));
        });

        it('should return existing guest cart if already exists', async () => {
            const existingGuestCart = {
                id: 'cart_guest_1',
                sessionId: mockSessionId,
                userId: null,
                items: [{ productId: 'p1', quantity: 1 }]
            };

            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    if (name === 'userSession') return undefined;
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue(null);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(existingGuestCart);

            const cart = await getOrCreateCart();

            expect(cart.id).toBe('cart_guest_1');
            expect(cart.items).toHaveLength(1);
            expect(prisma.cart.create).not.toHaveBeenCalled();
        });
    });

    describe('Scenario 2: Authenticated User - New Session', () => {
        it('should create a new user cart when logged in user has no cart', async () => {
            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' }
            });
            (prisma.cart.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.cart.create as jest.Mock).mockResolvedValue({
                id: 'cart_user_1',
                userId: mockUserId,
                sessionId: null,
                items: []
            });

            const cart = await getOrCreateCart();

            expect(cart.userId).toBe(mockUserId);
            expect(prisma.cart.create).toHaveBeenCalledWith(expect.objectContaining({
                data: { userId: mockUserId }
            }));
        });
    });

    describe('Scenario 3: User Login with Existing Guest Cart', () => {
        it('should merge guest cart items into user cart when user logs in', async () => {
            const guestCart = {
                id: 'cart_guest_1',
                sessionId: mockSessionId,
                items: [
                    { id: 'item_1', productId: 'p1', quantity: 2 },
                    { id: 'item_2', productId: 'p2', quantity: 1 }
                ]
            };

            const userCart = {
                id: 'cart_user_1',
                userId: mockUserId,
                items: []
            };

            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' }
            });
            (prisma.cart.findFirst as jest.Mock).mockResolvedValue(userCart);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(guestCart);
            (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

            await getOrCreateCart();

            // Should create cart items for each guest item
            expect(prisma.cartItem.create).toHaveBeenCalledTimes(2);
            expect(prisma.cartItem.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    cartId: 'cart_user_1',
                    productId: 'p1',
                    quantity: 2
                })
            }));
            // Should delete guest cart after merge
            expect(prisma.cart.delete).toHaveBeenCalledWith({ where: { id: 'cart_guest_1' } });
        });

        it('should merge quantities when product already exists in user cart', async () => {
            const guestCart = {
                id: 'cart_guest_1',
                sessionId: mockSessionId,
                items: [
                    { id: 'item_1', productId: 'p1', quantity: 2 }
                ]
            };

            const userCart = {
                id: 'cart_user_1',
                userId: mockUserId,
                items: [
                    { id: 'item_user_1', productId: 'p1', quantity: 3, cartId: 'cart_user_1' }
                ]
            };

            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' }
            });
            (prisma.cart.findFirst as jest.Mock).mockResolvedValue(userCart);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(guestCart);
            (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(userCart.items[0]);

            await getOrCreateCart();

            // Should update existing item quantity (3 + 2 = 5)
            expect(prisma.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'item_user_1' },
                data: { quantity: 5 }
            });
            expect(prisma.cartItem.create).not.toHaveBeenCalled();
        });
    });

    describe('Scenario 4: Session Expiry', () => {
        it('should handle expired user session gracefully', async () => {
            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: 'expired_token' };
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue(null); // Expired/invalid session
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue({
                id: 'cart_guest_1',
                sessionId: mockSessionId,
                items: []
            });

            const cart = await getOrCreateCart();

            // Should fall back to guest cart
            expect(cart.sessionId).toBe(mockSessionId);
            expect(cart.userId).toBeUndefined();
        });
    });

    describe('Scenario 5: Returning Authenticated User', () => {
        it('should return existing user cart for returning logged-in user', async () => {
            const existingUserCart = {
                id: 'cart_user_1',
                userId: mockUserId,
                items: [
                    { id: 'item_1', productId: 'p1', quantity: 2, product: { name: 'Product 1' } }
                ]
            };

            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' }
            });
            (prisma.cart.findFirst as jest.Mock).mockResolvedValue(existingUserCart);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null); // No guest cart

            const cart = await getOrCreateCart();

            expect(cart.id).toBe('cart_user_1');
            expect(cart.items).toHaveLength(1);
            expect(prisma.cart.create).not.toHaveBeenCalled();
        });
    });

    describe('Scenario 6: Edge Cases', () => {
        it('should handle empty guest cart merge (no items to merge)', async () => {
            const emptyGuestCart = {
                id: 'cart_guest_1',
                sessionId: mockSessionId,
                items: []
            };

            const userCart = {
                id: 'cart_user_1',
                userId: mockUserId,
                items: []
            };

            (cookies as jest.Mock).mockReturnValue({
                get: jest.fn((name) => {
                    if (name === 'userSession') return { value: mockSessionToken };
                    if (name === 'cart_session_id') return { value: mockSessionId };
                    return undefined;
                }),
            });
            (getUserSession as jest.Mock).mockResolvedValue({
                user: { id: mockUserId, email: 'user@test.com' }
            });
            (prisma.cart.findFirst as jest.Mock).mockResolvedValue(userCart);
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(emptyGuestCart);

            await getOrCreateCart();

            // Should not create any items or delete empty cart
            expect(prisma.cartItem.create).not.toHaveBeenCalled();
            expect(prisma.cart.delete).not.toHaveBeenCalled();
        });
    });
});
