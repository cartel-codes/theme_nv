'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuantitySelector from './QuantitySelector';

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
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
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.status === 401) {
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (res.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 3000);
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
    <div className="space-y-6">
      <QuantitySelector
        initialQuantity={quantity}
        onChange={setQuantity}
      />

      <button
        onClick={handleAddToCart}
        disabled={loading || added}
        className={`
          w-full border-2 px-8 py-4 text-[11px] font-semibold tracking-[0.3em] uppercase 
          transition-all duration-300 relative overflow-hidden group
          ${added
            ? 'border-green-600 bg-green-50 text-green-700'
            : 'border-[#B8926A] text-[#2C2C2C] bg-[#FAF8F5] hover:bg-[#B8926A] hover:text-white hover:shadow-[0_4px_16px_rgba(184,146,106,0.3)]'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <span className="relative">
          {loading ? 'Adding...' : added ? '✓ Added to cart' : 'Add to cart'}
        </span>
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center animate-fadeIn font-medium">{error}</p>
      )}
    </div>
  );
}
