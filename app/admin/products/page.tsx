'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    imageUrl: string | null;
    category: { id: string; name: string } | null;
    images: { id: string; url: string; alt: string }[];
    createdAt: string;
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export default function AdminProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts(search = '') {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/products?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.data || []);
                setPagination(data.pagination || null);
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts(searchTerm);
    };

    const openDeleteModal = (product: Product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Remove from local state
                setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
                closeDeleteModal();
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete product');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete product');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-novraux-charcoal dark:text-white">Products</h1>
                    {pagination && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {pagination.total} product{pagination.total !== 1 ? 's' : ''} total
                        </p>
                    )}
                </div>
                <Link
                    href="/admin/products/new"
                    className="px-6 py-2.5 bg-novraux-charcoal dark:bg-white text-white dark:text-neutral-900 text-sm uppercase tracking-wider hover:bg-black dark:hover:bg-neutral-100 transition-colors rounded"
                >
                    + Add New
                </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded text-sm hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                    Search
                </button>
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            fetchProducts();
                        }}
                        className="px-4 py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-sm"
                    >
                        Clear
                    </button>
                )}
            </form>

            {/* Products Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
                        <div className="inline-block w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
                        <p>Loading products...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 text-xs uppercase tracking-wider text-novraux-grey dark:text-neutral-400">
                                <tr>
                                    <th className="p-4">Image</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4 hidden sm:table-cell">SKU / ID</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4 hidden md:table-cell">Category</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {products.map((product) => {
                                    const displayImage = product.images[0]?.url || product.imageUrl;

                                    return (
                                        <tr key={product.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="p-4 w-20">
                                                <div className="relative w-12 h-16 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                                                    {displayImage ? (
                                                        <Image
                                                            src={displayImage}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-novraux-charcoal dark:text-white">{product.name}</span>
                                                <span className="block text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 sm:hidden">
                                                    {product.id.slice(-8)}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-novraux-grey dark:text-neutral-500 hidden sm:table-cell">
                                                {product.id.slice(-8)}
                                            </td>
                                            <td className="p-4 text-novraux-charcoal dark:text-white">
                                                ${Number(product.price).toFixed(2)}
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                {product.category ? (
                                                    <span className="inline-block px-2 py-1 bg-novraux-beige/20 dark:bg-neutral-700 text-novraux-charcoal dark:text-neutral-300 text-xs rounded">
                                                        {product.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-400 dark:text-neutral-500 italic text-xs">Uncategorized</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/products/${product.id}`}
                                                        className="px-3 py-1.5 text-xs font-medium text-novraux-navy dark:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(product)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-novraux-grey dark:text-neutral-400">
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && productToDelete && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Delete Product</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                    Are you sure you want to delete <strong>&quot;{productToDelete.name}&quot;</strong>? This action cannot be undone and will also remove all associated images from storage.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Product'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
