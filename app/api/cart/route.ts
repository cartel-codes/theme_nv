import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
        variantId: item.variantId,
        quantity: item.quantity,
        product: item.product,
        variant: item.variant,
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
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        isPublished: true 
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found or not available' }, { status: 404 });
    }

    // Verify variant if provided
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant || variant.productId !== productId) {
        return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
      }
    }

    const cart = await getOrCreateCart();

    // Use findFirst because unique constraint might be tricky with nulls in Prisma sometimes, 
    // but better to explicitly use the compound unique if possible.
    // However, Prisma schema says: @@unique([cartId, productId, variantId])
    // If variantId is null, it should still work if we pass it explicitly.
    // Using findFirst is safer for "null" variantId handling in some DBs/Prisma versions if the unique index doesn't treat multiple NULLs as duplicates (Postgres does unique nulls differently usually, but let's try findFirst for flexibility).

    // Actually, let's try to use the unique key logic if we can, but safely.
    // If we changed the unique key, we MUST match it.

    // Use findFirst instead of findUnique because the unique constraint
    // doesn't handle NULL variantIds properly in PostgreSQL
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
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
          // @ts-ignore - Prisma typing issue with nullable variantId
          variantId: variantId || null,
          quantity,
        },
      });
    }

    const updatedCart = await getOrCreateCart();
    revalidatePath('/cart');
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
    console.error('Cart add error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add item to cart' },
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
    revalidatePath('/cart');
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
    revalidatePath('/cart');
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
