import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { generateMetadata as getSEO, generateJsonLd } from '@/lib/seo';
import AddToCartButton from './AddToCartButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product) return {};

  const imageUrl = product.imageUrl || '';

  return getSEO({
    title: product.name,
    description: product.description || undefined,
    image: imageUrl,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product) notFound();

  const price = Number(product.price);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    url: `${siteUrl}/products/${product.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateJsonLd(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-16">
        <nav className="mb-10 text-sm tracking-[0.12em] text-[#6b6560] uppercase">
          <Link href="/products" className="transition-colors hover:text-[#c9a96e]">
            Products
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e8e4df]">{product.name}</span>
        </nav>

        <div className="grid gap-16 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden border border-[rgba(201,169,110,0.12)] bg-[#111111]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#6b6560] text-sm tracking-[0.2em] uppercase">
                No image
              </div>
            )}
          </div>

          <div>
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-xs tracking-[0.2em] text-[#c9a96e] uppercase transition-colors hover:text-[#d4bc8d]"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="mt-3 font-serif text-3xl font-light tracking-[0.15em] text-[#e8e4df] md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-6 font-serif text-2xl text-[#c9a96e]">
              ${price.toFixed(2)}
            </p>
            {product.description && (
              <p className="mt-8 text-sm leading-relaxed tracking-[0.06em] text-[#6b6560]">
                {product.description}
              </p>
            )}
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>
    </>
  );
}
