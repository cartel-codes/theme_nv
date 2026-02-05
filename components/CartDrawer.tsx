'use client';

import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CartDrawer() {
    const { items, totalItems, totalPrice, isDrawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();

    // Close drawer on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeDrawer();
        };
        if (isDrawerOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isDrawerOpen, closeDrawer]);

    if (!isDrawerOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={closeDrawer}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-[#0a0a0a] dark:bg-[#0a0a0a] shadow-2xl transform transition-transform duration-300 ease-out"
                role="dialog"
                aria-modal="true"
                aria-label="Shopping cart"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[rgba(201,169,110,0.15)] px-6 py-5">
                    <div>
                        <h2 className="font-serif text-xl font-light tracking-[0.15em] text-[#e8e4df] dark:text-novraux-cream uppercase">
                            Your Cart
                        </h2>
                        <p className="mt-1 text-xs tracking-[0.1em] text-[#6b6560] uppercase">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                    <button
                        onClick={closeDrawer}
                        className="p-2 text-[#6b6560] transition-colors hover:text-[#c9a96e]"
                        aria-label="Close cart"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#6b6560] mb-4">
                                <circle cx="8" cy="21" r="1" />
                                <circle cx="19" cy="21" r="1" />
                                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                            </svg>
                            <p className="font-serif text-lg text-[#e8e4df] dark:text-novraux-cream">Your cart is empty</p>
                            <p className="mt-2 text-sm text-[#6b6560]">Add some items to get started</p>
                            <button
                                onClick={closeDrawer}
                                className="mt-6 border border-[rgba(201,169,110,0.4)] px-6 py-2.5 text-xs font-light tracking-[0.2em] text-[#c9a96e] uppercase transition-all hover:bg-[rgba(201,169,110,0.08)] hover:border-[#c9a96e]"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b border-[rgba(201,169,110,0.08)] pb-5">
                                    {/* Product Image */}
                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#111]">
                                        {item.product.imageUrl ? (
                                            <Image
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[10px] text-[#6b6560]">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/products/${item.product.slug}`}
                                            onClick={closeDrawer}
                                            className="font-serif text-sm text-[#e8e4df] dark:text-novraux-cream hover:text-[#c9a96e] transition-colors line-clamp-2"
                                        >
                                            {item.product.name}
                                        </Link>
                                        <p className="mt-1 text-xs text-[#c9a96e]">
                                            ${Number(item.product.price).toFixed(2)}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="flex items-center border border-[rgba(201,169,110,0.2)]">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="px-2 py-1 text-xs text-[#6b6560] hover:text-[#c9a96e] disabled:opacity-40"
                                                >
                                                    −
                                                </button>
                                                <span className="px-2 py-1 text-xs text-[#e8e4df] dark:text-novraux-cream min-w-[24px] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-2 py-1 text-xs text-[#6b6560] hover:text-[#c9a96e]"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-[10px] tracking-[0.1em] text-[#6b6560] uppercase hover:text-[#c9a96e] transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line Total */}
                                    <div className="text-right">
                                        <p className="font-serif text-sm text-[#c9a96e]">
                                            ${(Number(item.product.price) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 border-t border-[rgba(201,169,110,0.15)] bg-[#0a0a0a] dark:bg-[#0a0a0a] px-6 py-5">
                        <div className="flex items-center justify-between mb-5">
                            <span className="text-sm tracking-[0.1em] text-[#6b6560] uppercase">Subtotal</span>
                            <span className="font-serif text-lg text-[#c9a96e]">${totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="space-y-3">
                            <Link
                                href="/checkout"
                                onClick={closeDrawer}
                                className="block w-full bg-[#c9a96e] py-3.5 text-center text-xs font-semibold tracking-[0.25em] text-[#0a0a0a] uppercase transition-all hover:bg-[#b8986d] hover:shadow-lg"
                            >
                                Proceed to Checkout
                            </Link>
                            <Link
                                href="/cart"
                                onClick={closeDrawer}
                                className="block w-full border border-[rgba(201,169,110,0.4)] py-3 text-center text-xs tracking-[0.2em] text-[#c9a96e] uppercase transition-all hover:bg-[rgba(201,169,110,0.08)] hover:border-[#c9a96e]"
                            >
                                View Full Cart
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
