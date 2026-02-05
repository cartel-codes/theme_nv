'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  _count: { products: number };
}

export default function CollectionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
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
        throw new Error(data.error ||  'Failed to save category');
      }

      await fetchCategories();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      metaTitle: category.metaTitle || '',
      metaDescription: category.metaDescription || '',
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({ name: '', slug: '', metaTitle: '', metaDescription: '' });
    setEditingId(null);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif tracking-wide">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-novraux-charcoal text-white rounded text-sm hover:bg-opacity-90 transition-all"
        >
          {showForm ? '✕ Close' : '+ Add Collection'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded border border-neutral-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="Collection name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="collection-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Meta Title</label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              maxLength={60}
              className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="SEO title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Meta Description</label>
            <input
              type="text"
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              maxLength={160}
              className="w-full px-4 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="SEO description"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-novraux-charcoal text-white rounded text-sm hover:bg-black transition-colors"
            >
              {editingId ? 'Update Collection' : 'Create Collection'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-neutral-300 rounded text-sm hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No collections yet. <button onClick={() => setShowForm(true)} className="text-novraux-charcoal hover:underline">Create one</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-neutral-900">{category.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {category._count.products}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="inline-block px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
