import { notFound } from 'next/navigation';
import Link from 'next/link';
import { products } from '@/lib/products';
import { formatPrice } from '@/lib/utils';
import ProductActions from '@/components/product/product-actions';
import { ArrowLeft } from 'lucide-react';

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = products.find((p) => p.slug === slug);

    if (!product) notFound();

    return (
        <div className="min-h-screen pt-32 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-24 mb-24">

            {/* Back Link */}
            <Link href="/genesis" className="absolute top-24 left-6 md:left-auto md:ml-0 flex items-center text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors tracking-widest">
                <ArrowLeft className="w-3 h-3 mr-2" />
                VOLVER
            </Link>

            {/* Image Gallery (Left) */}
            <div className="w-full md:w-1/2 mt-8 md:mt-0">
                <div className="aspect-[3/4] bg-[var(--surface)] w-full relative overflow-hidden shadow-sm">
                    {/* Placeholder for Image */}
                    <div className="absolute inset-0 flex items-end p-8">
                        <span className="text-white/20 text-xs tracking-[0.2em] uppercase">
                            AlphaAddiction
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Additional mock thumbnails - using Surface color */}
                    <div className="aspect-square bg-[var(--surface)] opacity-80" />
                    <div className="aspect-square bg-[var(--surface)] opacity-60" />
                </div>
            </div>

            {/* Product Info (Right) */}
            <div className="w-full md:w-1/2 flex flex-col max-w-md">
                <h1 className="text-4xl md:text-5xl font-serif mb-2 leading-tight text-[var(--foreground)]">{product.name}</h1>
                <p className="text-xl text-[var(--muted)] mb-8 font-light tracking-wide">{formatPrice(product.priceEUR)}</p>

                <div className="h-px w-full bg-[var(--border)] mb-8 opacity-50" />

                <p className="text-[var(--foreground)]/80 leading-relaxed mb-8 font-light text-sm md:text-base">
                    {product.descriptionShort}
                </p>

                {/* Variations (Mocked for display) */}
                {product.colors.length > 0 && (
                    <div className="mb-6">
                        <span className="text-[10px] text-[var(--muted)] tracking-widest uppercase block mb-2 font-medium">COLOR</span>
                        <div className="flex gap-2 text-sm text-[var(--foreground)]">
                            {product.colors.join(' / ')}
                        </div>
                    </div>
                )}


                {/* Dynamic Actions */}
                <ProductActions product={product} />

                {/* Additional Info */}
                <div className="mt-12 space-y-3 text-[10px] tracking-widest text-[var(--muted)] uppercase opacity-70">
                    <p>AUTENTICIDAD GARANTIZADA</p>
                    <p>PRODUCCIÓN LIMITADA</p>
                    <p>ENVÍO DESDE GENESIS HQ</p>
                </div>
            </div>
        </div>
    );
}
