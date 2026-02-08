'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Pagination {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PrintProvidersSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts(1);
  }, []);

  async function handleSync() {
    setSyncing(true);
    setResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      const res = await fetch('/api/admin/print-providers/sync', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({ provider: 'printify' }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);

      if (data.success) {
        await loadProducts(1);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setResult({ 
          success: false, 
          error: 'Sync request timed out. Sync may still be in progress.',
        });
      } else {
        setResult({ 
          success: false, 
          error: error.message || 'Network error occurred.',
        });
      }
    } finally {
      setSyncing(false);
    }
  }

  async function loadProducts(page: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/print-providers/products?page=${page}&limit=5&provider=printify`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setPagination({
          current: page,
          pageSize: 5,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: page < data.pagination.totalPages,
          hasPrev: page > 1,
        });
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleProductExpand(productId: string) {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/admin/print-providers"
            className="text-novraux-ash hover:text-novraux-obsidian dark:hover:text-novraux-bone transition"
          >
            ← Back
          </Link>
        </div>
        <h1 className="text-4xl font-serif font-light text-novraux-obsidian dark:text-novraux-bone mb-2">
          Product Catalog Sync
        </h1>
        <p className="text-novraux-ash dark:text-novraux-bone/70">
          Sync Printify products with full details and variants
        </p>
      </div>

      {/* Sync Action */}
      <div className="bg-white dark:bg-novraux-graphite rounded-lg shadow-md border border-neutral-200 dark:border-novraux-graphite p-8 mb-8">
        <h2 className="text-2xl font-serif font-light text-novraux-obsidian dark:text-novraux-bone mb-4">
          Sync Catalog
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          This will fetch products from Printify with complete details including images and variants.
        </p>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-8 py-3 bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian rounded-lg hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium uppercase tracking-wide text-sm"
        >
          {syncing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Syncing (This may take a minute)...
            </span>
          ) : (
            '🔄 Sync Product Catalog'
          )}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg border-2 ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <h3 className={`font-bold mb-2 flex items-center gap-2 ${
              result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            }`}>
              {result.success ? '✅' : '❌'}
              {result.success ? 'Sync Completed!' : 'Sync Failed'}
            </h3>
            {result.message && (
              <p className={`text-sm mb-2 ${
                result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {result.message}
              </p>
            )}
            {result.count !== undefined && (
              <p className={`text-xs ${
                result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                Synced: {result.count}/{result.total} | Total available: {result.totalAvailable}
              </p>
            )}
            {result.error && (
              <p className="text-sm text-red-700 dark:text-red-400">
                {result.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="bg-white dark:bg-novraux-graphite rounded-lg shadow-md border border-neutral-200 dark:border-novraux-graphite p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-serif font-light text-novraux-obsidian dark:text-novraux-bone">
              Synced Products
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {pagination.total} total products
            </p>
          </div>
          <button
            onClick={() => loadProducts(pagination.current)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <p className="text-lg mb-2">No products synced yet</p>
            <p className="text-sm">Click "Sync Product Catalog" to get started</p>
          </div>
        ) : (
          <>
            {/* Products List */}
            <div className="space-y-4 mb-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  {/* Product Header */}
                  <div
                    className="p-4 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center justify-between"
                    onClick={() => toggleProductExpand(product.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden flex-shrink-0">
                        {product.mockupUrls?.main ? (
                          <img
                            src={product.mockupUrls.main}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-medium text-novraux-obsidian dark:text-novraux-bone">
                          {product.name}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          ID: #{product.externalId} • {Array.isArray(product.variants) ? product.variants.length : 0} variants
                        </p>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <span className={`text-2xl transition-transform ${expandedProducts.has(product.id) ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>

                  {/* Product Details (Expandable) */}
                  {expandedProducts.has(product.id) && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-novraux-graphite">
                      {/* Description */}
                      {product.description && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-2">
                            Description
                          </p>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                      )}

                      {/* Variants */}
                      {Array.isArray(product.variants) && product.variants.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mb-3">
                            Variants ({product.variants.length})
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {product.variants.slice(0, 6).map((variant: any, idx: number) => (
                              <div key={idx} className="border border-neutral-200 dark:border-neutral-700 rounded p-3">
                                {/* Variant Image */}
                                {variant.image && (
                                  <div className="w-full h-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2 overflow-hidden">
                                    <img
                                      src={variant.image}
                                      alt={variant.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                {/* Variant Info */}
                                <p className="text-xs font-medium text-novraux-obsidian dark:text-novraux-bone truncate">
                                  {variant.size ? `${variant.color} / ${variant.size}` : variant.name}
                                </p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                  ${variant.price}
                                </p>
                                <div className="mt-2 flex items-center gap-1">
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    variant.inStock
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  }`}>
                                    {variant.inStock ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {product.variants.length > 6 && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                              +{product.variants.length - 6} more variants
                            </p>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                        <span>Synced: {new Date(product.syncedAt).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded ${
                          product.isPublished
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => loadProducts(pagination.current - 1)}
                  disabled={!pagination.hasPrev || loading}
                  className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => loadProducts(page)}
                      disabled={loading}
                      className={`w-10 h-10 rounded text-sm font-medium transition ${
                        page === pagination.current
                          ? 'bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      } disabled:opacity-50`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => loadProducts(pagination.current + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
