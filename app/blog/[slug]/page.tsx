import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { generateMetadata as getSEO, generateJsonLd } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post) return {};

  return getSEO({
    title: post.title,
    description: post.excerpt || undefined,
    image: post.imageUrl || undefined,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
  });

  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.imageUrl,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Novraux',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Novraux',
    },
    url: `${siteUrl}/blog/${post.slug}`,
  };

  // Simple markdown-like rendering for content (bold, paragraphs)
  const paragraphs = post.content.split('\n\n').filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateJsonLd(jsonLd) }}
      />
      <article className="container mx-auto max-w-3xl px-4 py-16">
        <nav className="mb-10 text-sm tracking-[0.12em] text-[#6b6560] uppercase">
          <Link href="/blog" className="transition-colors hover:text-[#c9a96e]">
            Journal
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e8e4df]">{post.title}</span>
        </nav>

        <p className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase">
          {new Date(post.publishedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-light tracking-[0.1em] text-[#e8e4df] md:text-4xl">
          {post.title}
        </h1>

        {post.imageUrl && (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden border border-[rgba(201,169,110,0.12)]">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
        )}

        <div className="mt-12 space-y-6 text-[#e8e4df]">
          {paragraphs.map((para, i) => {
            if (para.startsWith('**') && para.endsWith('**')) {
              return (
                <h3
                  key={i}
                  className="font-serif text-lg font-light text-[#c9a96e]"
                >
                  {para.replace(/\*\*/g, '')}
                </h3>
              );
            }
            return (
              <p
                key={i}
                className="leading-relaxed tracking-[0.02em] text-[#e8e4df]/90"
              >
                {para.replace(/\*\*(.*?)\*\*/g, '$1')}
              </p>
            );
          })}
        </div>

        <Link
          href="/blog"
          className="mt-16 inline-block text-sm tracking-[0.2em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
        >
          ← Back to Journal
        </Link>
      </article>
    </>
  );
}
