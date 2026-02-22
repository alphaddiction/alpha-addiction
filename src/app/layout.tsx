import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { CartProvider } from '@/context/cart-context';
import CartIcon from '@/components/layout/cart-icon';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'AlphaAddiction | Genesis Drop 01',
  description: 'Edición limitada de moda minimalista.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      {/* 
          TEXTURE CONTROL: 
          data-texture="on" -> Activa el overlay (ahora CSS body background)
          data-texture="off" -> Fondo plano limpio
       */}
      <body data-texture="on" className="min-h-screen flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
        <CartProvider>
          {/* Navbar: Dark Surface for contrast */}
          <header className="fixed top-0 w-full z-50 bg-[#121212]/90 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="text-xl font-serif tracking-widest font-bold text-[#f5f5f0] hover:text-[#d4af37] transition-colors">
                ALPHAADDICTION
              </Link>

              <nav className="flex items-center gap-6">
                <Link href="/genesis" className="text-sm tracking-widest text-[#f5f5f0] hover:text-[#d4af37] transition-colors">
                  GENESIS-01
                </Link>
                <CartIcon />
              </nav>
            </div>
          </header>

          {/* Main Content - No EditorialLines here */}
          <main className="flex-grow pt-16">
            {children}
          </main>

          {/* Footer: Simple on light background */}
          <footer className="border-t border-[var(--border)] py-12 mt-20">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 text-xs tracking-widest text-[var(--foreground)]">
              <div className="flex gap-6">
                <Link href="/legal/aviso-legal" className="hover:text-[var(--primary)] transition-colors">LEGAL</Link>
                <Link href="/legal/privacidad" className="hover:text-[var(--primary)] transition-colors">PRIVACIDAD</Link>
                <Link href="/legal/cookies" className="hover:text-[var(--primary)] transition-colors">COOKIES</Link>
              </div>
              <p>© 2026 ALPHAADDICTION</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
