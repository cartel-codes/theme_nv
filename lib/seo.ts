import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
  jsonLd?: object | object[];
}

export function generateMetadata({
  title,
  description,
  image,
  path = '',
  noIndex = false,
}: SEOProps): Metadata {
  const url = `${siteUrl}${path}`;
  const fullTitle = title ? `${title} | Novraux` : 'Novraux - Modern E-commerce';
  const fullDescription =
    description ||
    'Modern, SEO-optimized e-commerce platform. Discover quality products.';
  const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}/og-default.png`;

  return {
    title: fullTitle,
    description: fullDescription,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: 'Novraux',
      images: [{ url: fullImage, width: 1200, height: 630 }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
    },
  };
}

export function generateJsonLd(ld: object | object[]): string {
  const data = Array.isArray(ld) ? ld : [ld];
  return JSON.stringify(data);
}
