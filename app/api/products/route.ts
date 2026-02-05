import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function getProducts(searchParams: URLSearchParams) {
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';

  const orderBy =
    sort === 'price'
      ? { price: order as 'asc' | 'desc' }
      : sort === 'createdAt'
        ? { createdAt: order as 'asc' | 'desc' }
        : { name: order as 'asc' | 'desc' };

  return await prisma.product.findMany({
    where: category ? { category: { slug: category } } : undefined,
    include: { category: true },
    orderBy,
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const products = await getProducts(searchParams);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
