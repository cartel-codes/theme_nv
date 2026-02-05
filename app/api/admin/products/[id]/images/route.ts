import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/products/[id]/images - Add images to a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { images } = body;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Images array is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get the current max order
    const maxOrder = product.images.length > 0
      ? Math.max(...product.images.map(img => img.order))
      : -1;

    const newImages = await Promise.all(
      images.map((img: any, index: number) =>
        prisma.productImage.create({
          data: {
            productId: id,
            url: img.url,
            alt: img.alt || product.name,
            order: maxOrder + 1 + index,
            isPrimary: false,
          },
        })
      )
    );

    return NextResponse.json(newImages, { status: 201 });
  } catch (error) {
    console.error('Failed to add images:', error);
    return NextResponse.json(
      { error: 'Failed to add images' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]/images - Reorder images
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { images } = body;

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Images array is required' },
        { status: 400 }
      );
    }

    // Update all images with new order
    const updatedImages = await Promise.all(
      images.map((img: any, index: number) =>
        prisma.productImage.update({
          where: { id: img.id },
          data: {
            order: index,
            isPrimary: index === 0,
          },
        })
      )
    );

    return NextResponse.json(updatedImages);
  } catch (error) {
    console.error('Failed to reorder images:', error);
    return NextResponse.json(
      { error: 'Failed to reorder images' },
      { status: 500 }
    );
  }
}
