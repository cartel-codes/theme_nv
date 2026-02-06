import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import CartIcon from './CartIcon';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-novraux-ash/20 dark:border-novraux-graphite bg-novraux-bone/95 dark:bg-novraux-obsidian/95 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
        {/* Logo / Wordmark */}
        <div className="flex-1">
          <Link
            href="/"
            className="font-serif text-2xl font-light tracking-novraux-wide text-novraux-obsidian dark:text-novraux-bone uppercase transition-colors hover:text-novraux-gold dark:hover:text-novraux-gold"
          >
            NOVRAUX
          </Link>
        </div>

        {/* Navigation - Centered */}
        <nav className="hidden lg:flex flex-[2] items-center justify-center gap-8">
          <Link href="/products" className="font-sans text-xs font-normal tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/80 uppercase transition-colors hover:text-novraux-obsidian dark:hover:text-novraux-bone">Collection</Link>
          <Link href="/blog" className="font-sans text-xs font-normal tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/80 uppercase transition-colors hover:text-novraux-obsidian dark:hover:text-novraux-bone">Journal</Link>
          <Link href="/about" className="font-sans text-xs font-normal tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/80 uppercase transition-colors hover:text-novraux-obsidian dark:hover:text-novraux-bone">About</Link>
          <Link href="/contact" className="font-sans text-xs font-normal tracking-novraux-medium text-novraux-ash dark:text-novraux-bone/80 uppercase transition-colors hover:text-novraux-obsidian dark:hover:text-novraux-bone">Contact</Link>
        </nav>

        {/* Icons - Right */}
        <div className="flex flex-1 items-center justify-end gap-5 text-novraux-obsidian dark:text-novraux-bone">
          <ThemeToggle />
          <button className="hidden sm:block hover:text-novraux-gold transition-colors" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <UserMenu />
          <CartIcon />
          {/* Mobile Menu Toggle */}
          <button className="lg:hidden ml-2 hover:text-novraux-gold transition-colors" aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
