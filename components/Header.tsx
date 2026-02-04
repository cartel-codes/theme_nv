import Link from 'next/link';
import CartIcon from './CartIcon';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(201,169,110,0.12)] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="font-serif text-xl font-light tracking-[0.3em] text-[#e8e4df] uppercase transition-colors hover:text-[#c9a96e]"
        >
          Novraux
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            href="/products"
            className="text-sm font-light tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
          >
            Products
          </Link>
          <Link
            href="/blog"
            className="text-sm font-light tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
          >
            Journal
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center text-[#6b6560] transition-colors hover:text-[#c9a96e]"
          >
            <CartIcon />
          </Link>
        </nav>
      </div>
    </header>
  );
}
