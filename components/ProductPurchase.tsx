'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Variant {
    id: string;
    name: string;
    value: string;
    sku: string;
    price: number | null;
    inventory?: {
        quantity: number;
    } | null;
}

interface ProductPurchaseProps {
    productId: string;
    basePrice: number;
    variants: Variant[];
}

export default function ProductPurchase({ productId, basePrice, variants }: ProductPurchaseProps) {
    const router = useRouter();
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedVariant = variants.find(v => v.id === selectedVariantId);
    const currentPrice = selectedVariant?.price ? Number(selectedVariant.price) : basePrice;
    const isOutOfStock = selectedVariant?.inventory && selectedVariant.inventory.quantity <= 0;
    const stockLimit = selectedVariant?.inventory?.quantity || 10;
    const maxQuantity = Math.min(10, stockLimit);

    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => Math.max(1, Math.min(maxQuantity, prev + delta)));
    };

    const handleAddToCart = async () => {
        if (variants.length > 0 && !selectedVariantId) {
            setError('Please select a variant');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    variantId: selectedVariantId,
                    quantity
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add to cart');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);

            // Dispatch cart update event
            window.dispatchEvent(new Event('cart-updated'));
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to add to cart');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-6 mb-6">
                <p className="font-serif text-3xl text-[#B8926A] font-normal transition-all duration-300">
                    ${currentPrice.toFixed(2)}
                </p>
            </div>

            {/* Variant Selector */}
            {variants.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => {
                            const isSelected = variant.id === selectedVariantId;
                            const isVariantOutOfStock = variant.inventory && variant.inventory.quantity <= 0;

                            return (
                                <button
                                    key={variant.id}
                                    onClick={() => setSelectedVariantId(variant.id)}
                                    disabled={!!isVariantOutOfStock}
                                    className={`
                      px-4 py-2 border text-sm uppercase tracking-wider transition-all
                      ${isSelected
                                            ? 'border-[#B8926A] bg-[#B8926A] text-white'
                                            : 'border-neutral-200 text-neutral-600 hover:border-[#B8926A] hover:text-[#B8926A]'
                                        }
                      ${isVariantOutOfStock ? 'opacity-50 cursor-not-allowed line-through' : ''}
                    `}
                                >
                                    {variant.value}
                                </button>
                            );
                        })}
                    </div>
                    {selectedVariant && (
                        <p className="text-xs text-neutral-500 uppercase tracking-wide">
                            Selected: <span className="text-novraux-charcoal font-medium">{selectedVariant.name} {selectedVariant.value}</span>
                        </p>
                    )}
                </div>
            )}

            {/* Quantity Selector - Always visible */}
            {!isOutOfStock && (
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-neutral-600 uppercase tracking-wider">Quantity</span>
                    <div className="flex items-center border border-neutral-200">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="px-4 py-2 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>
                        <span className="px-6 py-2 border-x border-neutral-200 min-w-[60px] text-center font-medium">
                            {quantity}
                        </span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= maxQuantity}
                            className="px-4 py-2 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                    </div>
                    {stockLimit < 10 && (
                        <span className="text-xs text-neutral-500">
                            {stockLimit} available
                        </span>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                </div>
            )}

            {/* Add To Cart Button - Always visible */}
            <button
                onClick={handleAddToCart}
                disabled={loading || isOutOfStock || (variants.length > 0 && !selectedVariantId)}
                className={`
          w-full py-4 text-sm uppercase tracking-[0.2em] font-medium transition-all duration-300
          ${success
                        ? 'bg-green-600 text-white'
                        : 'bg-[#2C2C2C] text-white hover:bg-[#B8926A]'
                    }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
            >
                {loading ? 'Adding...' : success ? 'Added to Cart ✓' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    );
}
