import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { generateMetadata as getSEO, generateJsonLd, generateAutoTitle, generateAutoDescription } from '@/lib/seo';
import AddToCartButton from './AddToCartButton';
import ImageGallery from './ImageGallery';
import ProductTabs from './ProductTabs';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' }, take: 1 }
    },
  });

  if (!product) return {};

  // Use database SEO fields with smart fallbacks
  const title = product.metaTitle || generateAutoTitle(product.name);
  const description = product.metaDescription || generateAutoDescription(product.description, product.name);

  // Use ogImage, or first product image, or legacy imageUrl
  const imageUrl = product.ogImage
    || (product.images.length > 0 ? product.images[0].url : null)
    || product.imageUrl
    || '';

  return getSEO({
    title,
    description,
    image: imageUrl,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { order: 'asc' }
      }
    },
  });

  if (!product) notFound();

  // Fetch related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id }
    },
    take: 4,
    include: { category: true }
  });

  const price = Number(product.price);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Prepare images for gallery
  const galleryImages = product.images.length > 0
    ? product.images.map(img => ({ url: img.url, alt: img.alt }))
    : product.imageUrl
      ? [{ url: product.imageUrl, alt: product.name }]
      : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: galleryImages.map(img => img.url),  // Multiple images
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Novraux',
    },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    url: `${siteUrl}/products/${product.slug}`,
    ...(product.category && {
      category: product.category.name,
    }),
    ...(product.metaTitle && {
      headline: product.metaTitle,
    }),
  };

  // Tab content
  const tabs = [
    {
      id: 'details',
      label: 'Details',
      content: (
        <div className="text-[15px] leading-relaxed tracking-[0.02em] text-[#5D5D5D] dark:text-novraux-beige/80 space-y-4">
          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p>Crafted with exceptional attention to detail, this piece embodies timeless elegance.</p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="block text-[#8B8B8B] dark:text-novraux-beige/60 uppercase tracking-[0.25em] mb-1.5 font-medium text-[11px]">SKU</span>
              <span className="text-[#B8926A] font-medium">{product.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div>
              <span className="block text-[#8B8B8B] dark:text-novraux-beige/60 uppercase tracking-[0.25em] mb-1.5 font-medium text-[11px]">Availability</span>
              <span className="text-green-600 dark:text-green-400 font-medium">In Stock</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'care',
      label: 'Care',
      content: (
        <div className="text-[15px] leading-relaxed tracking-[0.02em] text-[#5D5D5D] dark:text-novraux-beige/80 space-y-3">
          <p>• Dry clean only for best results</p>
          <p>• Store in a cool, dry place away from direct sunlight</p>
          <p>• Handle with care to preserve fabric integrity</p>
          <p>• Professional pressing recommended</p>
        </div>
      ),
    },
    {
      id: 'shipping',
      label: 'Shipping',
      content: (
        <div className="text-[15px] leading-relaxed tracking-[0.02em] text-[#5D5D5D] dark:text-novraux-beige/80 space-y-3">
          <p>• Free standard shipping on orders over $200</p>
          <p>• Express shipping available (2-3 business days)</p>
          <p>• International shipping available to select countries</p>
          <p>• 30-day return policy for unworn items</p>
        </div>
      ),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateJsonLd(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-16">
        {/* Breadcrumbs - Bottega Veneta inspired */}
        <nav className="mb-10 text-[13px] tracking-[0.15em] uppercase">
          <Link href="/products" className="text-[#8B8B8B] dark:text-novraux-beige/60 transition-colors hover:text-[#B8926A]">
            Products
          </Link>
          <span className="mx-3 text-[#B8926A]">/</span>
          <span className="text-[#2C2C2C] dark:text-novraux-cream font-medium">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Image Gallery */}
          <ImageGallery images={galleryImages} productName={product.name} />

          {/* Product Info */}
          <div className="space-y-8">
            {/* Category */}
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="inline-block text-[11px] tracking-[0.3em] text-[#B8926A] uppercase transition-colors hover:text-[#D4A574] font-medium"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title - Hermès-inspired rich dark */}
            <h1 className="font-serif text-4xl font-light tracking-[0.08em] text-[#2C2C2C] dark:text-novraux-cream md:text-5xl leading-tight">
              {product.name}
            </h1>

            {/* Price - Tom Ford gold */}
            <p className="font-serif text-3xl text-[#B8926A] font-normal">
              ${price.toFixed(2)}
            </p>

            {/* Short Description - Warm gray */}
            {product.description && (
              <p className="text-[15px] leading-relaxed tracking-[0.02em] text-[#5D5D5D] dark:text-novraux-beige/80 border-l-2 border-[#D4A574] pl-6 italic">
                {product.description.slice(0, 200)}
                {product.description.length > 200 ? '...' : ''}
              </p>
            )}

            {/* Add to Cart */}
            <div className="pt-4">
              <AddToCartButton productId={product.id} />
            </div>

            {/* Additional Info - Refined badges */}
            <div className="pt-6 flex flex-wrap gap-5 text-[11px] tracking-[0.25em] text-[#5D5D5D] dark:text-novraux-beige/80 uppercase">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#B8926A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Authentic</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#B8926A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <ProductTabs tabs={tabs} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-[#E8E8E8] dark:border-white/10 pt-16">
            <h2 className="mb-12 font-serif text-2xl font-normal tracking-[0.08em] text-[#2C2C2C] dark:text-novraux-cream text-center">
              You May Also Like
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => {
                const relatedPrice = Number(relatedProduct.price);
                return (
                  <Link
                    key={relatedProduct.id}
                    href={`/products/${relatedProduct.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-square overflow-hidden border border-[rgba(201,169,110,0.12)] bg-[#0f0f0f] mb-4">
                      {relatedProduct.imageUrl && (
                        <Image
                          src={relatedProduct.imageUrl}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      {relatedProduct.category && (
                        <p className="text-[10px] tracking-[0.25em] text-[#c9a96e] uppercase">
                          {relatedProduct.category.name}
                        </p>
                      )}
                      <h3 className="font-serif text-base tracking-[0.08em] text-[#2C2C2C] dark:text-[#e8e4df] group-hover:text-[#c9a96e] transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-sm text-[#9b8f82]">
                        ${relatedPrice.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
