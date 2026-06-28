import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Registro Confirmado | Alpha Addiction',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WaitlistSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ product?: string }>;
}) {
    // Await searchParams before accessing properties
    const params = await searchParams; // Wait for the promise to resolve
    const productSlug = params.product;

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-24">
            <h1 className="text-3xl md:text-4xl font-serif mb-6 text-[#d4af37]">
                Gracias.
            </h1>

            <p className="text-white/60 max-w-md mb-8 font-light text-sm md:text-base leading-relaxed">
                {productSlug
                    ? 'Te avisaremos en cuanto esta prenda vuelva a estar disponible.'
                    : 'Te avisaremos cuando vuelva a haber stock.'}
            </p>

            <Link
                href="/genesis"
                className="text-xs uppercase tracking-widest text-white hover:text-[#d4af37] transition-colors border-b border-white/20 pb-1"
            >
                Volver a Genesis
            </Link>
        </div>
    );
}
