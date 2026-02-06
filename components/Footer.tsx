import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-novraux-obsidian text-novraux-bone px-6 py-20 lg:px-8 transition-colors border-t border-novraux-graphite">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12">
          {/* Brand Info — Brand Strategy Approved */}
          <div className="col-span-1 lg:col-span-1">
            <Link
              href="/"
              className="font-serif text-3xl font-light tracking-novraux-wide uppercase hover:text-novraux-gold transition-colors"
            >
              NOVRAUX
            </Link>
            <p className="mt-8 font-sans text-sm font-light text-novraux-bone/70 leading-relaxed">
              Designed with intention.<br />
              Made to last.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-sans text-xs font-normal tracking-novraux-medium uppercase mb-6 text-novraux-bone/50">Shop</h4>
            <ul className="space-y-4">
              <li><Link href="/products" className="font-sans text-sm font-light text-novraux-bone/70 hover:text-novraux-bone transition-colors">Collection</Link></li>
              <li><Link href="/about" className="font-sans text-sm font-light text-novraux-bone/70 hover:text-novraux-bone transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Editorial Links */}
          <div>
            <h4 className="font-sans text-xs font-normal tracking-novraux-medium uppercase mb-6 text-novraux-bone/50">Editorial</h4>
            <ul className="space-y-4">
              <li><Link href="/blog" className="font-sans text-sm font-light text-novraux-bone/70 hover:text-novraux-bone transition-colors">Journal</Link></li>
              <li><Link href="/about" className="font-sans text-sm font-light text-novraux-bone/70 hover:text-novraux-bone transition-colors">Our Craft</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-sans text-xs font-normal tracking-novraux-medium uppercase mb-6 text-novraux-bone/50">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/contact" className="font-sans text-sm font-light text-novraux-bone/70 hover:text-novraux-bone transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar — Brand Strategy: "Designed with intention. © 2026 Novraux" */}
        <div className="mt-20 pt-10 border-t border-novraux-graphite flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-sans text-sm font-light text-novraux-bone/50">
            © {new Date().getFullYear()} Novraux
          </p>
          <div className="flex gap-8">
            {['Instagram', 'Pinterest'].map((social) => (
              <a key={social} href="#" className="font-sans text-xs font-light text-novraux-bone/50 hover:text-novraux-gold uppercase tracking-wide transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
