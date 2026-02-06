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
        <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-8 py-4 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian rounded-sm text-xs hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone transition-all font-normal uppercase tracking-novraux-medium"
        >
          {showForm ? '✕ Close' : '+ Add Collection'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-sm text-sm font-light transition-colors">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite p-8 space-y-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">Basic Information</h3>
              <div>
                <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                  placeholder="Collection name"
                />
              </div>

              <div>
                <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                  placeholder="collection-slug"
                />
              </div>

              <div>
                <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                  placeholder="Tell the story of this collection..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-light text-novraux-obsidian dark:text-novraux-bone transition-colors">SEO Settings</h3>
                <button
                  type="button"
                  onClick={handleAiGenerateSEO}
                  disabled={isAiGenerating || !formData.name}
                  title={!formData.name ? "Enter a collection name to enable AI generation" : "Generate SEO metadata using AI"}
                  className="px-4 py-2 text-xs font-medium bg-novraux-gold text-novraux-obsidian rounded-sm hover:bg-novraux-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-novraux-medium"
                >
                  {isAiGenerating ? (
                    <>
                      <span className="w-3 h-3 border-2 border-novraux-obsidian/30 border-t-novraux-obsidian rounded-full animate-spin"></span>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>🤖 AI Generate</>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  maxLength={60}
                  className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
                  placeholder="SEO title"
                />
              </div>

              <div>
                <label className="block text-xs font-normal uppercase tracking-novraux-medium text-novraux-obsidian dark:text-novraux-bone mb-2 transition-colors">Meta Description</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-3 border border-novraux-ash/20 dark:border-novraux-graphite rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-novraux-gold dark:bg-novraux-obsidian dark:text-novraux-bone bg-white text-novraux-obsidian transition-colors placeholder:text-novraux-ash dark:placeholder:text-novraux-bone/50"
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

          <div className="flex gap-3 pt-4 border-t border-novraux-ash/20 dark:border-novraux-graphite transition-colors">
            <button
              type="submit"
              className="px-6 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian rounded-sm text-sm font-medium uppercase tracking-novraux-medium hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian transition-colors"
            >
              {editingId ? 'Update Collection' : 'Create Collection'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-novraux-ash/30 dark:border-novraux-graphite rounded-sm text-sm font-medium uppercase tracking-novraux-medium hover:bg-novraux-ash/10 dark:hover:bg-novraux-graphite/50 transition-colors text-novraux-obsidian dark:text-novraux-bone"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="bg-novraux-bone dark:bg-novraux-graphite rounded-sm border border-novraux-ash/10 dark:border-novraux-graphite overflow-hidden shadow-sm transition-colors">
        {loading ? (
          <div className="p-12 text-center text-novraux-ash dark:text-novraux-bone/70 transition-colors">
            <span className="w-6 h-6 border-2 border-novraux-gold border-t-novraux-obsidian rounded-full animate-spin inline-block mr-3 vertical-middle"></span>
            <span className="font-light">Loading collections...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">
            No collections found. <button onClick={() => setShowForm(true)} className="text-novraux-gold hover:text-novraux-obsidian dark:hover:text-novraux-bone font-normal hover:underline transition-colors">Add your first one</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-novraux-obsidian/5 dark:bg-novraux-obsidian/20 border-b border-novraux-ash/20 dark:border-novraux-graphite transition-colors">
                <th className="px-6 py-4 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 transition-colors">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 text-center transition-colors">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-xs font-normal uppercase tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 text-right transition-colors">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-novraux-ash/10 dark:divide-novraux-graphite transition-colors">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-novraux-obsidian/5 dark:hover:bg-novraux-obsidian/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-medium text-novraux-obsidian dark:text-novraux-bone transition-colors">{category.name}</p>
                    {category.description && (
                      <p className="text-xs text-novraux-ash dark:text-novraux-bone/70 line-clamp-1 font-light transition-colors">{category.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-novraux-ash dark:text-novraux-bone/70 font-mono text-xs font-light transition-colors">
                    /{category.slug}
                  </td>
                  <td className="px-6 py-4 text-novraux-ash dark:text-novraux-bone/70 text-center transition-colors">
                    <span className="px-2 py-1 bg-novraux-gold/20 dark:bg-novraux-gold/10 text-novraux-obsidian dark:text-novraux-gold rounded-sm text-xs font-normal transition-colors">
                      {category._count.products} items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-novraux-gold/20 dark:bg-novraux-gold/10 text-novraux-obsidian dark:text-novraux-gold rounded-sm hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-gold dark:hover:text-novraux-obsidian transition-colors uppercase tracking-novraux-medium font-normal"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors uppercase tracking-novraux-medium font-normal"
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
