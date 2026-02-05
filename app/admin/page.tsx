import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const [productCount, categoryCount, postCount] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.post.count(),
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-serif text-3xl text-novraux-charcoal">Dashboard</h1>
                <p className="text-novraux-grey mt-2">Welcome back to the atelier.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h3 className="text-sm uppercase tracking-wider text-novraux-grey">Products</h3>
                    <p className="text-3xl font-serif mt-2 text-novraux-charcoal">{productCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h3 className="text-sm uppercase tracking-wider text-novraux-grey">Collections</h3>
                    <p className="text-3xl font-serif mt-2 text-novraux-charcoal">{categoryCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100">
                    <h3 className="text-sm uppercase tracking-wider text-novraux-grey">Journal Posts</h3>
                    <p className="text-3xl font-serif mt-2 text-novraux-charcoal">{postCount}</p>
                </div>
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
