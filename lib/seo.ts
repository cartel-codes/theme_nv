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
  const fullTitle = title ? `${title} | Novraux` : 'Novraux — Contemporary Luxury & Limited Editions';
  const fullDescription =
    description ||
    'Discover contemporary luxury through our numbered series of limited edition fashion. Handcrafted in Casablanca, designed for the intentional.';
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

// SEO Auto-generation helpers

/**
 * Generate an auto meta title from product name
 */
export function generateAutoTitle(name: string): string {
  const suffix = ' | Novraux';
  const maxLength = 60 - suffix.length;

  if (name.length <= maxLength) {
    return `${name}${suffix}`;
  }

  return `${name.slice(0, maxLength - 3)}...${suffix}`;
}

/**
 * Generate an auto meta description from product description or name
 */
export function generateAutoDescription(description: string | null, name: string): string {
  if (description && description.length > 0) {
    // Use first 155 characters of description
    if (description.length <= 155) {
      return description;
    }
    return `${description.slice(0, 152)}...`;
  }

  // Fallback: generate from name
  return `Discover ${name} at Novraux. Premium luxury fashion crafted with exceptional attention to detail.`;
}

/**
 * Truncate text for SEO display with ellipsis
 */
export function truncateForSEO(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Calculate SEO health score for a product
 */
export interface SEOScoreResult {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'needs-work' | 'poor';
  checks: {
    id: string;
    label: string;
    passed: boolean;
    message: string;
  }[];
}

export interface SEOCheckInput {
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  description?: string | null;
  images?: { alt?: string | null }[];
}

export function calculateSEOScore(product: SEOCheckInput): SEOScoreResult {
  const checks = [];
  let passed = 0;
  const total = 5;

  // Check 1: Meta title
  const hasMetaTitle = !!product.metaTitle && product.metaTitle.length > 0;
  const titleLength = product.metaTitle?.length || 0;
  const titleOptimal = titleLength >= 50 && titleLength <= 60;
  checks.push({
    id: 'meta-title',
    label: 'Meta Title',
    passed: hasMetaTitle,
    message: !hasMetaTitle
      ? 'Add a meta title (50-60 characters)'
      : titleOptimal
        ? 'Perfect length!'
        : titleLength < 50
          ? `Too short (${titleLength}/50 min)`
          : `Too long (${titleLength}/60 max)`,
  });
  if (hasMetaTitle) passed++;

  // Check 2: Meta description
  const hasMetaDesc = !!product.metaDescription && product.metaDescription.length > 0;
  const descLength = product.metaDescription?.length || 0;
  const descOptimal = descLength >= 120 && descLength <= 160;
  checks.push({
    id: 'meta-description',
    label: 'Meta Description',
    passed: hasMetaDesc,
    message: !hasMetaDesc
      ? 'Add a meta description (120-160 characters)'
      : descOptimal
        ? 'Perfect length!'
        : descLength < 120
          ? `Could be longer (${descLength}/120 min)`
          : `Too long (${descLength}/160 max)`,
  });
  if (hasMetaDesc) passed++;

  // Check 3: Focus keyword
  const hasFocusKeyword = !!product.focusKeyword && product.focusKeyword.length > 0;
  checks.push({
    id: 'focus-keyword',
    label: 'Focus Keyword',
    passed: hasFocusKeyword,
    message: hasFocusKeyword ? 'Focus keyword set' : 'Add a focus keyword for better targeting',
  });
  if (hasFocusKeyword) passed++;

  // Check 4: Product description
  const hasDescription = !!product.description && product.description.length >= 100;
  const descWordCount = product.description?.split(' ').length || 0;
  checks.push({
    id: 'description',
    label: 'Product Description',
    passed: hasDescription,
    message: hasDescription
      ? `Good (${descWordCount} words)`
      : 'Add a detailed description (100+ characters)',
  });
  if (hasDescription) passed++;

  // Check 5: Image alt text
  const images = product.images || [];
  const hasImages = images.length > 0;
  const imagesWithAlt = images.filter(img => img.alt && img.alt.length > 0).length;
  const allImagesHaveAlt = hasImages && imagesWithAlt === images.length;
  checks.push({
    id: 'image-alt',
    label: 'Image Alt Text',
    passed: allImagesHaveAlt || !hasImages,
    message: !hasImages
      ? 'Add product images'
      : allImagesHaveAlt
        ? `All ${images.length} images have alt text`
        : `${imagesWithAlt}/${images.length} images have alt text`,
  });
  if (allImagesHaveAlt || !hasImages) passed++;

  // Calculate score
  const score = Math.round((passed / total) * 100);

  let status: SEOScoreResult['status'];
  if (score >= 80) status = 'excellent';
  else if (score >= 60) status = 'good';
  else if (score >= 40) status = 'needs-work';
  else status = 'poor';

  return { score, status, checks };
}
