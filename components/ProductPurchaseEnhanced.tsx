'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

interface Variant {
    id: string;
    name: string;
    value: string;
    sku: string;
    price: number | null;
    inventory?: {
        quantity: number;
    }[] | null;
}

interface ProductPurchaseEnhancedProps {
    productId: string;
    basePrice: number;
    variants: Variant[];
    discountPercentage?: number | null;
    isOnSale?: boolean;
    discountExpiresAt?: string | null;
}

// Helper to map color names to hex/classes
const getColorData = (name: string) => {
    const normalize = name.toLowerCase().trim();
    // Map common fashion colors to specific hex codes or tailwind classes
    const colors: Record<string, string> = {
        'black': '#000000',
        'obsidian': '#0a0a0a',
        'white': '#ffffff',
        'bone': '#e8e4df',
        'cream': '#FAF8F5',
        'beige': '#E8E3DC',
        'gold': '#c9a96e',
        'brown': '#594a42',
        'bronze': '#8b7355',
        'blue': '#1A3A52',
        'navy': '#0f172a',
        'red': '#7f1d1d',
        'burgundy': '#4a0404',
        'green': '#5a7a5a',
        'grey': '#55524F',
        'gray': '#55524F',
        'silver': '#C0C0C0',
    };

    // Check for direct match
    if (colors[normalize]) return { bg: colors[normalize], isLight: ['white', 'bone', 'cream', 'beige', 'silver'].includes(normalize) };

    // Check for "dark/light" prefixes
    if (normalize.includes('dark') && normalize.includes('blue')) return { bg: '#0f172a', isLight: false };
    if (normalize.includes('light') && normalize.includes('blue')) return { bg: '#bfdbfe', isLight: true };

    // Default fallback using the name as a color (HTML standard naming often works)
    return { bg: normalize, isLight: false };
};

export default function ProductPurchaseEnhanced({
    productId,
    basePrice,
    variants,
    discountPercentage = null,
    isOnSale = false,
    discountExpiresAt = null,
}: ProductPurchaseEnhancedProps) {
    const router = useRouter();
    const { addToCart } = useCart();

    // Parse variants to determine available options
    const { optionKeys, optionsMap, variantMap } = useMemo(() => {
        if (!variants.length) return { optionKeys: [], optionsMap: {}, variantMap: {} };

        const firstVariant = variants[0];
        const names = firstVariant.name.includes('/')
            ? firstVariant.name.split('/').map(s => s.trim())
            : [firstVariant.name];

        const optionKeys = names;
        const optionsMap: Record<string, Set<string>> = {};
        const variantMap: Record<string, Variant> = {};

        names.forEach(name => {
            optionsMap[name] = new Set();
        });

        variants.forEach(variant => {
            const values = variant.value.includes('/')
                ? variant.value.split('/').map(s => s.trim())
                : [variant.value];

            const key = values.join('|');
            variantMap[key] = variant;

            values.forEach((val, index) => {
                const optionName = names[index];
                if (optionName && val) {
                    optionsMap[optionName].add(val);
                }
            });
        });

        return { optionKeys, optionsMap, variantMap };
    }, [variants]);

    // State
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Auto-select first variant on load if simple options
    useEffect(() => {
        if (variants.length > 0 && Object.keys(selectedOptions).length === 0) {
            // Uncomment to auto-select first available:
            // const first = variants[0];
            // if (first) {
            //      const vals = first.value.includes('/') ? first.value.split('/').map(s => s.trim()) : [first.value];
            //      const newSel: Record<string, string> = {};
            //      optionKeys.forEach((k, i) => newSel[k] = vals[i]);
            //      setSelectedOptions(newSel);
            // }
        }
    }, [variants, selectedOptions, optionKeys]);

    // Derived Logic
    const isSelectionComplete = optionKeys.length === 0 || optionKeys.every(key => selectedOptions[key]);

    const selectedVariant = useMemo(() => {
        if (!isSelectionComplete) return null;
        const values = optionKeys.map(k => selectedOptions[k]);
        const key = values.join('|');
        return variantMap[key] || null;
    }, [isSelectionComplete, optionKeys, selectedOptions, variantMap]);

    const currentPrice = selectedVariant?.price ? Number(selectedVariant.price) : basePrice;
    const inventoryQuantity = selectedVariant?.inventory?.reduce((acc, curr) => acc + curr.quantity, 0) ?? 0;
    const isOutOfStock = isSelectionComplete && selectedVariant && (inventoryQuantity !== undefined && inventoryQuantity <= 0);
    const stockLimit = inventoryQuantity || 10;
    const maxQuantity = Math.min(10, stockLimit > 0 ? stockLimit : 10);

    const discountAmount = isOnSale && discountPercentage ? (currentPrice * discountPercentage) / 100 : 0;
    const priceAfterDiscount = currentPrice - discountAmount;
    const couponDiscAmount = appliedCoupon ? (priceAfterDiscount * appliedCoupon.discount) / 100 : 0;
    const finalPrice = priceAfterDiscount - couponDiscAmount;

    // Handlers
    const handleOptionSelect = (optionName: string, value: string) => {
        setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
        setQuantity(1);
        setError(null);
    };

    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => Math.max(1, Math.min(maxQuantity, prev + delta)));
    };

    const handleAddToCart = async () => {
        if (!isSelectionComplete) return setError('Please select all options');
        if (variants.length > 0 && !selectedVariant) return setError('Selection unavailable');

        setLoading(true);
        setError(null);

        try {
            const result = await addToCart(productId, quantity, selectedVariant?.id);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2000);
            } else if (result.error === 'auth_required') {
                router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            } else {
                setError(result.error || 'Failed to add to cart');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return setCouponError('Enter code');
        setCouponLoading(true);
        setCouponError(null);
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode.toUpperCase() }),
            });
            const data = await res.json();
            if (res.ok && data.coupon) {
                setAppliedCoupon({ code: data.coupon.code, discount: Number(data.coupon.discountPercentage) });
                setCouponCode('');
            } else {
                setCouponError(data.message || 'Invalid code');
            }
        } catch {
            setCouponError('Validation failed');
        } finally {
            setCouponLoading(false);
        }
    };

    return (
        <div className="space-y-10 font-sans animate-fadeIn">
            {/* Price Header */}
            <div className="border-b border-black/5 dark:border-white/5 pb-8">
                <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-4">
                        <span className="font-serif text-4xl text-novraux-obsidian dark:text-novraux-cream tracking-wide">
                            ${finalPrice.toFixed(2)}
                        </span>
                        {(isOnSale || appliedCoupon) && (
                            <span className="text-lg text-neutral-400 font-light line-through decoration-[0.5px]">
                                ${currentPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                    {discountPercentage && isOnSale && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-novraux-gold font-medium">
                            Included {discountPercentage}% Seasonal Offer
                        </span>
                    )}
                </div>
            </div>

            {/* Selectors */}
            {variants.length > 0 && (
                <div className="space-y-8">
                    {optionKeys.map((optionName) => {
                        const isColor = optionName.toLowerCase() === 'color' || optionName.toLowerCase() === 'colour';

                        return (
                            <div key={optionName} className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.25em]">
                                    <span className="text-neutral-500">{optionName}</span>
                                    {selectedOptions[optionName] && (
                                        <span className="text-novraux-obsidian dark:text-novraux-cream font-medium">
                                            {selectedOptions[optionName]}
                                        </span>
                                    )}
                                </div>

                                <div className={`flex flex-wrap ${isColor ? 'gap-4' : 'gap-x-8 gap-y-3'}`}>
                                    {Array.from(optionsMap[optionName] || []).map((value) => {
                                        const isSelected = selectedOptions[optionName] === value;

                                        if (isColor) {
                                            const { bg, isLight } = getColorData(value);
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => handleOptionSelect(optionName, value)}
                                                    className={`
                                                        w-8 h-8 rounded-full transition-all duration-300 relative
                                                        ${isSelected
                                                            ? 'ring-1 ring-offset-4 ring-novraux-obsidian dark:ring-novraux-gold dark:ring-offset-black scale-110'
                                                            : 'hover:scale-110 opacity-80 hover:opacity-100'
                                                        }
                                                        ${isLight ? 'border border-black/10' : ''}
                                                    `}
                                                    style={{ backgroundColor: bg }}
                                                    title={value}
                                                />
                                            );
                                        }

                                        // Text options (Size, Material, etc)
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => handleOptionSelect(optionName, value)}
                                                className={`
                                                    pb-1 text-xs uppercase tracking-[0.15em] transition-all duration-300 border-b
                                                    ${isSelected
                                                        ? 'border-novraux-obsidian text-novraux-obsidian dark:border-novraux-gold dark:text-novraux-gold font-medium'
                                                        : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                                                    }
                                                `}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Actions */}
            <div className="space-y-6 pt-4">
                {/* Stock Indicator */}
                <div className="min-h-[20px] text-[10px] uppercase tracking-[0.2em]">
                    {isSelectionComplete && selectedVariant ? (
                        <div className={`flex items-center gap-2 ${isOutOfStock ? 'text-red-900' : 'text-green-900 dark:text-green-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-900' : 'bg-green-600'}`} />
                            {isOutOfStock ? 'Sold Out' : stockLimit < 5 ? `Low Stock (${stockLimit})` : 'Available'}
                        </div>
                    ) : variants.length > 0 && (
                        <span className="text-neutral-400">Select options</span>
                    )}
                </div>

                <div className="flex gap-6">
                    {/* Minimal Quantity */}
                    {!isOutOfStock && (
                        <div className="flex items-center gap-6 border-b border-black/10 dark:border-white/10 px-2">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                                className="text-lg text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors"
                            >
                                -
                            </button>
                            <span className="w-4 text-center text-sm font-serif">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                disabled={quantity >= maxQuantity}
                                className="text-lg text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    )}

                    {/* Main CTA */}
                    <button
                        onClick={handleAddToCart}
                        disabled={loading || isOutOfStock || (variants.length > 0 && !isSelectionComplete)}
                        className={`
                            flex-1 py-4 text-xs uppercase tracking-[0.3em] font-medium transition-all duration-500 relative overflow-hidden group
                            ${success
                                ? 'bg-green-800 text-white'
                                : 'bg-novraux-obsidian text-white hover:bg-black dark:bg-novraux-bone dark:text-novraux-obsidian dark:hover:bg-white'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? 'Processing' : success ? 'Added to Bag' : isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                        </span>
                    </button>
                </div>

                {error && <p className="text-xs text-red-800 text-center tracking-wide">{error}</p>}
            </div>

            {/* Promo Field (Minimal) */}
            <div className="pt-8 border-t border-black/5 dark:border-white/5">
                {!appliedCoupon ? (
                    <button
                        onClick={() => document.getElementById('promo-input')?.focus()}
                        className="group w-full text-left"
                    >
                        <div className="relative">
                            <input
                                id="promo-input"
                                type="text"
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setCouponError(null);
                                }}
                                placeholder="PROMO CODE"
                                className="w-full bg-transparent border-b border-black/10 py-2 text-xs tracking-widest uppercase placeholder:text-neutral-300 focus:outline-none focus:border-novraux-gold transition-colors"
                            />
                            <span
                                onClick={(e) => { e.stopPropagation(); handleApplyCoupon(); }}
                                className={`
                                    absolute right-0 top-2 text-[10px] tracking-widest uppercase cursor-pointer hover:text-novraux-gold transition-colors
                                    ${couponCode ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                                `}
                            >
                                {couponLoading ? 'Wait' : 'Apply'}
                            </span>
                        </div>
                        {couponError && <p className="mt-2 text-[10px] text-red-800 tracking-wide absolute">{couponError}</p>}
                    </button>
                ) : (
                    <div className="flex justify-between items-center py-2 border-b border-green-900/10">
                        <span className="text-xs tracking-widest uppercase text-green-800">
                            {appliedCoupon.code} Applied
                        </span>
                        <button
                            onClick={() => setAppliedCoupon(null)}
                            className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-neutral-600"
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
