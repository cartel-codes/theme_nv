import Image from 'next/image';
import Link from 'next/link';
import type { Product, ProductImage } from '@prisma/client';

interface ProductWithImages extends Product {
  images?: ProductImage[];
}

interface ProductCardProps {
  product: ProductWithImages;
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = Number(product.price);
  const displayImage = product.images?.[0]?.url || product.imageUrl;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-sm hover:shadow-md dark:shadow-none dark:border dark:border-white/10 dark:hover:border-novraux-terracotta/50 transition-all duration-500"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-novraux-beige dark:bg-[#0f0f0f]">
        {/* Edition Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold tracking-editorial uppercase text-novraux-charcoal dark:text-novraux-cream">
            Limited Edition
          </span>
        </div>
        <div className="absolute inset-0">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-novraux-grey dark:text-novraux-beige/50 text-xs tracking-editorial uppercase">
              No image
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col p-6">
        <h3 className="font-serif text-xl font-medium text-novraux-charcoal dark:text-novraux-cream group-hover:text-novraux-terracotta transition-colors">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-novraux-grey dark:text-novraux-beige/70">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <p className="font-sans font-medium text-novraux-charcoal dark:text-novraux-cream">
            ${price.toFixed(2)}
          </p>
          <span className="text-[10px] tracking-editorial uppercase text-novraux-charcoal/40 dark:text-novraux-cream/40 group-hover:text-novraux-terracotta transition-colors">
            Shop Now →
          </span>
        </div>
      </div>
    </Link>
  );
}
