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
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: post.ogImage || post.imageUrl || undefined,
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
      <article className="bg-novraux-cream min-h-screen">
        {/* Hero Section */}
        <header className="container mx-auto px-4 pt-24 pb-16 lg:px-8 max-w-4xl text-center">
          <nav className="mb-12 flex justify-center items-center gap-4 text-[11px] font-semibold tracking-editorial text-novraux-grey uppercase">
            <Link href="/blog" className="transition-colors hover:text-novraux-charcoal">
              Journal
            </Link>
            <span className="w-1 h-1 bg-novraux-terracotta rounded-full" />
            <span className="text-novraux-charcoal">{post.title}</span>
          </nav>

          <span className="text-[11px] font-semibold tracking-editorial uppercase text-novraux-terracotta">
            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }) : 'Draft'}
          </span>
          <h1 className="mt-6 font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-novraux-charcoal leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-8 text-lg font-medium text-novraux-grey leading-relaxed max-w-2xl mx-auto italic">
              {post.excerpt}
            </p>
          )}
        </header>

        {post.imageUrl && (
          <div className="container mx-auto px-4 lg:px-8 max-w-6xl mb-20">
            <div className="relative aspect-[16/9] overflow-hidden bg-novraux-beige">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 pb-32 lg:px-8 max-w-2xl">
          <div className="prose prose-novraux prose-lg mx-auto">
            <div className="space-y-10 text-novraux-charcoal leading-[1.8] font-sans text-[17px]">
              {paragraphs.map((para, i) => {
                if (para.startsWith('**') && para.endsWith('**')) {
                  return (
                    <h2
                      key={i}
                      className="font-serif text-3xl font-medium text-novraux-charcoal pt-8"
                    >
                      {para.replace(/\*\*/g, '')}
                    </h2>
                  );
                }
                return (
                  <p
                    key={i}
                    className="tracking-[0.01em]"
                  >
                    {para.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </p>
                );
              })}
            </div>
          </div>

          <div className="mt-24 pt-12 border-t border-novraux-beige flex flex-col items-center">
            <p className="text-xs font-semibold tracking-editorial uppercase text-novraux-grey mb-8">
              Share this story
            </p>
            <div className="flex gap-12">
              {['Facebook', 'Twitter', 'Pinterest'].map((social) => (
                <button key={social} className="text-[11px] font-semibold tracking-editorial uppercase text-novraux-charcoal hover:text-novraux-terracotta transition-colors">
                  {social}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-24 text-center">
            <Link
              href="/blog"
              className="inline-block text-sm font-semibold tracking-editorial border-b border-novraux-charcoal pb-1 uppercase text-novraux-charcoal hover:text-novraux-terracotta hover:border-novraux-terracotta transition-colors"
            >
              ← Back to Journal
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
