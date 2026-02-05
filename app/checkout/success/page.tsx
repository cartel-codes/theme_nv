'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <div className="min-h-screen bg-novraux-cream flex items-center justify-center px-4">
            <div className="max-w-md text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                        className="w-12 h-12 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                <h1 className="font-serif text-3xl text-novraux-charcoal mb-4">Order Confirmed!</h1>

                <p className="text-novraux-grey mb-6">
                    Thank you for your purchase. Your order has been successfully placed and will be processed shortly.
                </p>

                {orderId && (
                    <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-8">
                        <p className="text-sm text-novraux-grey mb-1">Order ID</p>
                        <p className="font-mono text-novraux-charcoal font-semibold break-all">{orderId}</p>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-8">
                    <p className="text-sm text-blue-900">
                        A confirmation email has been sent to your email address with order details and tracking information.
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/products"
                        className="block w-full px-6 py-3 bg-novraux-charcoal text-white text-sm uppercase tracking-wider font-semibold hover:bg-black transition-colors rounded"
                    >
                        Continue Shopping
                    </Link>
                    <Link
                        href="/"
                        className="block w-full px-6 py-3 border border-neutral-300 text-novraux-charcoal text-sm uppercase tracking-wider font-semibold hover:bg-neutral-50 transition-colors rounded"
                    >
                        Back to Home
                    </Link>
                </div>

                <p className="mt-8 text-xs text-novraux-grey">
                    Need help? <Link href="/contact" className="underline hover:text-novraux-charcoal">Contact our support team</Link>
                </p>
            </div>
        </div>
    );
}
