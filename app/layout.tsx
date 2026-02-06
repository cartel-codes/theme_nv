import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { AuthProvider } from '@/app/providers';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { generateMetadata as getBaseMetadata } from '@/lib/seo';
import PublicOnly from '@/components/PublicOnly';


// Cormorant Garamond - For elegant headlines and editorial content
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

// Inter - For UI elements, body copy, and technical information
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = getBaseMetadata({});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased relative bg-novraux-bone dark:bg-novraux-obsidian transition-colors duration-300">
        <div className="ambient-bg dark:opacity-10" />
        <div className="grain-overlay opacity-30" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <CartProvider>
                <Header />
                <main className="flex-1 text-novraux-obsidian dark:text-novraux-bone transition-colors duration-300">
                  {children}
                </main>
                <PublicOnly>
                  <Footer />
                </PublicOnly>

                <CartDrawer />
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
