import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-novraux-charcoal text-novraux-cream px-4 py-16 lg:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Info */}
          <div className="col-span-1 lg:col-span-1">
            <Link
              href="/"
              className="font-serif text-2xl font-medium tracking-editorial-widest uppercase hover:text-novraux-terracotta transition-colors"
            >
              Novraux
            </Link>
            <p className="mt-6 text-sm text-novraux-beige/60 leading-relaxed max-w-xs">
              Contemporary luxury, limited edition fashion. Handcrafted with intention in our Casablanca atelier.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-[13px] font-semibold tracking-editorial uppercase mb-6 text-novraux-cream">Shop</h4>
            <ul className="space-y-4">
              <li><Link href="/products" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">All Creations</Link></li>
              <li><Link href="/products" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">New Arrivals</Link></li>
              <li><Link href="/products" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">Limited Editions</Link></li>
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h4 className="text-[13px] font-semibold tracking-editorial uppercase mb-6 text-novraux-cream">Brand</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">Our Story</Link></li>
              <li><Link href="/blog" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">Editorial</Link></li>
              <li><Link href="/about" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">Atelier</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-[13px] font-semibold tracking-editorial uppercase mb-6 text-novraux-cream">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/contact" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">Contact</Link></li>
              <li><Link href="/contact" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">Shipping</Link></li>
              <li><Link href="/contact" className="text-sm text-novraux-beige/60 hover:text-novraux-cream transition-colors">Returns</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-novraux-beige/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-novraux-beige/40 tracking-widest uppercase">
            © {new Date().getFullYear()} Novraux. All rights reserved.
          </p>
          <div className="flex gap-8">
            {['Instagram', 'Pinterest', 'X'].map((social) => (
              <a key={social} href="#" className="text-xs text-novraux-beige/40 hover:text-novraux-cream uppercase tracking-widest transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
