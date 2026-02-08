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
    inventory?: { quantity: number; reserved: number }[];
    createdAt: string;
    isPublished: boolean;
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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [bulkPublishOpen, setBulkPublishOpen] = useState(false);
    const [bulkPublishing, setBulkPublishing] = useState(false);
    const [publishAction, setPublishAction] = useState<'publish' | 'unpublish'>('publish');

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

    const toggleSelection = (productId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === products.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(product => product.id)));
        }
    };

    const closeBulkDelete = () => {
        setBulkDeleteOpen(false);
    };

    const handleBulkPublish = async () => {
        if (selectedIds.size === 0) return;

        setBulkPublishing(true);
        try {
            const ids = Array.from(selectedIds);
            const isPublished = publishAction === 'publish';
            
            const results = await Promise.all(
                ids.map(id => 
                    fetch(`/api/admin/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isPublished })
                    })
                )
            );

            const failed = results.filter(res => !res.ok);
            if (failed.length > 0) {
                const data = await failed[0].json();
                throw new Error(data.error || 'Failed to update selected products');
            }

            // Refresh products list
            await fetchProducts(searchTerm);
            setSelectedIds(new Set());
            setBulkPublishOpen(false);
        } catch (error: any) {
            console.error('Bulk publish failed:', error);
            alert(error.message || 'Failed to update products');
        } finally {
            setBulkPublishing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setBulkDeleting(true);
        try {
            const ids = Array.from(selectedIds);
            const results = await Promise.all(
                ids.map(id => fetch(`/api/admin/products/${id}`, { method: 'DELETE' }))
            );

            const failed = results.filter(res => !res.ok);
            if (failed.length > 0) {
                const data = await failed[0].json();
                throw new Error(data.error || 'Failed to delete selected products');
            }

            setProducts(prev => prev.filter(product => !selectedIds.has(product.id)));
            setSelectedIds(new Set());
            setBulkDeleteOpen(false);
            router.refresh();
        } catch (err) {
            console.error('Bulk delete failed:', err);
            alert(err instanceof Error ? err.message : 'Bulk delete failed');
        } finally {
            setBulkDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Products</h1>
                    {pagination && (
                        <p className="text-sm text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">
                            {pagination.total} product{pagination.total !== 1 ? 's' : ''} total
                        </p>
                    )}
                </div>
                <Link
                    href="/admin/products/new"
                    className="px-8 py-4 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian text-xs uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-colors font-normal rounded-sm"
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
                    className="flex-1 px-4 py-2 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-graphite dark:text-novraux-bone bg-novraux-bone text-novraux-obsidian placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50 transition-colors"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-novraux-obsidian dark:bg-novraux-graphite text-novraux-bone dark:text-novraux-bone rounded-sm text-sm hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-gold dark:hover:text-novraux-obsidian transition-colors font-normal uppercase tracking-novraux-medium"
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
                        className="px-4 py-2 text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone text-sm font-normal transition-colors"
                    >
                        Clear
                    </button>
                )}
            </form>

            {selectedIds.size > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-novraux-bone dark:bg-novraux-graphite border border-novraux-ash/10 dark:border-novraux-graphite rounded-sm p-4">
                    <div className="text-sm text-novraux-obsidian dark:text-novraux-bone">
                        {selectedIds.size} selected
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => {
                                setPublishAction('publish');
                                setBulkPublishOpen(true);
                            }}
                            className="px-4 py-2 text-xs font-normal bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors uppercase tracking-novraux-medium"
                        >
                            Publish Selected
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setPublishAction('unpublish');
                                setBulkPublishOpen(true);
                            }}
                            className="px-4 py-2 text-xs font-normal bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition-colors uppercase tracking-novraux-medium"
                        >
                            Unpublish Selected
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-2 text-xs text-novraux-ash dark:text-novraux-bone/70 hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors uppercase tracking-novraux-medium"
                        >
                            Clear Selection
                        </button>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteOpen(true)}
                            className="px-4 py-2 text-xs font-normal bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors uppercase tracking-novraux-medium"
                        >
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-sm border border-novraux-ash/10 dark:border-novraux-graphite overflow-hidden transition-colors">
                {loading ? (
                    <div className="p-8 text-center text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                        <div className="inline-block w-6 h-6 border-2 border-novraux-gold border-t-novraux-obsidian rounded-full animate-spin mb-2"></div>
                        <p className="font-light">Loading products...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-novraux-obsidian/5 dark:bg-novraux-obsidian/20 border-b border-novraux-ash/20 dark:border-novraux-graphite text-xs uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                                <tr>
                                    <th className="p-4 font-normal w-10">
                                        <input
                                            type="checkbox"
                                            checked={products.length > 0 && selectedIds.size === products.length}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-novraux-ash/30 text-novraux-gold focus:ring-novraux-gold"
                                            aria-label="Select all products"
                                        />
                                    </th>
                                    <th className="p-4 font-normal">Image</th>
                                    <th className="p-4 font-normal">Name</th>
                                    <th className="p-4 font-normal hidden sm:table-cell">SKU / ID</th>
                                    <th className="p-4 font-normal">Price</th>
                                    <th className="p-4 font-normal hidden md:table-cell">Category</th>
                                    <th className="p-4 font-normal">Stock</th>
                                    <th className="p-4 font-normal text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-novraux-ash/10 dark:divide-novraux-graphite transition-colors">
                                {products.map((product) => {
                                    const displayImage = product.images[0]?.url || product.imageUrl;
                                    const totalStock = product.inventory?.reduce((acc, item) => acc + item.quantity, 0) || 0;

                                    return (
                                        <tr key={product.id} className="hover:bg-novraux-obsidian/5 dark:hover:bg-novraux-obsidian/30 transition-colors">
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(product.id)}
                                                    onChange={() => toggleSelection(product.id)}
                                                    className="h-4 w-4 rounded border-novraux-ash/30 text-novraux-gold focus:ring-novraux-gold"
                                                    aria-label={`Select ${product.name}`}
                                                />
                                            </td>
                                            <td className="p-4 w-20">
                                                <div className="relative w-12 h-16 bg-novraux-graphite dark:bg-novraux-obsidian rounded-sm overflow-hidden">
                                                    {displayImage ? (
                                                        <Image
                                                            src={displayImage}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-novraux-ash/30 dark:text-novraux-bone/30">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <span className="font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">{product.name}</span>
                                                        <span className="block text-xs text-novraux-ash/60 dark:text-novraux-bone/60 mt-0.5 sm:hidden font-light transition-colors">
                                                            {product.id.slice(-8)}
                                                        </span>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                                                        product.isPublished 
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                                                    }`}>
                                                        {product.isPublished ? 'Published' : 'Draft'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-novraux-ash dark:text-novraux-bone/70 hidden sm:table-cell font-light transition-colors">
                                                {product.id.slice(-8)}
                                            </td>
                                            <td className="p-4 text-novraux-obsidian dark:text-novraux-bone font-medium transition-colors">
                                                ${Number(product.price).toFixed(2)}
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                {product.category ? (
                                                    <span className="inline-block px-2 py-1 bg-novraux-gold/20 dark:bg-novraux-gold/10 text-novraux-obsidian dark:text-novraux-gold text-xs rounded-sm font-normal transition-colors">
                                                        {product.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-novraux-ash dark:text-novraux-bone/70 italic text-xs font-light transition-colors">Uncategorized</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium ${totalStock === 0
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        : totalStock <= 5
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                    {totalStock === 0 ? 'Out of Stock' : totalStock <= 5 ? `Low Stock: ${totalStock}` : `In Stock: ${totalStock}`}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/products/${product.id}`}
                                                        className="px-3 py-1.5 text-xs font-normal text-novraux-gold dark:text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-obsidian rounded-sm transition-colors uppercase tracking-novraux-medium"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => openDeleteModal(product)}
                                                        className="px-3 py-1.5 text-xs font-normal text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors uppercase tracking-novraux-medium"
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
                                        <td colSpan={8} className="p-8 text-center text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {bulkDeleteOpen && (
                <div className="fixed inset-0 bg-novraux-obsidian/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-colors">
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-xl max-w-md w-full p-6 space-y-4 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">Delete Products</h3>
                                <p className="text-sm text-novraux-ash dark:text-novraux-bone/70 mt-1 font-light transition-colors">
                                    Are you sure you want to delete {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={closeBulkDelete}
                                disabled={bulkDeleting}
                                className="px-4 py-2 text-sm font-normal text-novraux-obsidian dark:text-novraux-bone hover:bg-novraux-ash/10 dark:hover:bg-novraux-obsidian rounded-sm transition-colors disabled:opacity-50 uppercase tracking-novraux-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                                className="px-4 py-2 text-sm font-normal bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 uppercase tracking-novraux-medium"
                            >
                                {bulkDeleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Products'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {bulkPublishOpen && (
                <div className="fixed inset-0 bg-novraux-obsidian/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-colors">
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-xl max-w-md w-full p-6 space-y-4 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                publishAction === 'publish' 
                                    ? 'bg-green-100 dark:bg-green-900/30' 
                                    : 'bg-gray-100 dark:bg-gray-900/30'
                            }`}>
                                <svg className={`w-5 h-5 ${
                                    publishAction === 'publish' 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-gray-600 dark:text-gray-400'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">
                                    {publishAction === 'publish' ? 'Publish' : 'Unpublish'} Products
                                </h3>
                                <p className="text-sm text-novraux-ash dark:text-novraux-bone/70 mt-1 font-light transition-colors">
                                    {publishAction === 'publish' 
                                        ? `Make ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} visible on the storefront?`
                                        : `Hide ${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} from the storefront?`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setBulkPublishOpen(false)}
                                disabled={bulkPublishing}
                                className="px-4 py-2 text-sm font-normal text-novraux-obsidian dark:text-novraux-bone hover:bg-novraux-ash/10 dark:hover:bg-novraux-obsidian rounded-sm transition-colors disabled:opacity-50 uppercase tracking-novraux-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkPublish}
                                disabled={bulkPublishing}
                                className={`px-4 py-2 text-sm font-normal text-white rounded-sm transition-colors disabled:opacity-50 flex items-center gap-2 uppercase tracking-novraux-medium ${
                                    publishAction === 'publish'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-gray-600 hover:bg-gray-700'
                                }`}
                            >
                                {bulkPublishing ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Updating...
                                    </>
                                ) : (
                                    publishAction === 'publish' ? 'Publish Products' : 'Unpublish Products'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && productToDelete && (
                <div className="fixed inset-0 bg-novraux-obsidian/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-colors">
                    <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm shadow-xl max-w-md w-full p-6 space-y-4 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">Delete Product</h3>
                                <p className="text-sm text-novraux-ash dark:text-novraux-bone/70 mt-1 font-light transition-colors">
                                    Are you sure you want to delete <strong>&quot;{productToDelete.name}&quot;</strong>? This action cannot be undone and will also remove all associated images from storage.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-normal text-novraux-obsidian dark:text-novraux-bone hover:bg-novraux-ash/10 dark:hover:bg-novraux-obsidian rounded-sm transition-colors disabled:opacity-50 uppercase tracking-novraux-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-normal bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 uppercase tracking-novraux-medium"
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
