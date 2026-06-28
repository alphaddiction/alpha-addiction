import { getActiveDrop } from '@/lib/drops';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Alpha Addiction | Colecciones Exclusivas de Edición Limitada',
  description: 'Colecciones numeradas y exclusivas de moda minimalista y streetwear de lujo silencioso. Cada drop es único y limitado.',
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const activeDrop = await getActiveDrop();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';
  
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Alpha Addiction',
    'url': baseUrl,
    'logo': `${baseUrl}/images/logos/logo.png`,
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Alpha Addiction',
    'url': baseUrl,
  };

  const slug = activeDrop ? activeDrop.slug : 'genesis-drop-01';
  const dropName = activeDrop ? activeDrop.name : 'GENESIS DROP';
  
  let subtitle = 'CANTIDADES LIMITADAS DISPONIBLES';
  let buttonText = 'Conviértete en Alpha';
  let linkHref = `/drops/${slug}`;

  if (activeDrop) {
    if (activeDrop.status === 'COMING_SOON') {
      subtitle = 'PRÓXIMO LANZAMIENTO';
      buttonText = 'Ver Próximo Drop';
    } else if (activeDrop.status === 'LIVE') {
      subtitle = 'COLECCIÓN ACTIVA · EDICIÓN LIMITADA';
      buttonText = 'Acceder al Drop';
    } else if (activeDrop.status === 'ENDED' || activeDrop.status === 'SOLD_OUT') {
      subtitle = 'COLECCIÓN FINALIZADA';
      buttonText = 'Ver Archivo del Drop';
    }
  } else {
    // Si no hay drops creados aún, usar el catálogo original de contingencia
    linkHref = '/genesis';
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      {/* Marcado de datos estructurados JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Brand Hero */}
      <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-[var(--foreground)] max-w-3xl mx-auto leading-tight">
        La disciplina no se lleva. Se vive.
      </h1>

      {/* Editorial Plate (Legibility Fix) */}
      <div className="flex flex-col items-center gap-3 py-6 px-8 mb-10 bg-white/30 backdrop-blur-[2px] border border-white/20 shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 max-w-2xl">
        <p className="text-sm md:text-base text-[var(--foreground)] tracking-wide leading-relaxed font-light">
          Alpha Addiction crea prendas premium para quienes saben que la grandeza no se hereda, se construye. Ediciones limitadas, materiales de alta calidad y una filosofía basada en la disciplina y el rendimiento.
        </p>
      </div>

      {/* Main CTA */}
      <Link
        href={linkHref}
        className="group relative inline-flex items-center gap-2 px-8 py-4 bg-[#d4af37] text-black font-bold tracking-widest text-sm uppercase overflow-hidden hover:bg-white transition-colors duration-300 animate-in fade-in zoom-in duration-1000 delay-500"
      >
        <span className="relative z-10">Comprar colección</span>
        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
