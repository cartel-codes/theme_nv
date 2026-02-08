import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl md:text-5xl font-light text-novraux-obsidian dark:text-novraux-bone tracking-wide transition-colors">Create New Product</h1>
        <p className="text-novraux-ash dark:text-novraux-bone/70 mt-2 font-light transition-colors">Add a new product to your store</p>
      </div>

      <ProductForm allowPrintifyImport />
    </div>
  );
}
