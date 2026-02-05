import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-wide">Create New Product</h1>
        <p className="text-neutral-600 mt-1">Add a new product to your store</p>
      </div>

      <ProductForm />
    </div>
  );
}
