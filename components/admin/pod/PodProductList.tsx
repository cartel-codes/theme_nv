import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PodProduct {
    id: string;
    name: string;
    externalId: string;
    mockupUrls: any;
    isPublished: boolean;
    variants: any[];
}

export default function PodProductList({ provider = 'printful' }: { provider?: string }) {
    const [products, setProducts] = useState<PodProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [publishing, setPublishing] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, [page, provider]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/print-providers/products?page=${page}&limit=5&provider=${provider}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Failed to load products', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (product: PodProduct) => {
        setPublishing(product.externalId);
        try {
            const res = await fetch('/api/admin/print-providers/products/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    externalId: product.externalId,
                    name: product.name,
                    description: 'Imported from Printful', // Could be better mapped
                    price: 0, // Needs manual adjustment or logic
                    categoryId: 'uncategorized', // Needs logic
                    slug: product.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Product published successfully!');
                //Ideally refresh list or update local state to show "Published"
            } else {
                alert('Failed to publish: ' + data.error);
            }
        } catch (error) {
            alert('Error publishing product');
        } finally {
            setPublishing(null);
        }
    };

    if (loading && products.length === 0) return <div className="text-novraux-bone/60 text-xs p-4">Loading products...</div>;

    return (
        <div className="bg-novraux-bone/5 rounded-sm border border-novraux-bone/10 overflow-hidden">
            <div className="p-4 border-b border-novraux-bone/10">
                <h3 className="font-serif text-novraux-bone">Synced Products</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-novraux-bone/5 text-novraux-bone/60 uppercase tracking-novraux-medium">
                        <tr>
                            <th className="p-3">Image</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Ext. ID</th>
                            <th className="p-3">Variants</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-novraux-bone/5">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-novraux-bone/5 transition-colors">
                                <td className="p-3">
                                    <div className="w-12 h-12 relative bg-novraux-bone/10 rounded-sm overflow-hidden">
                                        {product.mockupUrls?.main ? (
                                            <Image
                                                src={product.mockupUrls.main}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-novraux-bone/20">Img</div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-3 text-novraux-bone font-medium">{product.name}</td>
                                <td className="p-3 text-novraux-bone/60">{product.externalId}</td>
                                <td className="p-3 text-novraux-bone/60">{product.variants?.length || 0}</td>
                                <td className="p-3">
                                    <Link
                                        href={`/admin/print-providers/import/${product.externalId}`}
                                        className="text-[10px] uppercase tracking-novraux-medium bg-novraux-bone text-novraux-obsidian px-2 py-1 rounded-sm hover:bg-white transition-colors inline-block"
                                    >
                                        Import
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 border-t border-novraux-bone/10 flex justify-between items-center text-xs text-novraux-bone/60">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="disabled:opacity-30 hover:text-novraux-bone"
                >
                    &larr; Prev
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="disabled:opacity-30 hover:text-novraux-bone"
                >
                    Next &rarr;
                </button>
            </div>
        </div>
    );
}
