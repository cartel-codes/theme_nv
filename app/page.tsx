import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const [featuredProducts, latestPosts] = await Promise.all([
    prisma.product.findMany({
      take: 6,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.findMany({
      take: 3,
      orderBy: { publishedAt: 'desc' },
    }),
  ]);

  return (
    <div className="bg-novraux-cream">
      {/* Hero Section — Editorial Quality */}
      <section className="relative h-[90vh] min-h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920"
            alt="Novraux — Contemporary Luxury"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-novraux-charcoal/20" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-editorial-widest text-white uppercase drop-shadow-lg">
            Novraux
          </h1>
          <p className="mt-8 text-sm md:text-base font-medium tracking-editorial text-white uppercase drop-shadow-md">
            Limited by Design. Cherished Forever.
          </p>
          <div className="mt-12">
            <Link
              href="/collection"
              className="bg-white text-novraux-charcoal px-10 py-4 text-xs font-semibold tracking-editorial uppercase transition-all hover:bg-novraux-charcoal hover:text-white"
            >
              Discover the Collection
            </Link>
          </div>
        </div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="container mx-auto px-4 py-32 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-editorial uppercase text-novraux-terracotta">
            Current Selection
          </span>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-novraux-charcoal uppercase">
            Limited Editions
          </h2>
          <p className="mt-6 text-novraux-grey max-w-xl mx-auto">
            Each piece is part of a numbered series of max 100 items worldwide. Once sold out, they are never reproduced.
          </p>
        </div>

        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/collection"
            className="inline-block border-b border-novraux-charcoal pb-1 text-sm font-semibold tracking-editorial uppercase text-novraux-charcoal transition-all hover:text-novraux-terracotta hover:border-novraux-terracotta"
          >
            View Entire Collection
          </Link>
        </div>
      </section>

      {/* About Section — 50/50 Split */}
      <section className="bg-novraux-beige py-24 lg:py-0">
        <div className="container mx-auto lg:px-0 flex flex-col lg:flex-row min-h-[600px]">
          <div className="relative flex-1 h-[400px] lg:h-auto overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1537832816519-689ad163238b?w=1000"
              alt="The Novraux Atelier"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-24">
            <span className="text-xs font-semibold tracking-editorial uppercase text-novraux-terracotta">
              Our Craft
            </span>
            <h2 className="mt-6 font-serif text-3xl md:text-4xl font-medium text-novraux-charcoal uppercase leading-tight">
              Hand-Drawn. Numbered. <br className="hidden md:block" /> Yours.
            </h2>
            <div className="mt-8 space-y-6 text-novraux-grey leading-relaxed">
              <p>
                Founded on the principles of refined minimalism and intentional scarcity, Novraux specializes in contemporary luxury for the modern individual.
              </p>
              <p>
                Every design begins as a hand-drawn sketch in our atelier. We produce only 100 pieces of each design, ensuring that what you wear remains as unique as your own story.
              </p>
            </div>
            <div className="mt-12">
              <Link
                href="/about"
                className="text-sm font-semibold tracking-editorial border-b border-novraux-charcoal pb-1 uppercase text-novraux-charcoal hover:text-novraux-terracotta hover:border-novraux-terracotta transition-colors"
              >
                Learn More About Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 bg-novraux-cream">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-medium text-novraux-charcoal uppercase">
            Stay Informed
          </h2>
          <p className="mt-6 text-novraux-grey">
            Join our inner circle for early access to new limited editions and editorial stories.
          </p>
          <form className="mt-12 flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-white border border-novraux-beige px-6 py-4 text-novraux-charcoal focus:outline-none focus:border-novraux-charcoal transition-colors"
              required
            />
            <button
              type="submit"
              className="bg-novraux-charcoal text-white px-8 py-4 text-xs font-semibold tracking-editorial uppercase transition-all hover:bg-novraux-terracotta"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-6 text-[11px] text-novraux-grey uppercase tracking-widest">
            Privacy respected. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Editorial Journal Teaser */}
      <section className="container mx-auto px-4 py-32 lg:px-8 border-t border-novraux-beige">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs font-semibold tracking-editorial uppercase text-novraux-terracotta">
              Editorial
            </span>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl font-medium text-novraux-charcoal uppercase">
              The Journal
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-xs font-semibold tracking-editorial uppercase text-novraux-grey hover:text-novraux-charcoal transition-colors"
          >
            Read All Stories →
          </Link>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-novraux-beige">
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-novraux-grey text-[10px] tracking-editorial uppercase">
                    No image
                  </div>
                )}
              </div>
              <p className="mt-6 text-[10px] tracking-editorial uppercase text-novraux-terracotta font-semibold">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <h3 className="mt-4 font-serif text-2xl font-medium text-novraux-charcoal group-hover:text-novraux-terracotta transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-4 line-clamp-2 text-sm text-novraux-grey leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
