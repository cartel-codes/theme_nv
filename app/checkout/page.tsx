import { Metadata } from 'next';
import Link from 'next/link';
import { generateMetadata as getSEO } from '@/lib/seo';

export const metadata: Metadata = getSEO({
    title: 'Checkout',
    description: 'Complete your purchase at Novraux.',
    path: '/checkout',
});

export default function CheckoutPage() {
    return (
        <div className="container mx-auto px-4 py-24 text-center">
            <div className="max-w-lg mx-auto">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-[rgba(201,169,110,0.1)] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                </div>

                <p className="text-xs tracking-[0.25em] text-[#c9a96e] uppercase mb-3">
                    Coming Soon
                </p>
                <h1 className="font-serif text-3xl font-light tracking-[0.15em] text-[#e8e4df] dark:text-novraux-cream uppercase">
                    Checkout
                </h1>
                <p className="mt-6 text-sm leading-relaxed tracking-[0.04em] text-[#6b6560]">
                    We&apos;re currently integrating Stripe for secure payment processing.
                    Checkout functionality will be available soon.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/cart"
                        className="border border-[rgba(201,169,110,0.4)] px-8 py-3.5 text-xs font-light tracking-[0.25em] text-[#c9a96e] uppercase transition-all hover:bg-[rgba(201,169,110,0.08)] hover:border-[#c9a96e]"
                    >
                        Back to Cart
                    </Link>
                    <Link
                        href="/products"
                        className="bg-[#c9a96e] px-8 py-3.5 text-xs font-semibold tracking-[0.25em] text-[#0a0a0a] uppercase transition-all hover:bg-[#b8986d]"
                    >
                        Continue Shopping
                    </Link>
                </div>

                {/* Feature Preview */}
                <div className="mt-16 border border-[rgba(201,169,110,0.12)] bg-[#111111] dark:bg-[#111111] p-8">
                    <h3 className="font-serif text-sm tracking-[0.15em] text-[#e8e4df] dark:text-novraux-cream uppercase mb-6">
                        What to Expect
                    </h3>
                    <div className="grid gap-4 text-left text-xs text-[#6b6560]">
                        <div className="flex items-start gap-3">
                            <span className="text-[#c9a96e]">✓</span>
                            <span>Secure payment via Stripe (Card, Apple Pay, Google Pay)</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-[#c9a96e]">✓</span>
                            <span>Express checkout for returning customers</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-[#c9a96e]">✓</span>
                            <span>Multiple shipping options</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-[#c9a96e]">✓</span>
                            <span>Order confirmation and tracking emails</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
