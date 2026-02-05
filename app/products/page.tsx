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
    include: {
      category: true,
      images: {
        take: 1,
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="bg-novraux-cream dark:bg-[#121212] min-h-screen transition-colors duration-300">
      <div className="container mx-auto px-4 py-24 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-editorial uppercase text-novraux-terracotta">
            The Collection
          </span>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl font-medium text-novraux-charcoal dark:text-novraux-cream uppercase transition-colors">
            All Creations
          </h1>
          <p className="mt-6 text-novraux-grey dark:text-novraux-beige/70 max-w-xl mx-auto transition-colors">
            Discover our curated archive of limited series garments, each handcrafted with a commitment to refined minimalism.
          </p>
          <p className="mt-4 text-[10px] tracking-editorial uppercase text-novraux-grey/60 dark:text-novraux-beige/50 font-medium transition-colors">
            Showing {products.length} series
          </p>
        </div>

        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
