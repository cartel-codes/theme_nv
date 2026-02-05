'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import SEOPreview from '@/components/SEOPreview';
import SEOHealthIndicator from '@/components/SEOHealthIndicator';
import { generateAutoTitle, generateAutoDescription } from '@/lib/seo';

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
  const [isAiGenerating, setIsAiGenerating] = useState(false);
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
    ogImage: '',
    focusKeyword: '',
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
        ogImage: product.ogImage || '',
        focusKeyword: product.focusKeyword || '',
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

  const handleImageUploadedForAI = async (imageUrl: string) => {
    // Auto-trigger AI generation when image is uploaded
    console.log('📸 Image uploaded, triggering automatic AI generation...', { imageUrl });
    setIsAiGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: 'product',
          imageUrl
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('❌ AI Generation failed:', data);
        throw new Error(data.error || 'Failed to generate AI content');
      }

      const suggestion = await res.json();
      console.log('✅ AI Generation successful:', {
        hasGeneratedName: !!suggestion.generatedName,
        suggestedCategory: suggestion.suggestedCategory,
        hasGeneratedDescription: !!suggestion.generatedDescription,
      });

      // Check if we need to create a new category
      let finalCategoryId = formData.categoryId;
      if (suggestion.suggestedCategory) {
        // Try to find existing category
        const existingCategory = categories.find(
          c => c.name.toLowerCase() === suggestion.suggestedCategory.toLowerCase()
        );

        if (existingCategory) {
          finalCategoryId = existingCategory.id;
          console.log('✅ Found existing category:', existingCategory.name);
        } else {
          // Auto-create the category
          try {
            console.log('🆕 Creating new category:', suggestion.suggestedCategory);
            const categoryRes = await fetch('/api/admin/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: suggestion.suggestedCategory,
                slug: suggestion.suggestedCategory
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w-]/g, ''),
                description: `Auto-created collection for ${suggestion.generatedName || formData.name}`,
              }),
            });

            if (categoryRes.ok) {
              const newCategory = await categoryRes.json();
              finalCategoryId = newCategory.id;
              setCategories([...categories, newCategory]);
              console.log('✅ New category created:', newCategory.name);
            }
          } catch (err) {
            console.warn('⚠️ Failed to auto-create category:', err);
          }
        }
      }

      // Update form with generated content
      setFormData(prev => ({
        ...prev,
        name: (!prev.name && suggestion.generatedName) ? suggestion.generatedName : prev.name,
        slug: (!prev.slug && suggestion.suggestedSlug) ? suggestion.suggestedSlug : prev.slug,
        description: (!prev.description && suggestion.generatedDescription) ? suggestion.generatedDescription : prev.description,
        metaTitle: suggestion.metaTitle,
        metaDescription: suggestion.metaDescription,
        keywords: suggestion.keywords,
        focusKeyword: suggestion.focusKeyword,
        categoryId: finalCategoryId,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Auto-generation failed';
      console.error('❌ handleImageUploadedForAI error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAutoGenerateSEO = () => {
    setFormData(prev => ({
      ...prev,
      metaTitle: generateAutoTitle(prev.name),
      metaDescription: generateAutoDescription(prev.description, prev.name),
    }));
  };

  const handleAiGenerateSEO = async () => {
    const hasImages = formData.images && formData.images.length > 0;
    if (!formData.name && !hasImages) return;

    setIsAiGenerating(true);
    setError(null);

    try {
      // Get the first image URL if available
      const imageUrl = hasImages ? formData.images[0].url : undefined;

      const res = await fetch('/api/admin/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: 'product',
          imageUrl // Pass the image URL
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate AI SEO');
      }

      const suggestion = await res.json();

      setFormData(prev => ({
        ...prev,
        // Update name and description if they were empty and AI generated them
        name: (!prev.name && suggestion.generatedName) ? suggestion.generatedName : prev.name,
        description: (!prev.description && suggestion.generatedDescription) ? suggestion.generatedDescription : prev.description,

        metaTitle: suggestion.metaTitle,
        metaDescription: suggestion.metaDescription,
        keywords: suggestion.keywords,
        focusKeyword: suggestion.focusKeyword,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Generation failed');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Character counter color logic
  const getCharCountColor = (length: number, min: number, max: number) => {
    if (length === 0) return 'text-neutral-400';
    if (length >= min && length <= max) return 'text-green-600 dark:text-green-400';
    if (length < min) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <h2 className="font-serif text-xl dark:text-white">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
            placeholder="Product name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Slug *</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
            placeholder="product-slug"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
            placeholder="Product description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Price *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
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
      <div className="bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <h2 className="font-serif text-xl dark:text-white">Product Images</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">💡 Uploading an image will automatically generate product name, description, and SEO fields using AI</p>
        <ImageUploader 
          images={formData.images} 
          onImagesChange={handleImagesUpdate}
          onImageUploadedForAI={handleImageUploadedForAI}
        />
      </div>

      {/* SEO Settings */}
      <div className="bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl dark:text-white">SEO Settings</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAutoGenerateSEO}
              disabled={!formData.name}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✨ Basic Auto
            </button>
            <button
              type="button"
              onClick={handleAiGenerateSEO}
              disabled={isAiGenerating || (!formData.name && (!formData.images || formData.images.length === 0))}
              title={(!formData.name && (!formData.images || formData.images.length === 0)) ? "Enter a name OR upload an image to enable AI generation" : "Generate content using AI"}
              className="px-3 py-1.5 text-xs font-medium bg-novraux-charcoal dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isAiGenerating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating...
                </>
              ) : (
                <>🤖 AI Generate</>
              )}
            </button>
          </div>
        </div>

        {/* SEO Health Indicator */}
        <SEOHealthIndicator
          product={{
            metaTitle: formData.metaTitle,
            metaDescription: formData.metaDescription,
            focusKeyword: formData.focusKeyword,
            description: formData.description,
            images: formData.images,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SEO Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Meta Title
                <span className={`ml-2 text-xs ${getCharCountColor(formData.metaTitle.length, 50, 60)}`}>
                  ({formData.metaTitle.length}/60)
                </span>
              </label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleInputChange}
                maxLength={70}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                placeholder="Page title for search engines (50-60 chars)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Meta Description
                <span className={`ml-2 text-xs ${getCharCountColor(formData.metaDescription.length, 120, 160)}`}>
                  ({formData.metaDescription.length}/160)
                </span>
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                maxLength={170}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                placeholder="Page description for search engines (120-160 chars)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Focus Keyword</label>
              <input
                type="text"
                name="focusKeyword"
                value={formData.focusKeyword}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                placeholder="Primary keyword to target"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                The main keyword you want this product to rank for
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Keywords</label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                placeholder="comma, separated, keywords"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">OG Image URL</label>
              <input
                type="text"
                name="ogImage"
                value={formData.ogImage}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                placeholder="https://... (leave empty to use first product image)"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Custom image for social media sharing (1200x630px recommended)
              </p>
            </div>
          </div>

          {/* SEO Preview */}
          <div>
            <SEOPreview
              title={formData.metaTitle || `${formData.name} | Novraux`}
              description={formData.metaDescription || formData.description || 'Add a meta description...'}
              url={formData.slug}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-novraux-charcoal dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-sm font-medium hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors dark:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
