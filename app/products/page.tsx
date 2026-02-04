import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import { generateMetadata as getSEO } from '@/lib/seo';

export const metadata: Metadata = getSEO({
  title: 'Products',
  description: 'Browse our full catalog of quality products.',
  path: '/products',
});

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <p className="text-xs tracking-[0.25em] text-[#c9a96e] uppercase">
        Catalog
      </p>
      <h1 className="mt-2 font-serif text-3xl font-light tracking-[0.2em] text-[#e8e4df] uppercase md:text-4xl">
        All Products
      </h1>
      <p className="mt-4 text-sm tracking-[0.08em] text-[#6b6560] uppercase">
        {products.length} products
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
