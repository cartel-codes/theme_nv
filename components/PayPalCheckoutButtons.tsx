'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PayPalCheckoutButtonsProps {
    amount: number;
    cartItems: any[];
    shippingAddress: any;
    onSuccess: (orderId: string) => void;
    onError: (error: string) => void;
}

export default function PayPalCheckoutButtons({
    amount,
    cartItems,
    shippingAddress,
    onSuccess,
    onError
}: PayPalCheckoutButtonsProps) {
    const [{ isPending }] = usePayPalScriptReducer();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCreateOrder = async () => {
        try {
            const response = await fetch('/api/checkout/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                    })),
                    shippingAddress,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create PayPal order');

            return data.id; // Returns the PayPal Order ID
        } catch (err) {
            console.error('PayPal createOrder error:', err);
            onError(err instanceof Error ? err.message : 'Failed to initiate PayPal payment');
            return '';
        }
    };

    const handleApprove = async (data: any) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/checkout/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paypalOrderId: data.orderID,
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to capture PayPal order');

            onSuccess(result.orderId);
        } catch (err) {
            console.error('PayPal onApprove error:', err);
            onError(err instanceof Error ? err.message : 'Failed to complete PayPal payment');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isPending || isProcessing) {
        return (
            <div className="w-full h-12 bg-neutral-100 animate-pulse rounded flex items-center justify-center text-xs text-novraux-grey uppercase tracking-widest">
                {isProcessing ? 'Finalizing Order...' : 'Loading PayPal...'}
            </div>
        );
    }

    return (
        <PayPalButtons
            style={{ layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' }}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onError={(err) => {
                console.error('PayPal Button error:', err);
                onError('An error occurred with the PayPal button');
            }}
        />
    );
}
