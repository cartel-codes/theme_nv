import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const [featuredProducts, latestPosts] = await Promise.all([
    prisma.product.findMany({
      take: 6,
      include: {
        category: true,
        images: {
          take: 1,
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.findMany({
      take: 3,
      orderBy: { publishedAt: 'desc' },
    }),
  ]);

  return (
    <div className="bg-novraux-bone dark:bg-novraux-obsidian transition-colors duration-300">
      {/* Hero Section — Full-Screen Editorial Luxury */}
      <section className="relative h-screen min-h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80"
            alt="Novraux — Contemporary Luxury"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-novraux-obsidian/30" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-light tracking-novraux-wide text-novraux-bone uppercase animate-fadeIn">
            NOVRAUX
          </h1>
          <p className="mt-8 font-sans text-base md:text-lg lg:text-xl font-light tracking-novraux-medium text-novraux-bone/90 uppercase animate-fadeIn">
            Limited by Design. Cherished Forever.
          </p>
          <div className="mt-12 animate-fadeIn">
            <Link
              href="/products"
              className="inline-block bg-transparent border border-novraux-bone text-novraux-bone px-10 py-4 font-sans text-xs font-medium tracking-novraux-medium uppercase transition-all duration-300 hover:bg-novraux-bone hover:text-novraux-obsidian"
            >
              Discover the Collection
            </Link>
          </div>
        </div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-novraux-bone animate-bounce-slow">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="container mx-auto px-6 py-24 lg:px-8">
        <div className="text-center mb-16 animate-slideUp">
          <p className="font-sans text-[11px] font-normal tracking-novraux-medium uppercase text-novraux-ash mb-3">
            Current Selection
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-novraux-obsidian dark:text-novraux-bone mb-4 transition-colors">
            Limited Editions
          </h2>
          <p className="font-sans text-base font-light text-novraux-ash dark:text-novraux-bone/70 max-w-2xl mx-auto leading-relaxed transition-colors">
            Each piece is part of a numbered series of max 100 items worldwide. Once sold out, they are never reproduced.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-block border border-novraux-obsidian dark:border-novraux-bone px-10 py-4 font-sans text-xs font-medium tracking-novraux-medium uppercase text-novraux-obsidian dark:text-novraux-bone transition-all duration-300 hover:bg-novraux-obsidian hover:text-novraux-bone dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian"
          >
            View Entire Collection
          </Link>
        </div>
      </section>

      {/* About Section — 50/50 Split */}
      <section className="bg-novraux-graphite dark:bg-novraux-graphite py-24 lg:py-0 transition-colors">
        <div className="container mx-auto lg:px-0 flex flex-col lg:flex-row min-h-[600px]">
          <div className="relative flex-1 h-[400px] lg:h-auto overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1537832816519-689ad163238b?w=1000&q=80"
              alt="The Novraux Atelier"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-24 bg-novraux-graphite">
            <p className="font-sans text-[11px] font-normal tracking-novraux-medium uppercase text-novraux-gold mb-3">
              Our Craft
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-novraux-bone leading-tight">
              Hand-Drawn.<br className="hidden md:block" />Numbered.<br className="hidden md:block" />Yours.
            </h2>
            <div className="mt-8 space-y-6 font-sans text-base font-light text-novraux-bone/80 leading-relaxed">
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
                className="inline-block border border-novraux-gold text-novraux-gold px-10 py-4 font-sans text-xs font-medium tracking-novraux-medium uppercase transition-all duration-300 hover:bg-novraux-gold hover:text-novraux-obsidian"
              >
                Learn More About Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-novraux-bone dark:bg-novraux-obsidian transition-colors">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-normal text-novraux-obsidian dark:text-novraux-bone mb-4 transition-colors">
            Stay Informed
          </h2>
          <p className="font-sans text-base font-light text-novraux-ash dark:text-novraux-bone/70 leading-relaxed mb-8 transition-colors">
            Join our inner circle for early access to new limited editions and editorial stories.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-transparent border border-novraux-ash dark:border-novraux-graphite px-6 py-4 font-sans text-sm text-novraux-obsidian dark:text-novraux-bone focus:outline-none focus:border-novraux-obsidian dark:focus:border-novraux-gold transition-colors placeholder:text-novraux-ash/60"
              required
            />
            <button
              type="submit"
              className="bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian px-8 py-4 font-sans text-xs font-medium tracking-novraux-medium uppercase transition-all duration-300 hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-4 font-sans text-xs text-novraux-ash dark:text-novraux-bone/50 transition-colors">
            Privacy respected. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Editorial Journal Teaser */}
      <section className="container mx-auto px-6 py-24 lg:px-8 border-t border-novraux-ash/20 dark:border-novraux-graphite transition-colors">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="font-sans text-[11px] font-normal tracking-novraux-medium uppercase text-novraux-gold mb-3">
              Editorial
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-normal text-novraux-obsidian dark:text-novraux-bone transition-colors">
              The Journal
            </h2>
          </div>
          <Link
            href="/blog"
            className="font-sans text-xs font-normal tracking-novraux-medium uppercase text-novraux-ash hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors"
          >
            Read All Stories →
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-novraux-graphite">
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-all duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-sans text-[10px] tracking-novraux-medium uppercase text-novraux-ash">
                    No image
                  </div>
                )}
              </div>
              <p className="mt-6 font-sans text-[10px] tracking-novraux-medium uppercase text-novraux-gold font-normal">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }) : 'Draft'}
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold dark:group-hover:text-novraux-gold transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-4 line-clamp-2 font-sans text-sm font-light text-novraux-ash dark:text-novraux-bone/70 leading-relaxed transition-colors">
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
