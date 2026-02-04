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
    <div>
      {/* Hero — YSL/Hermès inspired: bold imagery, minimal copy */}
      <section className="relative min-h-[70vh] border-b border-[rgba(201,169,110,0.12)]">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920"
            alt="Novraux — A new chapter in fashion"
            fill
            className="object-cover opacity-40"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" />
        </div>
        <div className="relative z-10 flex min-h-[70vh] flex-col justify-center px-4 py-24 md:px-8 lg:px-16">
          <h1 className="font-serif text-4xl font-light tracking-[0.35em] text-[#e8e4df] md:text-5xl lg:text-7xl uppercase">
            Novraux
          </h1>
          <p className="mt-6 max-w-md font-serif text-lg italic text-[#c9a96e] tracking-[0.2em]">
            A new chapter in fashion
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed tracking-[0.1em] text-[#e8e4df]/80">
            Built on intention, rooted in craft. Designed for those who refuse
            the ordinary.
          </p>
          <Link
            href="/products"
            className="mt-12 inline-block w-fit border border-[rgba(201,169,110,0.5)] px-10 py-4 text-xs font-light tracking-[0.3em] text-[#c9a96e] uppercase transition-all hover:bg-[rgba(201,169,110,0.08)] hover:border-[#c9a96e]"
          >
            Discover
          </Link>
        </div>
      </section>

      {/* Featured Products — clean grid, high-impact */}
      <section className="container mx-auto px-4 py-24">
        <p className="text-xs tracking-[0.3em] text-[#c9a96e] uppercase">
          Curated
        </p>
        <h2 className="mt-2 font-serif text-2xl font-light tracking-[0.25em] text-[#e8e4df] uppercase md:text-3xl">
          Products
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="text-sm tracking-[0.2em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
          >
            View all products →
          </Link>
        </div>
      </section>

      {/* Journal — Hermès-style storytelling */}
      <section className="border-t border-[rgba(201,169,110,0.12)] bg-[#111111]/50 py-24">
        <div className="container mx-auto px-4">
          <p className="text-xs tracking-[0.3em] text-[#c9a96e] uppercase">
            Journal
          </p>
          <h2 className="mt-2 font-serif text-2xl font-light tracking-[0.25em] text-[#e8e4df] uppercase md:text-3xl">
            Stories & Essays
          </h2>
          <p className="mt-4 max-w-xl text-sm tracking-[0.08em] text-[#6b6560] uppercase">
            Thoughts on fashion, craft, and intentional living.
          </p>
          <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden border border-[rgba(201,169,110,0.12)]">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#0a0a0a] text-[#6b6560] text-xs tracking-[0.2em] uppercase">
                      No image
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs tracking-[0.2em] text-[#6b6560] uppercase">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <h3 className="mt-2 font-serif text-xl font-light text-[#e8e4df] transition-colors group-hover:text-[#c9a96e]">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-[#6b6560]">
                    {post.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="text-sm tracking-[0.2em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
            >
              Read all articles →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
