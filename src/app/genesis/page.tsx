import type { Metadata } from 'next';
import Link from 'next/link';
import { getDbProducts } from '@/shared/models/products';
import { formatPrice } from '@/shared/utils/utils';
import { ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Colección Genesis | Alpha Addiction',
  description: 'Explora la colección fundacional de Alpha Addiction. 5 piezas exclusivas de edición limitada con diseño minimalista.',
  alternates: {
    canonical: '/genesis',
  },
};

export default async function GenesisPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const products = await getDbProducts();
    const params = await searchParams;
    const waitlistSuccess = params['waitlist'] === 'ok';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';
    
    const collectionJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Colección Genesis | Alpha Addiction',
        'description': 'Explora la colección fundacional de Alpha Addiction. 5 piezas exclusivas de edición limitada con diseño minimalista.',
        'url': `${baseUrl}/genesis`,
        'mainEntity': {
            '@type': 'ItemList',
            'itemListElement': products.map((product, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'url': `${baseUrl}/product/${product.slug}`,
                'name': product.name,
            })),
        },
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Marcado de datos estructurados JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
            />

            {/* Optional Banner (Discrete/Option B) - Adjusted for Light Theme */}
            {waitlistSuccess && (
                <div className="bg-[var(--surface)] text-[var(--surface-foreground)] border-b border-[var(--primary)]/20 text-[10px] uppercase tracking-[0.2em] text-center py-3 fixed top-16 w-full z-40 animate-in slide-in-from-top">
                    Listo. Estás en la lista para el próximo drop.
                </div>
            )}

            {/* Header: Refined Hierarchy & Presence */}
            <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto mb-8">
                <h2 className="text-5xl md:text-6xl font-serif font-bold mb-4 tracking-tighter text-[var(--foreground)]">Genesis</h2>
                <div className="flex flex-col gap-6 items-start">
                    <div className="inline-block px-4 py-2 bg-white/30 backdrop-blur-[1px]">
                        <p className="text-[var(--foreground)]/60 text-xs uppercase tracking-[0.25em] font-medium">
                            Drop 01 · 5 Piezas · Edición Limitada
                        </p>
                    </div>

                </div>
            </div>

            {/* Grid: Responsive & Contained Spacing */}
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 pb-32">
                {products.map((product) => {
                    let imageSrc: string | null = null;
                    if (product.colorVariants) {
                        const colorVariants = (product.colorVariants as any[]) || [];
                        const firstColor = colorVariants[0];
                        if (firstColor && firstColor.mockups && firstColor.mockups.length > 0) {
                            const activeMockup = firstColor.mockups.find((m: any) => m.enabled) || firstColor.mockups[0];
                            if (activeMockup) imageSrc = activeMockup.url;
                        }
                    }
                    if (!imageSrc && product.images) {
                        const images = (product.images as any[]) || [];
                        if (images.length > 0) {
                            const firstImg = images[0];
                            if (typeof firstImg === 'string') {
                                imageSrc = firstImg;
                            } else {
                                const activeImg = images.find((img: any) => img.enabled) || firstImg;
                                imageSrc = activeImg ? activeImg.src : null;
                            }
                        }
                    }

                    return (
                        <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group block"
                        >
                            {/* Image / Placeholder: Dark Surface for Contrast */}
                            <div className="relative aspect-[3/4] overflow-hidden bg-[var(--surface)] mb-5 shadow-sm">
                                <div className="w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-out relative">
                                    {/* Minimal Placeholder */}
                                    <div className="absolute inset-0 flex items-end p-6">
                                        <span className="text-white/8 text-[9px] tracking-[0.3em] uppercase font-light">
                                            AlphaAddiction
                                        </span>
                                    </div>
                                    {/* Use actual images when available, for now overlay text to simulate product */}
                                    <div className="absolute inset-0 flex items-center justify-center text-white/5 text-4xl font-serif">
                                        {product.name.split(' ')[0].toUpperCase()}
                                    </div>
                                </div>

                            {/* Status Badge: Discrete */}
                            {product.status === 'sold_out' && (
                                <div className="absolute top-4 right-4 bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/10 text-white/90 text-[9px] px-2 py-1 uppercase tracking-widest">
                                    Agotado
                                </div>
                            )}
                        </div>

                        {/* Info: Text adapted for light theme */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">
                                    {product.name}
                                </h3>
                                <p className="text-xs text-[var(--foreground)]/50 tracking-wide font-light">
                                    {formatPrice(product.priceEUR)}
                                </p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-[var(--foreground)]/30 group-hover:text-[var(--primary)] transition-colors duration-300 transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                    </Link>
                )})}
            </div>
        </div>
    );
}
