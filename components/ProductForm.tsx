'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    categoryId: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    images: [] as any[],
  });

  useEffect(() => {
    // Fetch categories
    fetchCategories();
  }, []);

  useEffect(() => {
    // If editing, fetch product
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product');

      const product = await res.json();
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price.toString(),
        categoryId: product.categoryId || '',
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        keywords: product.keywords || '',
        images: product.images || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = productId ? 'PUT' : 'POST';
      const endpoint = productId ? `/api/admin/products/${productId}` : '/api/admin/products';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      const savedProduct = await res.json();
      router.push(`/admin/products/${savedProduct.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesUpdate = (images: any[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded border border-neutral-200 p-6 space-y-4">
        <h2 className="font-serif text-xl">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder="Product name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Slug *</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder="product-slug"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder="Product description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Price *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded border border-neutral-200 p-6 space-y-4">
        <h2 className="font-serif text-xl">Product Images</h2>
        <ImageUploader images={formData.images} onImagesChange={handleImagesUpdate} />
      </div>

      {/* SEO Settings */}
      <div className="bg-white rounded border border-neutral-200 p-6 space-y-4">
        <h2 className="font-serif text-xl">SEO Settings</h2>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Meta Title</label>
          <input
            type="text"
            name="metaTitle"
            value={formData.metaTitle}
            onChange={handleInputChange}
            maxLength={60}
            className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder="Page title for search engines"
          />
          <p className="text-xs text-neutral-500 mt-1">{formData.metaTitle.length}/60 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Meta Description</label>
          <textarea
            name="metaDescription"
            value={formData.metaDescription}
            onChange={handleInputChange}
            maxLength={160}
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder="Page description for search engines"
          />
          <p className="text-xs text-neutral-500 mt-1">{formData.metaDescription.length}/160 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Keywords</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
            placeholder="comma, separated, keywords"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-novraux-charcoal text-white rounded text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-neutral-300 rounded text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
