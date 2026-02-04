import { Metadata } from 'next';
import { generateMetadata as getSEO } from '@/lib/seo';

export const metadata: Metadata = getSEO({
    title: 'About Us',
    description: 'Learn about the Novraux story and our commitment to contemporary luxury.',
    path: '/about',
});

export default function AboutPage() {
    return (
        <div className="bg-novraux-cream min-h-screen">
            <div className="container mx-auto px-4 py-24 lg:px-8 max-w-4xl">
                <span className="text-xs font-semibold tracking-editorial uppercase text-novraux-terracotta">Our Story</span>
                <h1 className="mt-6 font-serif text-4xl md:text-5xl font-medium text-novraux-charcoal uppercase leading-tight">
                    Contemporary Luxury. <br /> Handcrafted with Intention.
                </h1>
                <div className="mt-12 space-y-8 text-novraux-charcoal leading-[1.8] text-lg">
                    <p>
                        Novraux was founded on the belief that fashion should be a conscious choice. In a world of fleeting trends and mass production, we stand for something timeless.
                    </p>
                    <p>
                        Our pieces are designed in our Casablanca atelier, blending modern minimalist silhouettes with the deep technical expertise of local artisans. Each garment is part of a numbered series, limited to just 100 pieces worldwide.
                    </p>
                    <p>
                        This isn't just clothing; it's a commitment to rarity, quality, and a more intentional way of life.
                    </p>
                </div>
            </div>
        </div>
    );
}
