'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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
                    // Pre-fill form
                    setForm({
                        name: found.name,
                        slug: found.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        description: found.description || '',
                        price: 25.0, // Default for luxury basics
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

    if (loading) return <div className="p-8 text-novraux-bone/60">Loading product details...</div>;
    if (error) return <div className="p-8 text-red-400">{error} <Link href="/admin/print-providers" className="underline ml-2">Back to Catalog</Link></div>;
    if (!productData) return null;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link href="/admin/print-providers" className="text-xs text-novraux-bone/40 hover:text-novraux-bone mb-2 block">&larr; Back to Catalog</Link>
                    <h1 className="text-2xl font-serif text-novraux-bone">Import Product</h1>
                    <p className="text-novraux-bone/60 text-sm">Customize details before publishing to your store.</p>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={importing}
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
                        <h3 className="text-lg font-serif text-novraux-bone">Search Engine Optimization</h3>

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
                        <h3 className="text-lg font-serif text-novraux-bone mb-4">Variants to Import</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs uppercase text-novraux-bone/40 pb-2 border-b border-novraux-bone/5">
                                <span>Variant</span>
                                <span>Select</span>
                            </div>
                            {productData.variants.map((v: any) => (
                                <div key={v.id} className="flex items-center justify-between py-2 hover:bg-novraux-bone/5 px-2 -mx-2 rounded-sm transition-colors">
                                    <div className="flex items-center gap-3">
                                        {v.image && (
                                            <div className="w-8 h-8 relative rounded-sm overflow-hidden bg-white/5">
                                                <Image src={v.image} alt={v.name} fill sizes="32px" className="object-cover" />
                                            </div>
                                        )}
                                        <div className="text-sm text-novraux-bone">
                                            <p>{v.name}</p>
                                            <p className="text-xs text-novraux-bone/40">{v.size} / {v.color}</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.selectedVariants.includes(v.id)}
                                        onChange={() => toggleVariant(v.id)}
                                        className="w-4 h-4 rounded-sm border-novraux-bone/20 bg-transparent text-novraux-bone focus:ring-0 focus:ring-offset-0"
                                    />
                                </div>
                            ))}
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

                    <div className="bg-novraux-bone/5 p-6 rounded-sm border border-novraux-bone/10">
                        <h3 className="text-lg font-serif text-novraux-bone mb-2">AI SEO</h3>
                        <p className="text-xs text-novraux-bone/60 mb-4">
                            SEO metadata will be automatically generated upon publishing based on your customized name and description.
                        </p>
                        <div className="text-xs text-novraux-bone/40 p-3 bg-black/20 rounded-sm">
                            <p className="font-mono">Start publishing to generate:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Meta Title</li>
                                <li>Meta Description</li>
                                <li>Keywords</li>
                                <li>Canonical Slug</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
