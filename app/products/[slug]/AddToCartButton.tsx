'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleAddToCart() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.status === 401) {
        // Not authenticated - redirect to login
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (res.ok) {
        setAdded(true);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={loading || added}
        className="mt-10 w-full border border-[rgba(201,169,110,0.4)] px-8 py-4 text-xs font-light tracking-[0.25em] text-[#c9a96e] uppercase transition-all hover:bg-[rgba(201,169,110,0.08)] hover:border-[#c9a96e] disabled:opacity-50 disabled:hover:bg-transparent"
      >
        {loading ? 'Adding...' : added ? 'Added to cart ✓' : 'Add to cart'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
