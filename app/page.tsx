import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const [featuredProducts, latestPosts] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true },
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
      {/* Hero Section — Brand Strategy Option A: Ultra Minimal */}
      <section className="relative h-screen min-h-[700px] overflow-hidden bg-gradient-to-br from-novraux-graphite to-novraux-obsidian">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1920&q=80&fit=crop"
            alt="Novraux Fabric"
            fill
            className="object-cover opacity-90"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-novraux-obsidian/40" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
          <h1 className="font-serif text-7xl md:text-8xl lg:text-9xl font-light tracking-novraux-wide text-novraux-bone uppercase animate-fadeIn mb-16">
            NOVRAUX
          </h1>
          <p className="font-sans text-lg md:text-xl font-light tracking-wide text-novraux-bone/95 animate-fadeIn">
            Clothing built to be kept.
          </p>
          <div className="mt-20 animate-fadeIn">
            <Link
              href="/products"
              className="inline-block bg-transparent border border-novraux-bone text-novraux-bone px-12 py-5 font-sans text-xs font-normal tracking-novraux-medium uppercase transition-all duration-300 hover:bg-novraux-bone hover:text-novraux-obsidian"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Philosophy Section — Restraint as Strategy */}
      <section className="py-32 lg:py-40">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-novraux-obsidian dark:text-novraux-bone leading-tight transition-colors">
            Fewer pieces.<br />Better decisions.
          </h2>
          <div className="mt-16 font-sans text-base md:text-lg font-light text-novraux-ash dark:text-novraux-bone/70 leading-relaxed max-w-2xl mx-auto transition-colors space-y-6">
            <p>Wool. Italian. Cut long.</p>
            <p>Unlined for movement. Details that matter.</p>
            <p>Made to be worn for years.</p>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="container mx-auto px-6 py-20 lg:px-8 border-t border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
        <div className="text-center mb-20 animate-slideUp">
          <p className="font-sans text-base font-light text-novraux-ash dark:text-novraux-bone/70 tracking-wide transition-colors">
            Essentials. Reimagined.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/products"
            className="inline-block border border-novraux-obsidian dark:border-novraux-bone px-12 py-5 font-sans text-xs font-normal tracking-novraux-medium uppercase text-novraux-obsidian dark:text-novraux-bone transition-all duration-300 hover:bg-novraux-obsidian hover:text-novraux-bone dark:hover:bg-novraux-bone dark:hover:text-novraux-obsidian"
          >
            View Collection
          </Link>
        </div>
      </section>

      {/* Materials Section — 50/50 Split */}
      <section className="bg-novraux-graphite dark:bg-novraux-graphite py-24 lg:py-0 transition-colors">
        <div className="container mx-auto lg:px-0 flex flex-col lg:flex-row min-h-[700px]">
          <div className="relative flex-1 h-[500px] lg:h-auto overflow-hidden bg-gradient-to-br from-novraux-obsidian to-novraux-graphite">
            <Image
              src="https://images.unsplash.com/photo-1558769132-cb1aea2f47e4?w=1000&q=80&fit=crop"
              alt="Novraux Premium Materials"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center px-10 py-20 lg:px-20 bg-novraux-graphite">
            <h2 className="font-serif text-5xl md:text-6xl font-light text-novraux-bone leading-tight mb-6">
              Materials.<br />Origins.<br />Longevity.
            </h2>
            <div className="mt-12 space-y-8 font-sans text-lg font-light text-novraux-bone/85 leading-relaxed">
              <p>
                Italian wool. Japanese cotton.<br />
                Horn buttons. Natural dyes.
              </p>
              <p>
                Each fabric traced to its mill.<br />
                Each detail considered. Twice.
              </p>
              <p className="text-novraux-gold">
                Designed with intention. Made to last.
              </p>
            </div>
            <div className="mt-16">
              <Link
                href="/about"
                className="inline-block border border-novraux-gold text-novraux-gold px-12 py-5 font-sans text-xs font-normal tracking-novraux-medium uppercase transition-all duration-300 hover:bg-novraux-gold hover:text-novraux-obsidian"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Craft Section — Full Width with Overlay */}
      <section className="relative min-h-[600px] overflow-hidden bg-gradient-to-br from-novraux-obsidian to-novraux-graphite">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1618453292507-4959ece6429e?w=1920&q=80&fit=crop"
            alt="Novraux Craft"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-novraux-obsidian/50" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-[600px] px-6">
          <div className="text-center max-w-3xl">
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-novraux-bone leading-tight">
              Silence in design.
            </h2>
            <p className="mt-12 font-sans text-lg font-light text-novraux-bone/90 leading-relaxed">
              Novraux does not explain itself loudly.<br />
              It reveals itself slowly.
            </p>
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

      {/* Newsletter Section — Brand Strategy Approved Copy */}
      <section className="py-32 lg:py-40 bg-novraux-bone dark:bg-novraux-obsidian transition-colors">
        <div className="container mx-auto px-6 max-w-xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone mb-6 transition-colors">
            No noise.
          </h2>
          <p className="font-sans text-lg font-light text-novraux-ash dark:text-novraux-bone/70 leading-relaxed mb-12 transition-colors">
            Just updates when they matter.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 bg-transparent border border-novraux-ash dark:border-novraux-graphite px-6 py-5 font-sans text-sm text-novraux-obsidian dark:text-novraux-bone focus:outline-none focus:border-novraux-obsidian dark:focus:border-novraux-gold transition-colors placeholder:text-novraux-ash/60"
              required
            />
            <button
              type="submit"
              className="bg-novraux-obsidian dark:bg-novraux-gold text-novraux-bone dark:text-novraux-obsidian px-10 py-5 font-sans text-xs font-normal tracking-novraux-medium uppercase transition-all duration-300 hover:bg-novraux-gold hover:text-novraux-obsidian dark:hover:bg-novraux-obsidian dark:hover:text-novraux-bone whitespace-nowrap"
            >
              Join
            </button>
          </form>
        </div>
      </section>

      {/* Editorial Journal — Brand Strategy: "Thoughts on clothing, craft, and restraint" */}
      <section className="container mx-auto px-6 py-32 lg:px-8 lg:py-40 border-t border-novraux-ash/10 dark:border-novraux-graphite transition-colors">
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone transition-colors mb-4">
            The Journal
          </h2>
          <p className="font-sans text-base font-light text-novraux-ash dark:text-novraux-bone/70 transition-colors">
            Thoughts on clothing, craft, and restraint.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-novraux-graphite">
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-sans text-xs tracking-wide uppercase text-novraux-ash/50">
                    —
                  </div>
                )}
              </div>
              <h3 className="mt-8 font-serif text-2xl md:text-3xl font-light text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold dark:group-hover:text-novraux-gold transition-colors leading-tight">
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

        <div className="mt-20 text-center">
          <Link
            href="/blog"
            className="font-sans text-xs font-normal tracking-novraux-medium uppercase text-novraux-ash hover:text-novraux-obsidian dark:hover:text-novraux-gold transition-colors"
          >
            Read All →
          </Link>
        </div>
      </section>
    </div>
  );
}
