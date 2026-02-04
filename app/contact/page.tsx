import { Metadata } from 'next';
import { generateMetadata as getSEO } from '@/lib/seo';

export const metadata: Metadata = getSEO({
    title: 'Contact',
    description: 'Get in touch with the Novraux atelier for inquiries and support.',
    path: '/contact',
});

export default function ContactPage() {
    return (
        <div className="bg-novraux-cream min-h-screen">
            <div className="container mx-auto px-4 py-24 lg:px-8 max-w-4xl text-center">
                <span className="text-xs font-semibold tracking-editorial uppercase text-novraux-terracotta">Inquiries</span>
                <h1 className="mt-6 font-serif text-4xl md:text-5xl font-medium text-novraux-charcoal uppercase mb-12">
                    Get in Touch
                </h1>
                <div className="grid md:grid-cols-2 gap-16 text-left mt-16">
                    <div>
                        <h2 className="text-[13px] font-semibold tracking-editorial uppercase text-novraux-charcoal mb-4">The Atelier</h2>
                        <p className="text-novraux-grey leading-relaxed">
                            Casablanca, Morocco<br />
                            Monday — Friday<br />
                            9:00 — 18:00
                        </p>
                    </div>
                    <div>
                        <h2 className="text-[13px] font-semibold tracking-editorial uppercase text-novraux-charcoal mb-4">Direct</h2>
                        <p className="text-novraux-grey leading-relaxed">
                            General: hello@novraux.com<br />
                            Support: support@novraux.com
                        </p>
                    </div>
                </div>
                <div className="mt-20 p-12 bg-novraux-beige">
                    <p className="text-novraux-charcoal font-medium">Coming Soon</p>
                    <p className="mt-4 text-novraux-grey italic">We are currently refining our concierge experience. Please email us directly for immediate assistance.</p>
                </div>
            </div>
        </div>
    );
}
