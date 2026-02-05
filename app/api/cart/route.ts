import { NextResponse } from 'next/server';
import { getOrCreateCart } from '@/lib/cart';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cart = await getOrCreateCart();

    if (!cart) {
      return NextResponse.json({ items: [], totalItems: 0 });
    }

    return NextResponse.json({
      items: cart.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
      })) || [],
      totalItems: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    });
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('userSession')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to add items to cart.' },
        { status: 401 }
      );
    }

    // Verify session is valid
    const { getUserSession } = await import('@/lib/user-auth');
    const userSession = await getUserSession(sessionToken);

    if (!userSession || !userSession.user) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const cart = await getOrCreateCart();

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    const updatedCart = await getOrCreateCart();
    return NextResponse.json({
      items: updatedCart.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
      })) || [],
      totalItems: updatedCart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    });
  } catch (error) {
    console.error('Failed to add to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'itemId and quantity are required' },
        { status: 400 }
      );
    }

    const cart = await getOrCreateCart();
    const item = cart.items?.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    const updatedCart = await getOrCreateCart();
    return NextResponse.json({
      items: updatedCart.items?.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        product: i.product,
      })) || [],
      totalItems: updatedCart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
    });
  } catch (error) {
    console.error('Failed to update cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    const cart = await getOrCreateCart();
    const item = cart.items?.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updatedCart = await getOrCreateCart();
    return NextResponse.json({
      items: updatedCart.items?.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        product: i.product,
      })) || [],
      totalItems: updatedCart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
    });
  } catch (error) {
    console.error('Failed to remove from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
