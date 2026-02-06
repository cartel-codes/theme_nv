'use client';

import { useState, useEffect } from 'react';

interface Variant {
    id: string;
    name: string;
    value: string;
    sku: string;
    price: number | null;
    inventory?: {
        quantity: number;
    };
}

interface ProductVariantFormProps {
    productId: string;
}

export default function ProductVariantForm({ productId }: ProductVariantFormProps) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New variant form state
    const [newVariant, setNewVariant] = useState({
        name: 'Size',
        value: '',
        sku: '',
        price: '',
        stock: '0',
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchVariants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const fetchVariants = async () => {
        try {
            const res = await fetch(`/api/admin/products/${productId}/variants`);
            if (!res.ok) throw new Error('Failed to fetch variants');
            const data = await res.json();
            setVariants(data);
        } catch (err) {
            setError('Failed to load variants');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/products/${productId}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVariant),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create variant');
            }

            const created = await res.json();
            setVariants([created, ...variants]);

            // Reset form but keep name (e.g. keep "Size" selected)
            setNewVariant(prev => ({
                ...prev,
                value: '',
                sku: '',
                price: '',
                stock: '0',
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create variant');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (variantId: string) => {
        if (!confirm('Are you sure you want to delete this variant?')) return;

        try {
            const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete variant');

            setVariants(variants.filter(v => v.id !== variantId));
        } catch (err) {
            alert('Failed to delete variant');
        }
    };

    if (loading) return <div>Loading variants...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 mt-8">
            <h2 className="text-xl font-serif text-novraux-charcoal mb-6">Product Variants</h2>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Create New Variant Form */}
            <div className="mb-8 p-4 bg-neutral-50 rounded border border-neutral-200">
                <h3 className="font-medium mb-4 text-novraux-charcoal">Add New Variant</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Type</label>
                        <select
                            value={newVariant.name}
                            onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm"
                        >
                            <option value="Size">Size</option>
                            <option value="Color">Color</option>
                            <option value="Material">Material</option>
                            <option value="Style">Style</option>
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Value</label>
                        <input
                            type="text"
                            placeholder="e.g. Large"
                            value={newVariant.value}
                            onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm"
                            required
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">SKU</label>
                        <input
                            type="text"
                            placeholder="Unique SKU"
                            value={newVariant.sku}
                            onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm"
                            required
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Price (Optional)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Override"
                            value={newVariant.price}
                            onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Stock</label>
                        <input
                            type="number"
                            value={newVariant.stock}
                            onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm"
                            required
                        />
                    </div>

                    <div className="md:col-span-1">
                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full px-3 py-2 bg-novraux-charcoal text-white text-sm rounded hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {creating ? 'Adding...' : 'Add Variant'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Variants List */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Variant</th>
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3">Price Override</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {variants.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                                    No variants added yet. This product is sold as a single item.
                                </td>
                            </tr>
                        ) : (
                            variants.map((variant) => (
                                <tr key={variant.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-3 font-medium">
                                        <span className="text-neutral-500 mr-1">{variant.name}:</span>
                                        {variant.value}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{variant.sku}</td>
                                    <td className="px-4 py-3">
                                        {variant.price ? `$${Number(variant.price).toFixed(2)}` : <span className="text-neutral-400">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(variant.inventory?.quantity || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {variant.inventory?.quantity || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(variant.id)}
                                            className="text-red-600 hover:text-red-900 text-xs font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
