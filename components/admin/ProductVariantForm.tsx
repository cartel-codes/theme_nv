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
    }[];
}

interface ProductVariantFormProps {
    productId: string;
}

interface ColorOption {
    name: string;
    hex: string;
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

    // Bulk / Dynamic Variants State
    const STANDARD_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const STANDARD_COLORS: ColorOption[] = [
        { name: 'Obsidian', hex: '#0a0a0a' },
        { name: 'Bone', hex: '#e8e4df' },
        { name: 'Gold', hex: '#c9a96e' },
        { name: 'White', hex: '#ffffff' },
        { name: 'Black', hex: '#000000' },
        { name: 'Navy', hex: '#0f172a' },
        { name: 'Cream', hex: '#FAF8F5' },
        { name: 'Beige', hex: '#E8E3DC' },
        { name: 'Brown', hex: '#594a42' },
        { name: 'Silver', hex: '#C0C0C0' },
        { name: 'Charcoal', hex: '#36454F' }
    ];

    const [mode, setMode] = useState<'single' | 'bulk'>('bulk');
    const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#000000');
    const [bulkQuantities, setBulkQuantities] = useState<Record<string, string>>({});

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);

        const colorToAdd = selectedColor || (customColorName && { name: customColorName, hex: customColorHex });
        
        if (!colorToAdd) {
            setError('Please select or create a color');
            setCreating(false);
            return;
        }

        const hasAnyQuantity = Object.values(bulkQuantities).some(qty => qty && parseInt(qty) > 0);
        if (!hasAnyQuantity) {
            setError('Please enter stock for at least one size');
            setCreating(false);
            return;
        }

        // Generate list of variants to create based on input quantities
        const variantsToCreate = Object.entries(bulkQuantities)
            .filter(([_, qty]) => qty && parseInt(qty) > 0)
            .map(([size, qty]) => ({
                name: 'Color / Size',
                value: `${colorToAdd.name} / ${size}`,
                sku: `${productId.slice(-5)}-${colorToAdd.name.slice(0, 3)}-${size}`.toUpperCase().replace(/\s+/g, ''),
                price: '', // Use standard price logic
                stock: qty,
                colorHex: colorToAdd.hex // Store hex for reference
            }));

        if (variantsToCreate.length === 0) {
            setError('Please enter stock for at least one size');
            setCreating(false);
            return;
        }

        let addedCount = 0;
        let failedVariants = [];

        // Sequentially create variants
        for (const variant of variantsToCreate) {
            try {
                const res = await fetch(`/api/admin/products/${productId}/variants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(variant),
                });

                if (res.ok) {
                    addedCount++;
                } else {
                    const d = await res.json().catch(() => ({}));
                    failedVariants.push(`${variant.value} (${d.error || 'Unknown error'})`);
                }
            } catch (err) {
                failedVariants.push(`${variant.value} (Network error)`);
            }
        }

        if (addedCount > 0) {
            await fetchVariants();
            // Reset bulk form
            setSelectedColor(null);
            setCustomColorName('');
            setCustomColorHex('#000000');
            setBulkQuantities({});
        }

        if (failedVariants.length > 0) {
            setError(`✅ Added ${addedCount} variant(s). Failed: ${failedVariants.join(', ')}`);
        }

        setCreating(false);
    };

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

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-novraux-charcoal rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600 text-sm">Loading variants...</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 mt-8">
            <div className="mb-8">
                <h2 className="text-2xl font-serif font-light text-novraux-charcoal mb-2">Product Variants</h2>
                <p className="text-sm text-neutral-600">Manage colors, sizes, and other product variations. Use the bulk creator for quick color + size combinations.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-6 mb-8 border-b border-neutral-200 pb-4">
                <button
                    onClick={() => setMode('bulk')}
                    className={`pb-2 text-sm font-semibold uppercase tracking-wide transition-colors relative ${
                        mode === 'bulk' 
                            ? 'text-novraux-charcoal' 
                            : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                >
                    Bulk Creator
                    {mode === 'bulk' && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-novraux-charcoal rounded-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setMode('single')}
                    className={`pb-2 text-sm font-semibold uppercase tracking-wide transition-colors relative ${
                        mode === 'single' 
                            ? 'text-novraux-charcoal' 
                            : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                >
                    Single Variant
                    {mode === 'single' && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-novraux-charcoal rounded-full"></div>
                    )}
                </button>
            </div>

            {/* Bulk Creator Form */}
            {mode === 'bulk' && (
                <div className="mb-8 p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded border border-neutral-200">
                    <form onSubmit={handleBulkCreate} className="space-y-8">
                        {/* Step 1: Color Selection */}
                        <div className="bg-white p-6 rounded border border-neutral-200">
                            <h3 className="text-sm font-bold text-neutral-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-novraux-charcoal text-white text-xs rounded-full">1</span>
                                Select or Create a Color
                            </h3>

                            {/* Preset Colors Grid */}
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wide mb-3">Preset Colors</label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-3">
                                    {STANDARD_COLORS.map(color => (
                                        <button
                                            key={color.name}
                                            type="button"
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setCustomColorName('');
                                                setCustomColorHex('#000000');
                                            }}
                                            className={`relative group transition-all ${
                                                selectedColor?.name === color.name 
                                                    ? 'ring-4 ring-novraux-charcoal ring-offset-2 scale-110' 
                                                    : 'hover:scale-105'
                                            }`}
                                        >
                                            <div
                                                className="w-12 h-12 rounded-lg border-2 shadow-md transition-all"
                                                style={{
                                                    backgroundColor: color.hex,
                                                    borderColor: selectedColor?.name === color.name ? '#000' : '#ddd'
                                                }}
                                            />
                                            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                {color.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Color Input */}
                            <div className="border-t border-neutral-200 pt-6">
                                <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wide mb-3">Custom Color</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-medium mb-2">Color Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Forest Green"
                                            value={customColorName}
                                            onChange={(e) => {
                                                setCustomColorName(e.target.value);
                                                if (e.target.value) setSelectedColor(null);
                                            }}
                                            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-novraux-charcoal focus:border-transparent focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-medium mb-2">Hex Code</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={customColorHex}
                                                onChange={(e) => {
                                                    setCustomColorHex(e.target.value);
                                                    if (customColorName) setSelectedColor(null);
                                                }}
                                                className="w-12 h-10 border border-neutral-300 rounded-lg cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={customColorHex}
                                                onChange={(e) => {
                                                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                                                        setCustomColorHex(e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-novraux-charcoal focus:outline-none"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 font-medium mb-2">Preview</label>
                                        <div
                                            className="w-full h-10 rounded-lg border-2 border-neutral-300 shadow-sm"
                                            style={{ backgroundColor: customColorHex }}
                                            title={customColorName || 'Custom color preview'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Selected Color Info */}
                            {(selectedColor || customColorName) && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-900">
                                        ✓ Selected Color: <span className="font-semibold">{selectedColor?.name || customColorName}</span> 
                                        <span className="ml-2 font-mono text-xs">{selectedColor?.hex || customColorHex}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Size & Stock */}
                        <div className="bg-white p-6 rounded border border-neutral-200">
                            <h3 className="text-sm font-bold text-neutral-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-novraux-charcoal text-white text-xs rounded-full">2</span>
                                Enter Stock Quantities by Size
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                {STANDARD_SIZES.map(size => (
                                    <div key={size} className="flex flex-col">
                                        <label className="text-xs font-bold text-novraux-charcoal text-center mb-2 uppercase">{size}</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min="0"
                                            value={bulkQuantities[size] || ''}
                                            onChange={(e) => setBulkQuantities(prev => ({ ...prev, [size]: e.target.value }))}
                                            className="w-full px-2 py-2 text-center border border-neutral-300 rounded-lg focus:border-novraux-charcoal focus:ring-2 focus:ring-novraux-charcoal/20 focus:outline-none text-sm font-medium transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-neutral-500 mt-3">💡 Leave blank or 0 for sizes you don't have in stock</p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-8 py-3 bg-novraux-charcoal text-white text-sm font-bold uppercase tracking-wide rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Creating Variants...
                                    </>
                                ) : (
                                    <>
                                        ✨ Generate Variants
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Single Variant Form */}
            {mode === 'single' && (
                <div className="mb-8 p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded border border-neutral-200">
                    <h3 className="text-sm font-bold text-neutral-800 mb-6 uppercase tracking-wide flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-novraux-charcoal text-white text-xs rounded-full">+</span>
                        Add a Single Variant
                    </h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">Type *</label>
                            <select
                                value={newVariant.name}
                                onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-novraux-charcoal focus:border-transparent focus:outline-none transition-all"
                            >
                                <option value="Size">Size</option>
                                <option value="Color">Color</option>
                                <option value="Color / Size">Color / Size</option>
                                <option value="Material">Material</option>
                                <option value="Style">Style</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">Value *</label>
                            <input
                                type="text"
                                placeholder={newVariant.name === 'Color / Size' ? 'e.g. Black / L' : 'e.g. Large'}
                                value={newVariant.value}
                                onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })}
                                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-novraux-charcoal focus:border-transparent focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">SKU *</label>
                            <input
                                type="text"
                                placeholder="PROD-001"
                                value={newVariant.sku}
                                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-novraux-charcoal focus:border-transparent focus:outline-none transition-all font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">Price (Optional)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Override price"
                                value={newVariant.price}
                                onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-novraux-charcoal focus:border-transparent focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">Stock *</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={newVariant.stock}
                                onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-novraux-charcoal focus:border-transparent focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full px-6 py-2.5 bg-novraux-charcoal text-white text-sm font-bold uppercase tracking-wide rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? 'Adding...' : '+ Add'}
                        </button>
                    </form>
                </div>
            )}

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
                            variants.map((variant) => {
                                // Extract color name from variant value if it's a "Color / Size" variant
                                const isColorVariant = variant.value.includes('/');
                                const colorName = isColorVariant ? variant.value.split('/')[0].trim() : null;
                                const matchingColor = colorName 
                                    ? STANDARD_COLORS.find(c => c.name === colorName)
                                    : null;
                                
                                return (
                                    <tr key={variant.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <div className="flex items-center gap-3">
                                                {matchingColor && (
                                                    <div
                                                        className="w-6 h-6 rounded-full border border-neutral-300 shadow-sm flex-shrink-0"
                                                        style={{ backgroundColor: matchingColor.hex }}
                                                        title={matchingColor.name}
                                                    />
                                                )}
                                                <div>
                                                    <span className="text-neutral-500 text-xs">{variant.name}:</span>
                                                    <div className="text-neutral-800 font-semibold">{variant.value}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-neutral-600">{variant.sku}</td>
                                        <td className="px-4 py-3">
                                            {variant.price ? (
                                                <span className="text-neutral-800 font-medium">${Number(variant.price).toFixed(2)}</span>
                                            ) : (
                                                <span className="text-neutral-400 text-xs">Standard</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                (variant.inventory?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0) > 0 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {variant.inventory?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(variant.id)}
                                                className="text-red-600 hover:text-red-900 font-medium text-xs transition-colors hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
