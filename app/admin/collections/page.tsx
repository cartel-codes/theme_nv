'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SEOPreview from '@/components/SEOPreview';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  _count: { products: number };
}

export default function CollectionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      setCategories(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category');
      }

      await fetchCategories();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleAiGenerateSEO() {
    if (!formData.name) return;

    setIsAiGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: 'category'
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate AI SEO');
      }

      const suggestion = await res.json();
      setFormData(prev => ({
        ...prev,
        metaTitle: suggestion.metaTitle,
        metaDescription: suggestion.metaDescription,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Generation failed');
    } finally {
      setIsAiGenerating(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Are you sure? This will not delete the products in this category.')) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  function startEdit(category: Category) {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      metaTitle: category.metaTitle || '',
      metaDescription: category.metaDescription || '',
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({ name: '', slug: '', description: '', metaTitle: '', metaDescription: '' });
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif tracking-wide dark:text-white">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-novraux-charcoal dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-sm hover:bg-opacity-90 transition-all font-medium"
        >
          {showForm ? '✕ Close' : '+ Add Collection'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-serif text-lg dark:text-white">Basic Information</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                  placeholder="Collection name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                  placeholder="collection-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                  placeholder="Tell the story of this collection..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg dark:text-white">SEO Settings</h3>
                <button
                  type="button"
                  onClick={handleAiGenerateSEO}
                  disabled={isAiGenerating || !formData.name}
                  title={!formData.name ? "Enter a collection name to enable AI generation" : "Generate SEO metadata using AI"}
                  className="px-3 py-1 text-xs font-medium bg-novraux-charcoal dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  maxLength={60}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                  placeholder="SEO title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-white"
                  placeholder="SEO description"
                />
              </div>

              <div className="mt-4">
                <SEOPreview
                  title={formData.metaTitle || `${formData.name} | Novraux`}
                  description={formData.metaDescription || formData.description || 'Add a meta description...'}
                  url={formData.slug}
                  type="collection"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="submit"
              className="px-6 py-2 bg-novraux-charcoal dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-sm font-medium hover:bg-black dark:hover:bg-white transition-colors"
            >
              {editingId ? 'Update Collection' : 'Create Collection'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors dark:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
            <span className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin inline-block mr-3 vertical-middle"></span>
            Loading collections...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
            No collections found. <button onClick={() => setShowForm(true)} className="text-novraux-charcoal dark:text-neutral-100 font-medium hover:underline">Add your first one</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-6 py-4 text-left font-serif tracking-wider text-neutral-700 dark:text-neutral-300">
                  Name
                </th>
                <th className="px-6 py-4 text-left font-serif tracking-wider text-neutral-700 dark:text-neutral-300">
                  Slug
                </th>
                <th className="px-6 py-4 text-left font-serif tracking-wider text-neutral-700 dark:text-neutral-300 text-center">
                  Products
                </th>
                <th className="px-6 py-4 text-left font-serif tracking-wider text-neutral-700 dark:text-neutral-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{category.name}</p>
                    {category.description && (
                      <p className="text-xs text-neutral-500 line-clamp-1">{category.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                    /{category.slug}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 text-center">
                    <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs">
                      {category._count.products} items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="inline-flex items-center px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="inline-flex items-center px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
        }
      </div>
    </div>
  );
}
