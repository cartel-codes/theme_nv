import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { getUserSession } from './user-auth';

const CART_SESSION_COOKIE = 'cart_session_id';
const USER_SESSION_COOKIE = 'userSession';

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

export async function getOrCreateCart() {
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
        const existingItem = await prisma.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: userCart.id,
              productId: item.productId,
            },
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
      userCart = await prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }) as any;
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
          },
        },
      },
    });
  }

  return cart;
}

