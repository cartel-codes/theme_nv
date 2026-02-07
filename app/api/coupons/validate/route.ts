import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { message: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { message: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { message: 'This coupon is no longer active' },
        { status: 400 }
      );
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json(
        { message: 'This coupon has expired' },
        { status: 400 }
      );
    }

    // Check if coupon has usage limit
    if (coupon.usageLimit && coupon.used >= coupon.usageLimit) {
      return NextResponse.json(
        { message: 'This coupon has reached its usage limit' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        discountAmount: coupon.discountAmount,
        minOrderAmount: coupon.minOrderAmount,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { message: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
