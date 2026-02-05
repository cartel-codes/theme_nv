import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
    const products = await prisma.product.findMany({
        include: {
            category: true,
            images: {
                orderBy: { order: 'asc' },
                take: 1, // Just get the primary thumbnail
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-serif text-3xl text-novraux-charcoal">Products</h1>
                <Link
                    href="/admin/products/new"
                    className="px-6 py-2 bg-novraux-charcoal text-white text-sm uppercase tracking-wider hover:bg-black transition-colors"
                >
                    + Add New
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-100 text-xs uppercase tracking-wider text-novraux-grey">
                        <tr>
                            <th className="p-4">Image</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">SKU / ID</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Category</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {products.map((product) => {
                            // Fallback to legacy imageUrl if no images relation
                            const displayImage = product.images[0]?.url || product.imageUrl;

                            return (
                                <tr key={product.id} className="hover:bg-neutral-50/50">
                                    <td className="p-4 w-20">
                                        <div className="relative w-12 h-16 bg-neutral-100">
                                            {displayImage && (
                                                <Image
                                                    src={displayImage}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-novraux-charcoal">{product.name}</td>
                                    <td className="p-4 font-mono text-xs text-novraux-grey">{product.id.slice(-8)}</td>
                                    <td className="p-4">${Number(product.price).toFixed(2)}</td>
                                    <td className="p-4">
                                        {product.category ? (
                                            <span className="inline-block px-2 py-1 bg-novraux-beige/20 text-novraux-charcoal text-xs rounded">
                                                {product.category.name}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-400 italic">Uncategorized</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <Link
                                            href={`/admin/products/${product.id}`}
                                            className="text-novraux-navy hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-novraux-grey">No products found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
