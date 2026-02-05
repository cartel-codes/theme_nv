import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/dashboard - Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get counts
    const [totalProducts, totalCategories, totalOrders, recentProducts, recentOrders] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      // For now, we'll return 0 for orders since the Order model might not exist
      0,
      // Get 5 most recent products
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      // We'll handle recent orders later if the model exists
      [],
    ]);

    // Calculate stats
    const avgProductPrice = await prisma.product.aggregate({
      _avg: {
        price: true,
      },
    });

    return NextResponse.json({
      stats: {
        totalProducts,
        totalCategories,
        totalOrders,
        avgProductPrice: avgProductPrice._avg.price || 0,
      },
      recentActivity: {
        recentProducts: recentProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category?.name,
          createdAt: p.createdAt,
        })),
        recentOrders: recentOrders,
      },
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
