'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  async function handleAddToCart() {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        setAdded(true);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || added}
      className="mt-10 w-full border border-[rgba(201,169,110,0.4)] px-8 py-4 text-xs font-light tracking-[0.25em] text-[#c9a96e] uppercase transition-all hover:bg-[rgba(201,169,110,0.08)] hover:border-[#c9a96e] disabled:opacity-50 disabled:hover:bg-transparent"
    >
      {loading ? 'Adding...' : added ? 'Added to cart ✓' : 'Add to cart'}
    </button>
  );
}
