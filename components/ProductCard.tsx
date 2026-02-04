import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@prisma/client';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = Number(product.price);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-500"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-novraux-beige">
        {/* Edition Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold tracking-editorial uppercase text-novraux-charcoal">
            Limited Edition
          </span>
        </div>

        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-novraux-grey text-xs tracking-editorial uppercase">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col p-6">
        <h3 className="font-serif text-xl font-medium text-novraux-charcoal group-hover:text-novraux-terracotta transition-colors">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-novraux-grey">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <p className="font-sans font-medium text-novraux-charcoal">
            ${price.toFixed(2)}
          </p>
          <span className="text-[10px] tracking-editorial uppercase text-novraux-charcoal/40 group-hover:text-novraux-terracotta transition-colors">
            Shop Now →
          </span>
        </div>
      </div>
    </Link>
  );
}
