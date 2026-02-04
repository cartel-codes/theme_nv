import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(201,169,110,0.12)] bg-[#111111]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="font-serif text-lg font-light tracking-[0.25em] text-[#e8e4df] uppercase transition-colors hover:text-[#c9a96e]"
            >
              Novraux
            </Link>
            <p className="mt-2 text-sm tracking-[0.08em] text-[#6b6560] uppercase">
              A new chapter in fashion — built on intention, rooted in craft.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-8">
            <Link
              href="/products"
              className="text-sm tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
            >
              Products
            </Link>
            <Link
              href="/blog"
              className="text-sm tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
            >
              Journal
            </Link>
            <Link
              href="/cart"
              className="text-sm tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
            >
              Cart
            </Link>
            <span className="h-px w-8 bg-[rgba(201,169,110,0.2)]" />
            <a
              href="https://instagram.com/novraux"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
            >
              Instagram
            </a>
            <a
              href="https://twitter.com/novraux"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
            >
              X
            </a>
            <a
              href="https://www.tiktok.com/@novraux"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-[0.18em] text-[#6b6560] uppercase transition-colors hover:text-[#c9a96e]"
            >
              TikTok
            </a>
          </nav>
        </div>
        <div className="mt-8 border-t border-[rgba(201,169,110,0.12)] pt-8">
          <p className="text-center text-xs tracking-[0.18em] text-[#6b6560] uppercase">
            © {new Date().getFullYear()} Novraux
          </p>
        </div>
      </div>
    </footer>
  );
}
