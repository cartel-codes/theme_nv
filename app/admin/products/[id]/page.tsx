import ProductForm from '@/components/ProductForm';
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
        <h1 className="text-3xl font-serif tracking-wide">Product Not Found</h1>
        <p className="text-neutral-600">The product you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-wide">Edit Product</h1>
        <p className="text-neutral-600 mt-1">{product.name}</p>
      </div>

      <ProductForm productId={id} />
    </div>
  );
}
