import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { AuthProvider } from '@/app/providers';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { generateMetadata as getBaseMetadata } from '@/lib/seo';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
});

export const metadata: Metadata = getBaseMetadata({});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased relative bg-novraux-cream dark:bg-[#121212] transition-colors duration-300">
        <div className="ambient-bg dark:opacity-10" />
        <div className="grain-overlay opacity-30" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <CartProvider>
                <Header />
                <main className="flex-1 text-novraux-charcoal dark:text-novraux-cream transition-colors duration-300">
                  {children}
                </main>
                <Footer />
                <CartDrawer />
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
