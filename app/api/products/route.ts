import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') || 'asc';

    const orderBy =
      sort === 'price'
        ? { price: order as 'asc' | 'desc' }
        : sort === 'createdAt'
          ? { createdAt: order as 'asc' | 'desc' }
          : { name: order as 'asc' | 'desc' };

    const products = await prisma.product.findMany({
      where: { isPublished: true },
      include: {
        category: true,
        images: {
          take: 1,
          orderBy: { order: 'asc' }
        }
      },
      orderBy,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
