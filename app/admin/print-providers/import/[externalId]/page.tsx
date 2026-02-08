'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import SEOPreview from '@/components/SEOPreview';
import SEOHealthIndicator from '@/components/SEOHealthIndicator';

interface PodVariant {
    id: number;
    name: string;
    size: string;
    color: string;
    image: string;
    price: string;
    inStock: boolean;
}

interface ProductForm {
    name: string;
    slug: string;
    description: string;
    price: number;
    selectedVariants: number[]; // Variant IDs
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
}

export default function ImportProductPage() {
    const params = useParams();
    const router = useRouter();
    const externalId = params.externalId as string;

    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [productData, setProductData] = useState<any>(null);
    const [form, setForm] = useState<ProductForm>({
        name: '',
        slug: '',
        description: '',
        price: 0,
        selectedVariants: [],
        metaTitle: '',
        metaDescription: '',
        keywords: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [generatingSEO, setGeneratingSEO] = useState(false);
    const [showOnlyInStock, setShowOnlyInStock] = useState(false);

    useEffect(() => {
        fetchProductDetails();
    }, [externalId]);

    const fetchProductDetails = async () => {
        try {
            // We don't have a direct "get single synced product" endpoint yet, 
            // but we can search for it or filter the list. 
            // For efficiency, let's just fetch the synced list and find it. 
            // Ideally backend should have GET /api/admin/print-providers/products/[id]
            // Implementing that endpoint or fetching efficiently would be better.
            // For now, let's assume we can pass basic info via URL or fetch list.
            // Let's implement a quick fetcher in the component for now using the list endpoint
            // and filtering client side (not optimal but works for MVP).
            // BETTER: implement GET /api/admin/print-providers/products/[externalId] in API first?
            // No, let's stick to the plan: fetch cached data. 
            // I'll reuse the existing GET /products and filter, or add a specific route if needed.
            // Actually, checking `route.ts`, we don't have a single item fetch. 
            // Let's create a specialized server action or route handler for single item if needed.
            // Or just fetch the list and find it. 

            const res = await fetch(`/api/admin/print-providers/products?limit=100`); // Fetch explicit list
            const data = await res.json();

            if (data.success) {
                const found = data.products.find((p: any) => p.externalId === externalId);
                if (found) {
                    setProductData(found);
                    // Calculate average price from variants
                    const avgPrice = found.variants && found.variants.length > 0
                        ? found.variants.reduce((sum: number, v: any) => sum + (parseFloat(v.price) || 0), 0) / found.variants.length
                        : 25.0;
                    // Pre-fill form
                    setForm({
                        name: found.name,
                        slug: found.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        description: found.description || '',
                        price: Math.round(avgPrice * 100) / 100, // Round to 2 decimals
                        selectedVariants: found.variants.map((v: any) => v.id),
                        metaTitle: found.name,
                        metaDescription: found.description?.substring(0, 160) || '',
                        keywords: ''
                    });
                } else {
                    setError('Product not found in synced catalog. Please Sync first.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        setImporting(true);
        try {
            const res = await fetch('/api/admin/print-providers/products/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    externalId,
                    name: form.name,
                    slug: form.slug,
                    description: form.description,
                    price: form.price,
                    selectedVariantIds: form.selectedVariants,
                    seo: {
                        metaTitle: form.metaTitle,
                        metaDescription: form.metaDescription,
                        keywords: form.keywords
                    }
                }),
            });
            const data = await res.json();
            if (data.success) {
                router.push('/admin/products'); // Go to main product list
            } else {
                alert('Failed: ' + data.error);
            }
        } catch (e) {
            alert('Error publishing product');
        } finally {
            setImporting(false);
        }
    };

    const toggleVariant = (id: number) => {
        setForm(prev => ({
            ...prev,
            selectedVariants: prev.selectedVariants.includes(id)
                ? prev.selectedVariants.filter(vId => vId !== id)
                : [...prev.selectedVariants, id]
        }));
    };

    const handleGenerateSEO = async () => {
        if (!form.name || !form.description) {
            alert('Please fill in product name and description first.');
            return;
        }

        setGeneratingSEO(true);
        try {
            const mainImage = productData.mockupUrls?.main || '';
            const res = await fetch('/api/admin/seo/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    type: 'product',
                    imageUrl: mainImage
                })
            });
            const data = await res.json();

            if (data.success && data.seo) {
                setForm(prev => ({
                    ...prev,
                    metaTitle: data.seo.metaTitle || prev.metaTitle,
                    metaDescription: data.seo.metaDescription || prev.metaDescription,
                    keywords: data.seo.keywords || prev.keywords,
                    slug: data.seo.suggestedSlug || prev.slug
                }));
                // Show success notification
                const successMsg = document.createElement('div');
                successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right';
                successMsg.textContent = '✓ AI SEO Generated Successfully!';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            } else {
                alert('AI SEO generation failed: ' + (data.error || 'Unknown error'));
            }
        } catch (e: any) {
            alert('Failed to generate SEO: ' + e.message);
        } finally {
            setGeneratingSEO(false);
        }
    };

    if (loading) return <div className="p-8 text-novraux-bone/60">Loading product details...</div>;
    if (error) return <div className="p-8 text-red-400">{error} <Link href="/admin/print-providers" className="underline ml-2">Back to Catalog</Link></div>;
    if (!productData) return null;

    const isValid = form.name && form.description && form.price > 0 && form.selectedVariants.length > 0;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link href="/admin/print-providers/sync" className="text-xs text-novraux-bone/40 hover:text-novraux-bone mb-2 block">&larr; Back to Catalog</Link>
                    <h1 className="text-2xl font-serif text-novraux-bone">Import Product</h1>
                    <p className="text-novraux-bone/60 text-sm">Customize details before publishing to your store.</p>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={importing || !isValid}
                    className="px-6 py-2 bg-novraux-bone text-novraux-obsidian hover:bg-white text-xs uppercase tracking-novraux-medium rounded-sm transition-colors disabled:opacity-50"
                >
                    {importing ? 'Publishing...' : 'Publish Product'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="md:col-span-2 space-y-6">

                    {/* Basic Info */}
                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10 space-y-4">
                        <h3 className="text-lg font-serif text-novraux-bone">Product Details</h3>

                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={e => setForm({ ...form, slug: e.target.value })}
                                    className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                                    className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={5}
                                className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                            />
                        </div>
                    </div>

                    {/* Search Engine Optimization */}
                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-serif text-novraux-bone">Search Engine Optimization</h3>
                            <button
                                onClick={handleGenerateSEO}
                                disabled={generatingSEO}
                                className="px-4 py-2 text-xs uppercase tracking-widest bg-novraux-bone text-novraux-obsidian hover:bg-white transition-colors rounded font-bold disabled:opacity-50 flex items-center gap-2"
                            >
                                {generatingSEO ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-novraux-obsidian/20 border-t-novraux-obsidian rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>🤖 Generate AI SEO</>
                                )}
                            </button>
                        </div>

                        {/* SEO Health Indicator */}
                        <SEOHealthIndicator
                            product={{
                                metaTitle: form.metaTitle || '',
                                metaDescription: form.metaDescription || '',
                                focusKeyword: form.keywords?.split(',')[0] || '',
                                description: form.description,
                                images: (productData.mockupUrls?.all || []).map((url: string, idx: number) => ({
                                    url,
                                    alt: `${form.name} - View ${idx + 1}`
                                }))
                            }}
                        />

                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">Meta Title</label>
                            <input
                                type="text"
                                value={form.metaTitle || ''}
                                onChange={e => setForm({ ...form, metaTitle: e.target.value })}
                                className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">Meta Description</label>
                            <textarea
                                value={form.metaDescription || ''}
                                onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                                rows={3}
                                className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-novraux-medium text-novraux-bone/60 mb-1">Keywords</label>
                            <input
                                type="text"
                                value={form.keywords || ''}
                                onChange={e => setForm({ ...form, keywords: e.target.value })}
                                className="w-full bg-novraux-bone/5 border border-novraux-bone/10 rounded-sm p-2 text-novraux-bone text-sm focus:outline-none focus:border-novraux-bone/30"
                                placeholder="comma, separated, keywords"
                            />
                        </div>
                    </div>

                    {/* Variants */}
                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-serif text-novraux-bone">Variants to Import</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setForm(prev => ({ ...prev, selectedVariants: (showOnlyInStock ? productData.variants.filter((v:any) => v.inStock) : productData.variants).map((v: any) => v.id) }))}
                                    className="text-xs uppercase tracking-widest text-novraux-bone/60 hover:text-novraux-bone transition-colors"
                                >
                                    Select All
                                </button>
                                <span className="text-novraux-bone/20">|</span>
                                <button
                                    onClick={() => setForm(prev => ({ ...prev, selectedVariants: [] }))}
                                    className="text-xs uppercase tracking-widest text-novraux-bone/60 hover:text-novraux-bone transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs text-novraux-bone/40">
                                Selected: {form.selectedVariants.length} / {showOnlyInStock ? productData.variants.filter((v:any) => v.inStock).length : productData.variants.length} variants
                            </div>
                            <label className="flex items-center gap-2 text-xs text-novraux-bone/60 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showOnlyInStock}
                                    onChange={(e) => setShowOnlyInStock(e.target.checked)}
                                    className="w-4 h-4 rounded border-novraux-bone/30 bg-transparent checked:bg-novraux-bone text-novraux-obsidian focus:ring-0"
                                />
                                <span className="uppercase tracking-widest">Show Only In Stock</span>
                            </label>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            <div className="flex items-center justify-between text-xs uppercase text-novraux-bone/40 pb-2 border-b border-novraux-bone/5">
                                <span>Variant</span>
                                <div className="flex items-center gap-8">
                                    <span>Cost Price</span>
                                    <span>Select</span>
                                </div>
                            </div>
                            {productData.variants
                                .filter((v: any) => !showOnlyInStock || v.inStock)
                                .map((v: any) => (
                                <div key={v.id} className={`flex items-center justify-between py-3 px-3 rounded-sm transition-all ${
                                    form.selectedVariants.includes(v.id) 
                                        ? 'bg-novraux-bone/10 border border-novraux-bone/20' 
                                        : 'bg-transparent border border-transparent hover:bg-novraux-bone/5'
                                }`}>
                                    <div className="flex items-center gap-3 flex-1">
                                        {v.image && (
                                            <div className="w-10 h-10 relative rounded-sm overflow-hidden bg-white/5 flex-shrink-0 border border-novraux-bone/10">
                                                <Image src={v.image} alt={v.name} fill sizes="40px" className="object-cover" />
                                            </div>
                                        )}
                                        <div className="text-sm text-novraux-bone flex-1">
                                            <p className="font-medium">{v.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-novraux-bone/40">{v.size} / {v.color}</p>
                                                {v.inStock ? (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded uppercase tracking-wider">In Stock</span>
                                                ) : (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded uppercase tracking-wider">Out of Stock</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-novraux-bone/80 font-mono font-bold">${parseFloat(v.price || 0).toFixed(2)}</span>
                                        <input
                                            type="checkbox"
                                            checked={form.selectedVariants.includes(v.id)}
                                            onChange={() => toggleVariant(v.id)}
                                            className="w-5 h-5 rounded border-2 border-novraux-bone/30 bg-transparent checked:bg-novraux-bone checked:border-novraux-bone text-novraux-obsidian focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ))}
                            {productData.variants.filter((v: any) => !showOnlyInStock || v.inStock).length === 0 && (
                                <div className="text-center py-8 text-novraux-bone/40">
                                    <p className="text-sm">No in-stock variants available</p>
                                    <button
                                        onClick={() => setShowOnlyInStock(false)}
                                        className="text-xs uppercase tracking-widest text-novraux-bone/60 hover:text-novraux-bone transition-colors mt-2"
                                    >
                                        Show All Variants
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column: Preview & Strategy */}
                <div className="space-y-6">
                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
                        <h3 className="text-lg font-serif text-novraux-bone mb-4">Preview</h3>
                        <div className="aspect-square relative w-full bg-novraux-bone/10 rounded-sm overflow-hidden mb-4">
                            {productData.mockupUrls?.main && (
                                <Image
                                    src={productData.mockupUrls.main}
                                    alt={productData.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                            )}
                        </div>
                        <div className="text-sm text-novraux-bone/60">
                            <p>Total Variants: {productData.variants.length}</p>
                            <p>Selected: {form.selectedVariants.length}</p>
                        </div>
                    </div>

                    {/* SEO Preview */}
                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
                        <h3 className="text-lg font-serif text-novraux-bone mb-4">Search Preview</h3>
                        <SEOPreview
                            title={form.metaTitle || form.name}
                            description={form.metaDescription || form.description}
                            url={form.slug}
                            type="product"
                        />
                    </div>

                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
                        <h3 className="text-lg font-serif text-novraux-bone mb-2">Price Information</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-novraux-bone/60">Selected Variants:</span>
                                <span className="text-novraux-bone font-bold">{form.selectedVariants.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-novraux-bone/60">Average Cost:</span>
                                <span className="text-novraux-bone font-bold">
                                    ${(productData.variants
                                        .filter((v: any) => form.selectedVariants.includes(v.id))
                                        .reduce((sum: number, v: any) => sum + (parseFloat(v.price) || 0), 0) / Math.max(form.selectedVariants.length, 1))
                                        .toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-novraux-bone/10">
                                <span className="text-novraux-bone/60">Your Price:</span>
                                <span className="text-novraux-bone font-bold text-lg">${form.price}</span>
                            </div>
                            <p className="text-xs text-novraux-bone/40 pt-2">
                                Individual variant prices are pulled from Printify. Set your selling price in the form.
                            </p>
                        </div>
                    </div>

                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
                        <h3 className="text-lg font-serif text-novraux-bone mb-4">Verification Checklist</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${form.name ? 'bg-green-500 border-green-500 text-white' : 'border-novraux-bone/20'}`}>
                                    {form.name && '✓'}
                                </div>
                                <div className="text-sm">
                                    <p className="text-novraux-bone font-medium">Product Name</p>
                                    <p className="text-novraux-bone/60 text-xs">Set a clear product name</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${form.description ? 'bg-green-500 border-green-500 text-white' : 'border-novraux-bone/20'}`}>
                                    {form.description && '✓'}
                                </div>
                                <div className="text-sm">
                                    <p className="text-novraux-bone font-medium">Description</p>
                                    <p className="text-novraux-bone/60 text-xs">Add product description</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${form.selectedVariants.length > 0 ? 'bg-green-500 border-green-500 text-white' : 'border-novraux-bone/20'}`}>
                                    {form.selectedVariants.length > 0 && '✓'}
                                </div>
                                <div className="text-sm">
                                    <p className="text-novraux-bone font-medium">Variants Selected</p>
                                    <p className="text-novraux-bone/60 text-xs">{form.selectedVariants.length} selected</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${form.price > 0 ? 'bg-green-500 border-green-500 text-white' : 'border-novraux-bone/20'}`}>
                                    {form.price > 0 && '✓'}
                                </div>
                                <div className="text-sm">
                                    <p className="text-novraux-bone font-medium">Price Set</p>
                                    <p className="text-novraux-bone/60 text-xs">Selling price configured</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${form.metaTitle ? 'bg-green-500 border-green-500 text-white' : 'border-novraux-bone/20'}`}>
                                    {form.metaTitle && '✓'}
                                </div>
                                <div className="text-sm">
                                    <p className="text-novraux-bone font-medium">SEO Optimized</p>
                                    <p className="text-novraux-bone/60 text-xs">Meta data configured</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
