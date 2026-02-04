import Link from 'next/link';
import CartIcon from './CartIcon';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-novraux-beige bg-novraux-cream/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <div className="flex-1">
          <Link
            href="/"
            className="font-serif text-2xl font-medium tracking-editorial-widest text-novraux-charcoal uppercase transition-colors hover:text-novraux-terracotta"
          >
            Novraux
          </Link>
        </div>

        {/* Navigation - Centered */}
        <nav className="hidden lg:flex flex-[2] items-center justify-center gap-10">
          <Link href="/products" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 uppercase transition-colors hover:text-novraux-charcoal">Collection</Link>
          <Link href="/blog" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 uppercase transition-colors hover:text-novraux-charcoal">Journal</Link>
          <Link href="/about" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 uppercase transition-colors hover:text-novraux-charcoal">About</Link>
          <Link href="/contact" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 uppercase transition-colors hover:text-novraux-charcoal">Contact</Link>
        </nav>

        {/* Icons - Right */}
        <div className="flex flex-1 items-center justify-end gap-6 text-novraux-charcoal">
          <button className="hidden sm:block hover:text-novraux-terracotta transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <Link href="/account" className="hidden sm:block hover:text-novraux-terracotta transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </Link>
          <CartIcon />
          {/* Mobile Menu Toggle */}
          <button className="lg:hidden ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
