'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string | null;
    slug: string;
}

interface CheckoutStep {
    number: 1 | 2 | 3 | 4;
    label: string;
    icon: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
    });

    const [totals, setTotals] = useState({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
    });

    const steps: CheckoutStep[] = [
        { number: 1, label: 'Cart Review', icon: '🛒' },
        { number: 2, label: 'Shipping', icon: '📦' },
        { number: 3, label: 'Review Order', icon: '✓' },
        { number: 4, label: 'Payment', icon: '💳' },
    ];

    // Load cart from API
    useEffect(() => {
        fetchCart();
    }, []);

    // Fetch cart from API
    const fetchCart = async () => {
        try {
            const response = await fetch('/api/cart');
            if (!response.ok) {
                throw new Error('Failed to load cart');
            }

            const data = await response.json();
            const items = data.items.map((item: any) => ({
                productId: item.product.id,
                name: item.product.name,
                price: Number(item.product.price),
                quantity: item.quantity,
                imageUrl: item.product.imageUrl,
                slug: item.product.slug,
            }));

            setCartItems(items);
            if (items.length > 0) {
                validateCart(items);
            } else {
                setError('Your cart is empty');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load cart');
        }
    };

    // Validate cart
    const validateCart = async (items: CartItem[]) => {
        try {
            const response = await fetch('/api/checkout/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: items }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Cart validation failed');
            }

            const data = await response.json();
            setTotals(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to validate cart');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (cartItems.length === 0) {
                setError('Your cart is empty');
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Validate shipping address
            if (!formData.street || !formData.city || !formData.state || !formData.zip) {
                setError('Please fill in all shipping fields');
                return;
            }
            setCurrentStep(3);
        } else if (currentStep === 3) {
            setCurrentStep(4);
        }
        setError(null);
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
            setError(null);
        }
    };

    const handleCompleteCheckout = async () => {
        setLoading(true);
        setError(null);

        try {
            // Create payment intent
            const intentResponse = await fetch('/api/checkout/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                    shippingAddress: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.zip,
                        country: formData.country,
                    },
                    email: formData.email,
                }),
            });

            if (!intentResponse.ok) {
                const data = await intentResponse.json();
                throw new Error(data.error || 'Failed to create payment intent');
            }

            const { orderId, clientSecret } = await intentResponse.json();

            // TODO: Integrate with Stripe here
            // For now, simulate successful payment
            const completeResponse = await fetch('/api/checkout/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    paymentId: clientSecret,
                    paymentStatus: 'succeeded',
                }),
            });

            if (!completeResponse.ok) {
                const data = await completeResponse.json();
                throw new Error(data.error || 'Failed to complete order');
            }

            router.push(`/checkout/success?orderId=${orderId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-novraux-cream">
            {/* Header */}
            <div className="border-b border-neutral-200 bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Link href="/" className="font-serif text-2xl text-novraux-charcoal hover:opacity-70">
                        Novraux
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Stepper */}
                <div className="mb-12">
                    <div className="flex justify-between">
                        {steps.map((step) => (
                            <div
                                key={step.number}
                                className={`flex flex-col items-center flex-1 pb-8 ${
                                    step.number <= currentStep ? '' : 'opacity-50'
                                }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white mb-2 ${
                                        step.number < currentStep
                                            ? 'bg-green-600'
                                            : step.number === currentStep
                                            ? 'bg-novraux-charcoal'
                                            : 'bg-neutral-300'
                                    }`}
                                >
                                    {step.number < currentStep ? '✓' : step.icon}
                                </div>
                                <span className="text-sm font-medium text-novraux-charcoal">{step.label}</span>
                                {step.number < steps.length && (
                                    <div
                                        className={`absolute w-1/4 h-1 mt-6 ${
                                            step.number < currentStep ? 'bg-green-600' : 'bg-neutral-300'
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* Step 1: Cart Review */}
                        {currentStep === 1 && (
                            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
                                <h2 className="font-serif text-2xl text-novraux-charcoal mb-6">Review Your Cart</h2>

                                {cartItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-novraux-grey mb-4">Your cart is empty</p>
                                        <Link href="/products" className="text-novraux-charcoal underline">
                                            Continue Shopping
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <div key={item.productId} className="flex gap-4 pb-4 border-b border-neutral-200">
                                                {item.imageUrl && (
                                                    <div className="relative w-20 h-20 flex-shrink-0">
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/products/${item.slug}`}
                                                        className="font-medium text-novraux-charcoal hover:text-novraux-terracotta"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <p className="text-sm text-novraux-grey">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-novraux-charcoal">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-novraux-grey">${item.price.toFixed(2)} each</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Shipping Address */}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
                                <h2 className="font-serif text-2xl text-novraux-charcoal mb-6">Shipping Address</h2>

                                <form className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                            Street Address
                                        </label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                                ZIP Code
                                            </label>
                                            <input
                                                type="text"
                                                name="zip"
                                                value={formData.zip}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-novraux-charcoal mb-1">
                                                Country
                                            </label>
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-novraux-charcoal"
                                            >
                                                <option value="US">United States</option>
                                                <option value="CA">Canada</option>
                                                <option value="UK">United Kingdom</option>
                                                <option value="AU">Australia</option>
                                            </select>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 3: Review Order */}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
                                <h2 className="font-serif text-2xl text-novraux-charcoal mb-6">Review Your Order</h2>

                                <div className="space-y-6">
                                    <div className="pb-6 border-b border-neutral-200">
                                        <h3 className="font-semibold text-novraux-charcoal mb-4">Items</h3>
                                        <div className="space-y-3">
                                            {cartItems.map((item) => (
                                                <div key={item.productId} className="flex justify-between">
                                                    <span className="text-novraux-grey">
                                                        {item.name} × {item.quantity}
                                                    </span>
                                                    <span className="font-medium text-novraux-charcoal">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pb-6 border-b border-neutral-200">
                                        <h3 className="font-semibold text-novraux-charcoal mb-4">Shipping Address</h3>
                                        <p className="text-novraux-grey text-sm">
                                            {formData.firstName} {formData.lastName}
                                            <br />
                                            {formData.street}
                                            <br />
                                            {formData.city}, {formData.state} {formData.zip}
                                            <br />
                                            {formData.country}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Payment */}
                        {currentStep === 4 && (
                            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
                                <h2 className="font-serif text-2xl text-novraux-charcoal mb-6">Payment</h2>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                                        <p className="text-sm text-blue-900">
                                            ℹ️ This is a demo checkout. Payment processing with Stripe coming soon.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-neutral-50 rounded border border-neutral-200">
                                        <p className="text-sm text-novraux-grey mb-2">Order Total</p>
                                        <p className="font-serif text-3xl text-novraux-charcoal">
                                            ${totals.total.toFixed(2)}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleCompleteCheckout}
                                        disabled={loading}
                                        className="w-full px-6 py-3 bg-novraux-charcoal text-white text-sm uppercase tracking-wider font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Processing...' : 'Complete Order'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 sticky top-20">
                            <h3 className="font-serif text-lg text-novraux-charcoal mb-6">Order Summary</h3>

                            <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-novraux-grey">Subtotal</span>
                                    <span className="text-novraux-charcoal">${totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-novraux-grey">Tax</span>
                                    <span className="text-novraux-charcoal">${totals.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-novraux-grey">Shipping</span>
                                    <span className="text-novraux-charcoal">${totals.shipping.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between mb-6">
                                <span className="font-semibold text-novraux-charcoal">Total</span>
                                <span className="font-serif text-2xl text-novraux-charcoal">${totals.total.toFixed(2)}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleNextStep}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-novraux-charcoal text-white text-sm uppercase tracking-wider font-semibold hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    {currentStep === 4 ? 'Complete Order' : 'Next Step'}
                                </button>

                                {currentStep > 1 && (
                                    <button
                                        onClick={handlePreviousStep}
                                        disabled={loading}
                                        className="w-full px-4 py-2 border border-neutral-300 text-novraux-charcoal text-sm uppercase tracking-wider font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                )}

                                <Link
                                    href="/cart"
                                    className="block text-center text-xs text-novraux-grey hover:underline py-2"
                                >
                                    Return to Cart
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
