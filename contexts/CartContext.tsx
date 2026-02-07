'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface CartItem {
    id: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
    product: {
        id: string;
        name: string;
        slug: string;
        price: string | number;
        imageUrl?: string;
    };
    variant?: {
        id: string;
        name: string;
        value: string;
        price?: string | number;
    } | null;
}

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    isLoading: boolean;
    isDrawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    refreshCart: () => Promise<void>;
    addToCart: (productId: string, quantity?: number, variantId?: string | null) => Promise<{ success: boolean; error?: string }>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
        (sum, item) => {
            const price = item.variant?.price ? Number(item.variant.price) : Number(item.product.price);
            return sum + price * item.quantity;
        },
        0
    );

    const refreshCart = useCallback(async () => {
        try {
            const res = await fetch('/api/cart');
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addToCart = useCallback(async (productId: string, quantity = 1, variantId?: string | null) => {
        try {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity, variantId }),
            });

            if (res.status === 401) {
                return { success: false, error: 'auth_required' };
            }

            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
                setIsDrawerOpen(true);
                return { success: true };
            } else {
                const data = await res.json();
                return { success: false, error: data.error || 'Failed to add to cart' };
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            return { success: false, error: 'An error occurred' };
        }
    }, []);

    const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
        try {
            const res = await fetch('/api/cart', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, quantity }),
            });

            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error('Failed to update cart:', error);
        }
    }, []);

    const removeItem = useCallback(async (itemId: string) => {
        try {
            const res = await fetch(`/api/cart?itemId=${itemId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error('Failed to remove from cart:', error);
        }
    }, []);

    const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

    useEffect(() => {
        refreshCart();

        // Re-fetch cart when user logs in/out (cart may change)
        const handleAuthChange = () => refreshCart();
        window.addEventListener('auth-change', handleAuthChange);
        return () => window.removeEventListener('auth-change', handleAuthChange);
    }, [refreshCart]);

    return (
        <CartContext.Provider
            value={{
                items,
                totalItems,
                totalPrice,
                isLoading,
                isDrawerOpen,
                openDrawer,
                closeDrawer,
                refreshCart,
                addToCart,
                updateQuantity,
                removeItem,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
