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
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <p className="text-xs tracking-[0.25em] text-[#c9a96e] uppercase">
        Journal
      </p>
      <h1 className="mt-2 font-serif text-3xl font-light tracking-[0.2em] text-[#e8e4df] uppercase md:text-4xl">
        Stories & Essays
      </h1>
      <p className="mt-4 max-w-xl text-sm tracking-[0.08em] text-[#6b6560] uppercase">
        Thoughts on fashion, craft, and intentional living.
      </p>

      <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden border border-[rgba(201,169,110,0.12)] bg-[#111111]">
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#6b6560] text-sm tracking-[0.2em] uppercase">
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
              <h2 className="mt-2 font-serif text-xl font-light text-[#e8e4df] transition-colors group-hover:text-[#c9a96e]">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm text-[#6b6560]">
                  {post.excerpt}
                </p>
              )}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
