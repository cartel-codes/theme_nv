import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { getUserSession } from './user-auth';
import type { Cart, CartItem, Product } from '@prisma/client';

const CART_SESSION_COOKIE = 'cart_session_id';
const USER_SESSION_COOKIE = 'userSession';

type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
    variant?: any;
  })[];
};

export async function getCartSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set(CART_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return sessionId;
}

export async function getOrCreateCart(): Promise<CartWithItems> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const sessionId = await getCartSessionId();

  // Check if user is logged in
  let userId: string | null = null;
  if (sessionToken) {
    const userSession = await getUserSession(sessionToken);
    if (userSession && userSession.user) {
      userId = userSession.user.id;
    }
  }

  // If user is logged in, get or create user cart
  if (userId) {
    let userCart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
    }

    // Check if there's an anonymous cart to merge
    const anonymousCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: true,
      },
    });

    if (anonymousCart && anonymousCart.items.length > 0) {
      // Merge anonymous cart items into user cart
      for (const item of anonymousCart.items) {
        // Check if the product already exists in user cart
        // Use findFirst instead of findUnique to handle nullable variantId
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });

        if (existingItem) {
          // Update quantity
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + item.quantity },
          });
        } else {
          // Add new item to user cart
          await prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: item.productId,
              // @ts-ignore - Prisma typing issue with nullable variantId
              variantId: item.variantId || null,
              quantity: item.quantity,
            },
          });
        }
      }

      // Delete the anonymous cart
      await prisma.cart.delete({
        where: { id: anonymousCart.id },
      });

      // Refresh user cart with merged items
      userCart = (await prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      }))!;
    }

    return userCart;
  }

  // Guest user - use session cart
  let cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  return cart;
}
