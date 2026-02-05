'use client';

import { useCart } from '@/contexts/CartContext';

export default function CartIcon() {
  const { totalItems, openDrawer, isLoading } = useCart();

  return (
    <button
      onClick={openDrawer}
      className="relative p-2 text-current hover:text-[#c9a96e] transition-colors"
      aria-label={`Cart with ${totalItems} items`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
      {!isLoading && totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c9a96e] text-[10px] font-medium text-[#0a0a0a]">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}
