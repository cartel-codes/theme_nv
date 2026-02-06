import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { generateMetadata as getSEO } from '@/lib/seo';

// Revalidate the page every 60 seconds to show new published articles
export const revalidate = 60;

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
    <div className="bg-novraux-bone dark:bg-novraux-obsidian min-h-screen transition-colors">
      <div className="container mx-auto px-6 py-24 lg:px-8">
        <div className="text-center mb-24">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-novraux-obsidian dark:text-novraux-bone uppercase tracking-tight transition-colors">
            Journal
          </h1>
          <p className="mt-6 font-sans text-lg font-light text-novraux-ash dark:text-novraux-bone/70 leading-relaxed transition-colors">
            Thoughts on clothing, craft, and restraint.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden bg-novraux-graphite rounded-sm">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-novraux-ash/50 text-xs uppercase">
                      —
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <h2 className="font-serif text-2xl md:text-3xl font-light text-novraux-obsidian dark:text-novraux-bone group-hover:text-novraux-gold dark:group-hover:text-novraux-gold transition-colors leading-tight">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-4 line-clamp-2 font-sans text-sm font-light text-novraux-ash dark:text-novraux-bone/70 leading-relaxed transition-colors">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
