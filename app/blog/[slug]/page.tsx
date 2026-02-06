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
      <article className="bg-novraux-bone dark:bg-novraux-obsidian min-h-screen transition-colors">
        {/* Hero Section */}
        <header className="container mx-auto px-6 pt-20 pb-12 lg:px-8 max-w-4xl">
          <nav className="mb-12 flex justify-center items-center gap-4 text-xs font-normal tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/70 uppercase transition-colors">
            <Link href="/blog" className="hover:text-novraux-obsidian dark:hover:text-novraux-bone transition-colors">
              Journal
            </Link>
            <span className="w-1 h-1 bg-novraux-gold rounded-full" />
            <span className="text-novraux-obsidian dark:text-novraux-bone">{post.title}</span>
          </nav>

          <div className="text-center">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-novraux-obsidian dark:text-novraux-bone leading-tight transition-colors">
              {post.title}
            </h1>
            <p className="mt-8 font-sans text-base font-light text-novraux-ash dark:text-novraux-bone/70 transition-colors">
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }) : 'Draft'}
            </p>
            {post.excerpt && (
              <p className="mt-8 text-lg font-light text-novraux-ash dark:text-novraux-bone/70 leading-relaxed max-w-2xl mx-auto italic transition-colors">
                {post.excerpt}
              </p>
            )}
          </div>
        </header>

        {post.imageUrl && (
          <div className="container mx-auto px-6 lg:px-8 max-w-6xl mb-20">
            <div className="relative aspect-[16/9] overflow-hidden bg-novraux-graphite dark:bg-novraux-obsidian rounded-sm">
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

        <div className="container mx-auto px-6 pb-32 lg:px-8 max-w-2xl">
          <div className="prose dark:prose-invert mx-auto">
            <div className="space-y-10 text-novraux-charcoal dark:text-novraux-bone leading-[1.8] font-sans text-[17px] transition-colors">
              {paragraphs.map((para, i) => {
                if (para.startsWith('**') && para.endsWith('**')) {
                  return (
                    <h2
                      key={i}
                      className="font-serif text-3xl font-light text-novraux-obsidian dark:text-novraux-bone pt-8 transition-colors"
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

          <div className="mt-24 pt-12 border-t border-novraux-ash/20 dark:border-novraux-graphite flex flex-col items-center transition-colors">
            <p className="text-xs font-normal tracking-novraux-medium uppercase text-novraux-ash dark:text-novraux-bone/70 mb-8 transition-colors">
              Share this story
            </p>
            <div className="flex gap-12">
              {['Facebook', 'Twitter', 'Pinterest'].map((social) => (
                <button key={social} className="text-xs font-normal tracking-novraux-medium uppercase text-novraux-obsidian dark:text-novraux-bone hover:text-novraux-gold dark:hover:text-novraux-gold transition-colors">
                  {social}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-24 text-center">
            <Link
              href="/blog"
              className="inline-block text-sm font-normal tracking-novraux-medium border-b border-novraux-obsidian dark:border-novraux-bone pb-1 uppercase text-novraux-obsidian dark:text-novraux-bone hover:text-novraux-gold dark:hover:text-novraux-gold hover:border-novraux-gold dark:hover:border-novraux-gold transition-colors"
            >
              ← Back to Journal
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
