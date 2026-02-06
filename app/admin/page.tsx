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
                <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Dashboard</h1>
                <p className="text-novraux-ash dark:text-novraux-bone/70 mt-4 font-light transition-colors">Welcome back to the atelier.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 font-normal transition-colors">Products</h3>
                    <p className="text-4xl font-serif mt-4 text-novraux-obsidian dark:text-novraux-bone transition-colors">{productCount}</p>
                </div>
                <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 font-normal transition-colors">Collections</h3>
                    <p className="text-4xl font-serif mt-4 text-novraux-obsidian dark:text-novraux-bone transition-colors">{categoryCount}</p>
                </div>
                <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 font-normal transition-colors">Avg Price</h3>
                    <p className="text-4xl font-serif mt-4 text-novraux-gold">${(avgPrice._avg.price || 0).toFixed(2)}</p>
                </div>
                <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                    <h3 className="text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 font-normal transition-colors">Orders</h3>
                    <p className="text-4xl font-serif mt-4 text-novraux-obsidian dark:text-novraux-bone transition-colors">0</p>
                    <p className="text-xs text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">Coming soon</p>
                </div>
            </div>

            {/* Recent Products */}
            <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone mb-8 transition-colors">Recent Products</h2>
                {recentProducts.length === 0 ? (
                    <p className="text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">No products yet</p>
                ) : (
                    <div className="space-y-3">
                        {recentProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-4 border border-novraux-ash/10 dark:border-novraux-obsidian rounded-sm hover:bg-novraux-bone/50 dark:hover:bg-novraux-obsidian/50 transition-colors">
                                <div className="flex-1">
                                    <p className="font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">{product.name}</p>
                                    <p className="text-xs text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
                                        {product.category?.name || 'Uncategorized'} • ${product.price.toFixed(2)}
                                    </p>
                                </div>
                                <Link href={`/admin/products/${product.id}`} className="text-sm text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors font-normal uppercase tracking-wide">
                                    Edit
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-novraux-bone dark:bg-novraux-graphite p-8 rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
                <h2 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone mb-8 transition-colors">Quick Actions</h2>
                <div className="flex gap-4">
                    <Link
                        href="/admin/products/new"
                        className="px-8 py-4 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors font-normal"
                    >
                        + Add Product
                    </Link>
                    <Link
                        href="/admin/collections/new"
                        className="px-8 py-4 border border-novraux-ash dark:border-novraux-bone text-novraux-obsidian dark:text-novraux-bone text-xs uppercase tracking-novraux-medium hover:bg-novraux-obsidian hover:text-novraux-bone dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian transition-colors font-normal"
                    >
                        Create Collection
                    </Link>
                </div>
            </div>
        </div>
    );
}
