'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CartActionsProps {
  itemId: string;
  quantity: number;
}

export default function CartActions({ itemId, quantity }: CartActionsProps) {
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(quantity);
  const router = useRouter();

  async function updateQuantity(newQty: number) {
    if (newQty < 1) return;
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      if (res.ok) {
        setQty(newQty);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-[rgba(201,169,110,0.2)]">
        <button
          onClick={() => updateQuantity(qty - 1)}
          disabled={loading || qty <= 1}
          className="px-3 py-2 text-[#6b6560] transition-colors hover:bg-[rgba(201,169,110,0.08)] hover:text-[#c9a96e] disabled:opacity-50"
        >
          −
        </button>
        <span className="min-w-[2.5rem] px-2 py-2 text-center text-sm text-[#e8e4df]">
          {qty}
        </span>
        <button
          onClick={() => updateQuantity(qty + 1)}
          disabled={loading}
          className="px-3 py-2 text-[#6b6560] transition-colors hover:bg-[rgba(201,169,110,0.08)] hover:text-[#c9a96e] disabled:opacity-50"
        >
          +
        </button>
      </div>
      <button
        onClick={removeItem}
        disabled={loading}
        className="text-xs tracking-[0.12em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e] disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
