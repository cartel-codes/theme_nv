import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/products/[id] - Fetch a single product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id] - Update a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, slug, description, price, categoryId, metaTitle, metaDescription, keywords, images } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if new slug already exists (if slug is being changed)
    if (slug && slug !== existingProduct.slug) {
      const duplicateSlug = await prisma.product.findUnique({
        where: { slug },
      });

      if (duplicateSlug) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }

    // Delete existing images if new ones are provided
    if (images && Array.isArray(images)) {
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(keywords !== undefined && { keywords }),
        ...(images && Array.isArray(images) && {
          images: {
            create: images.map((img: any, index: number) => ({
              url: img.url,
              alt: img.alt || name || existingProduct.name,
              order: index,
              isPrimary: index === 0,
            })),
          },
        }),
      },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id] - Delete a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
