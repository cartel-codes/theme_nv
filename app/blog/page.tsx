import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { generateMetadata as getSEO } from '@/lib/seo';

export const metadata: Metadata = getSEO({
  title: 'Journal',
  description: 'Fashion, style, and the art of dressing well. Essays on minimalist aesthetics and craftsmanship.',
  path: '/blog',
});

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: {
      publishedAt: {
        not: null,
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="bg-novraux-cream min-h-screen">
      <div className="container mx-auto px-4 py-24 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-editorial uppercase text-novraux-terracotta">
            The Journal
          </span>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl font-medium text-novraux-charcoal uppercase">
            Stories & Perspectives
          </h1>
          <p className="mt-6 text-novraux-grey max-w-xl mx-auto">
            Exploring the intersection of contemporary design, traditional craftsmanship, and intentional living.
          </p>
        </div>

        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative aspect-[3/2] overflow-hidden bg-novraux-beige">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-novraux-grey text-[10px] tracking-editorial uppercase">
                      No image
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <span className="text-[10px] tracking-editorial uppercase text-novraux-terracotta font-semibold">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }) : 'Draft'}
                  </span>
                  <h2 className="mt-4 font-serif text-2xl font-medium text-novraux-charcoal group-hover:text-novraux-terracotta transition-colors leading-tight">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-4 line-clamp-3 text-sm text-novraux-grey leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-6">
                    <span className="text-[11px] font-semibold tracking-editorial uppercase text-novraux-charcoal border-b border-novraux-charcoal pb-0.5 group-hover:text-novraux-terracotta group-hover:border-novraux-terracotta transition-all">
                      Read Story
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
