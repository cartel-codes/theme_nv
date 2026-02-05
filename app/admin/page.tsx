import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const [productCount, categoryCount, recentProducts, avgPrice] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.product.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { category: true },
        }),
        prisma.product.aggregate({
            _avg: { price: true },
        }),
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-serif text-3xl text-novraux-charcoal">Dashboard</h1>
                <p className="text-novraux-grey mt-2">Welcome back to the atelier.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h3 className="text-sm uppercase tracking-wider text-novraux-grey">Products</h3>
                    <p className="text-3xl font-serif mt-2 text-novraux-charcoal">{productCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h3 className="text-sm uppercase tracking-wider text-novraux-grey">Collections</h3>
                    <p className="text-3xl font-serif mt-2 text-novraux-charcoal">{categoryCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h3 className="text-sm uppercase tracking-wider text-novraux-grey">Avg Price</h3>
                    <p className="text-3xl font-serif mt-2 text-novraux-charcoal">${(avgPrice._avg.price || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h3 className="text-sm uppercase tracking-wider text-novraux-grey">Orders</h3>
                    <p className="text-3xl font-serif mt-2 text-novraux-charcoal">0</p>
                    <p className="text-xs text-novraux-grey mt-2">Coming soon</p>
                </div>
            </div>

            {/* Recent Products */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                <h2 className="font-serif text-xl mb-6">Recent Products</h2>
                {recentProducts.length === 0 ? (
                    <p className="text-novraux-grey">No products yet</p>
                ) : (
                    <div className="space-y-3">
                        {recentProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-3 border border-neutral-100 rounded hover:bg-neutral-50">
                                <div className="flex-1">
                                    <p className="font-medium text-novraux-charcoal">{product.name}</p>
                                    <p className="text-xs text-novraux-grey">
                                        {product.category?.name || 'Uncategorized'} • ${product.price.toFixed(2)}
                                    </p>
                                </div>
                                <Link href={`/admin/products/${product.id}`} className="text-sm text-novraux-navy hover:underline">
                                    Edit
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                <h2 className="font-serif text-xl mb-6">Quick Actions</h2>
                <div className="flex gap-4">
                    <Link
                        href="/admin/products/new"
                        className="px-6 py-3 bg-novraux-charcoal text-white text-sm uppercase tracking-wider hover:bg-black transition-colors"
                    >
                        + Add Product
                    </Link>
                    <Link
                        href="/admin/collections/new"
                        className="px-6 py-3 border border-novraux-charcoal text-novraux-charcoal text-sm uppercase tracking-wider hover:bg-neutral-50 transition-colors"
                    >
                        Create Collection
                    </Link>
                </div>
            </div>
        </div>
    );
}
