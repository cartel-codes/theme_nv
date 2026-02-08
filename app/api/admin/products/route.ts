import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/products - Fetch all products (for admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const whereClause: any = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        category ? { category: { slug: category } } : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          images: {
            orderBy: { order: 'asc' },
          },
          inventory: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products - Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, slug, description, price, categoryId, metaTitle, metaDescription, keywords, ogImage, focusKeyword, images, isOnSale, isPublished, discountPercentage, discountExpiresAt } = body;

    if (!name || !slug || !price) {
      return NextResponse.json(
        { error: 'Name, slug, and price are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        categoryId: categoryId || null,
        metaTitle,
        metaDescription,
        keywords,
        ogImage,
        focusKeyword,
        isOnSale: isOnSale || false,
        isPublished: isPublished === true,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        discountExpiresAt: discountExpiresAt ? new Date(discountExpiresAt) : null,
        imageUrl: images && Array.isArray(images) && images.length > 0 ? images[0].url : null,
        images: {
          create: Array.isArray(images)
            ? images.map((img: any, index: number) => ({
              url: img.url,
              alt: img.alt || name,
              order: index,
              isPrimary: index === 0,
            }))
            : [],
        },
      },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
