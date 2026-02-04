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
      className="group flex flex-col overflow-hidden border border-[rgba(201,169,110,0.12)] bg-[#111111] transition-all duration-300 hover:border-[rgba(201,169,110,0.3)]"
    >
      <div className="relative aspect-square bg-[#0a0a0a]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
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
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-light text-[#e8e4df] transition-colors group-hover:text-[#c9a96e]">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm tracking-[0.06em] text-[#6b6560]">
          {product.description}
        </p>
        <p className="mt-auto pt-4 font-serif text-[#c9a96e]">
          ${price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
