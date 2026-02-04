import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getOrCreateCart } from '@/lib/cart';
import { generateMetadata as getSEO } from '@/lib/seo';
import CartActions from './CartActions';

export const metadata: Metadata = getSEO({
  title: 'Shopping Cart',
  description: 'Review your cart and continue shopping.',
  path: '/cart',
});

export default async function CartPage() {
  const cart = await getOrCreateCart();

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-light tracking-[0.2em] text-[#e8e4df] uppercase">
          Your cart is empty
        </h1>
        <p className="mt-4 text-sm tracking-[0.08em] text-[#6b6560] uppercase">
          Add some products to get started.
        </p>
        <Link
          href="/products"
          className="mt-10 inline-block border border-[rgba(201,169,110,0.4)] px-8 py-3 text-xs font-light tracking-[0.25em] text-[#c9a96e] uppercase transition-all hover:bg-[rgba(201,169,110,0.08)] hover:border-[#c9a96e]"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const total = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="container mx-auto px-4 py-16">
      <p className="text-xs tracking-[0.25em] text-[#c9a96e] uppercase">
        Cart
      </p>
      <h1 className="mt-2 font-serif text-3xl font-light tracking-[0.2em] text-[#e8e4df] uppercase">
        Shopping Cart
      </h1>
      <p className="mt-4 text-sm tracking-[0.08em] text-[#6b6560] uppercase">
        {cart.items.reduce((sum, i) => sum + i.quantity, 0)} item
        {cart.items.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''}{' '}
        in your cart
      </p>

      <div className="mt-12 space-y-6">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-6 border border-[rgba(201,169,110,0.12)] bg-[#111111] p-6 sm:flex-row sm:items-center"
          >
            <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-[#0a0a0a]">
              {item.product.imageUrl ? (
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#6b6560]">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1">
              <Link
                href={`/products/${item.product.slug}`}
                className="font-serif text-lg font-light text-[#e8e4df] transition-colors hover:text-[#c9a96e]"
              >
                {item.product.name}
              </Link>
              <p className="mt-1 text-sm tracking-[0.06em] text-[#6b6560]">
                ${Number(item.product.price).toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-6">
              <CartActions itemId={item.id} quantity={item.quantity} />
              <p className="w-20 text-right font-serif text-[#c9a96e]">
                ${(Number(item.product.price) * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-[rgba(201,169,110,0.12)] pt-10">
        <div className="flex flex-col items-end gap-2">
          <p className="font-serif text-xl text-[#c9a96e]">
            Total: ${total.toFixed(2)}
          </p>
          <p className="text-xs tracking-[0.12em] text-[#6b6560] uppercase">
            Checkout coming in Phase 3
          </p>
        </div>
      </div>
    </div>
  );
}
