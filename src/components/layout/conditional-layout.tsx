'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import CartIcon from '@/components/layout/cart-icon';
import AnnouncementBar from './announcement-bar';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const [barHeight, setBarHeight] = useState(0);

  if (isAdmin) {
    // Si estamos en la sección del panel de administración (/admin),
    // no renderizamos la cabecera ni el pie de página públicos del e-commerce.
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <>
      {/* Contenedor Fijo Superior */}
      <div className="fixed top-0 w-full z-50 flex flex-col transition-all duration-300">
        <AnnouncementBar onHeightChange={setBarHeight} />
        
        {/* Navbar público */}
        <header className="w-full bg-[#121212]/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-serif tracking-widest font-bold text-[#f5f5f0] hover:text-[#d4af37] transition-colors"
            >
              ALPHAADDICTION
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/genesis"
                className="text-sm tracking-widest text-[#f5f5f0] hover:text-[#d4af37] transition-colors"
              >
                GENESIS-01
              </Link>
              <CartIcon />
            </nav>
          </div>
        </header>
      </div>

      {/* Contenido principal público (Desplazamiento dinámico para evitar CLS) */}
      <main 
        style={{ paddingTop: `${64 + barHeight}px` }} 
        className="flex-grow transition-all duration-300"
      >
        {children}
      </main>

      {/* Footer público */}
      <footer className="border-t border-[var(--border)] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 text-xs tracking-widest text-[var(--foreground)]">
          <div className="flex gap-6">
            <Link href="/legal/aviso-legal" className="hover:text-[var(--primary)] transition-colors">
              LEGAL
            </Link>
            <Link href="/legal/privacidad" className="hover:text-[var(--primary)] transition-colors">
              PRIVACIDAD
            </Link>
            <Link href="/legal/cookies" className="hover:text-[var(--primary)] transition-colors">
              COOKIES
            </Link>
          </div>
          <p>© 2026 ALPHAADDICTION</p>
        </div>
      </footer>
    </>
  );
}
