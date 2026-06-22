import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">

      {/* Brand Hero */}
      {/* Brand Hero */}
      <h1 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-[var(--foreground)]">
        ALPHA<span className="text-[var(--primary)]">ADDICTION</span>
      </h1>

      {/* Editorial Plate (Legibility Fix) */}
      <div className="flex flex-col items-center gap-3 py-6 px-10 mb-10 bg-white/30 backdrop-blur-[2px] border border-white/20 shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
        <p className="text-lg md:text-xl text-[var(--foreground)] tracking-[0.15em] font-medium">
          GENESIS DROP 01
        </p>

        {/* Champagne Anchor Line */}
        <div className="w-20 h-px bg-[var(--primary)] opacity-60"></div>

        <p className="text-[10px] md:text-xs text-[var(--muted)] tracking-[0.3em] uppercase font-medium">
          CANTIDADES LIMITADAS DISPONIBLES
        </p>
      </div>

      {/* Main CTA */}
      <Link
        href="/genesis"
        className="group relative inline-flex items-center gap-2 px-8 py-4 bg-[#d4af37] text-black font-bold tracking-widest text-sm uppercase overflow-hidden hover:bg-white transition-colors duration-300 animate-in fade-in zoom-in duration-1000 delay-500"
      >
        <span className="relative z-10">Conviértete en Alpha</span>
        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
