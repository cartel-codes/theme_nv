import ProductForm from '@/components/ProductForm';
import ProductVariantForm from '@/components/admin/ProductVariantForm';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone tracking-wide transition-colors">Product Not Found</h1>
        <p className="text-novraux-ash dark:text-novraux-bone/70 font-light transition-colors">The product you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone tracking-wide transition-colors">Edit Product</h1>
        <p className="text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">{product.name}</p>
      </div>

      <ProductForm productId={id} />

      <div className="border-t border-novraux-ash/20 dark:border-novraux-graphite pt-6 transition-colors">
        <ProductVariantForm productId={id} />
      </div>
    </div>
  );
}
