import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import CartIcon from './CartIcon';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-novraux-beige dark:border-white/10 bg-novraux-cream/80 dark:bg-[#121212]/80 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <div className="flex-1">
          <Link
            href="/"
            className="font-serif text-2xl font-medium tracking-editorial-widest text-novraux-charcoal dark:text-novraux-cream uppercase transition-colors hover:text-novraux-terracotta dark:hover:text-novraux-terracotta"
          >
            Novraux
          </Link>
        </div>

        {/* Navigation - Centered */}
        <nav className="hidden lg:flex flex-[2] items-center justify-center gap-10">
          <Link href="/products" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 dark:text-novraux-cream/80 uppercase transition-colors hover:text-novraux-charcoal dark:hover:text-novraux-cream">Collection</Link>
          <Link href="/blog" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 dark:text-novraux-cream/80 uppercase transition-colors hover:text-novraux-charcoal dark:hover:text-novraux-cream">Journal</Link>
          <Link href="/about" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 dark:text-novraux-cream/80 uppercase transition-colors hover:text-novraux-charcoal dark:hover:text-novraux-cream">About</Link>
          <Link href="/contact" className="text-[13px] font-medium tracking-editorial text-novraux-charcoal/80 dark:text-novraux-cream/80 uppercase transition-colors hover:text-novraux-charcoal dark:hover:text-novraux-cream">Contact</Link>
        </nav>

        {/* Icons - Right */}
        <div className="flex flex-1 items-center justify-end gap-5 text-novraux-charcoal dark:text-novraux-cream">
          <ThemeToggle />
          <button className="hidden sm:block hover:text-novraux-terracotta transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <UserMenu />
          <CartIcon />
          {/* Mobile Menu Toggle */}
          <button className="lg:hidden ml-2 hover:text-novraux-terracotta transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
