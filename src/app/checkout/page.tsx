import Link from 'next/link';
import { products } from '@/lib/products';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Lock } from 'lucide-react';

export default async function CheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ product?: string }>;
}) {
    const params = await searchParams;
    const productSlug = params.product;
    const product = products.find((p) => p.slug === productSlug);

    if (!product) {
        return (
            <div className="min-h-screen pt-32 px-6 flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl mb-4 text-[var(--foreground)]">
                    Tu carrito está vacío
                </h1>
                <Link
                    href="/genesis"
                    className="text-[var(--primary)] underline underline-offset-4"
                >
                    Volver a la colección
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 px-6 max-w-4xl mx-auto pb-24">

            {/* Back */}
            <Link
                href={`/product/${product.slug}`}
                className="flex items-center text-xs tracking-widest text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-10"
            >
                <ArrowLeft className="w-3 h-3 mr-2" />
                VOLVER
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 bg-white/40 backdrop-blur-[2px] p-8 md:p-12">

                {/* Summary */}
                <div>
                    <h2 className="text-xl font-serif mb-8 text-[var(--foreground)]">
                        Resumen del pedido
                    </h2>

                    <div className="flex gap-4 mb-6">
                        <div className="w-20 h-24 bg-[var(--surface)] flex-shrink-0" />
                        <div>
                            <h3 className="text-sm text-[var(--foreground)]">
                                {product.name}
                            </h3>
                            <p className="text-xs text-[var(--foreground)]/50 mt-1">
                                Cantidad · 1
                            </p>
                        </div>
                        <div className="ml-auto text-sm text-[var(--foreground)]">
                            {formatPrice(product.priceEUR)}
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border)] my-6" />

                    <div className="flex justify-between text-sm mb-2 text-[var(--foreground)]/70">
                        <span>Subtotal</span>
                        <span>{formatPrice(product.priceEUR)}</span>
                    </div>

                    <div className="flex justify-between text-sm mb-4 text-[var(--foreground)]/70">
                        <span>Envío</span>
                        <span>Gratis</span>
                    </div>

                    <div className="flex justify-between text-lg font-serif text-[var(--foreground)]">
                        <span>Total</span>
                        <span>{formatPrice(product.priceEUR)}</span>
                    </div>
                </div>

                {/* Action */}
                <div className="flex flex-col justify-center">

                    <div className="mb-10 text-center">
                        <p className="text-xs tracking-widest text-[var(--foreground)]/50 mb-3">
                            PAGO SEGURO CON STRIPE
                        </p>
                        <div className="flex justify-center gap-2 text-[var(--foreground)]/20">
                            <div className="w-8 h-5 bg-black/10 rounded" />
                            <div className="w-8 h-5 bg-black/10 rounded" />
                            <div className="w-8 h-5 bg-black/10 rounded" />
                        </div>
                    </div>

                    <button
                        className="
              w-full py-4
              bg-[var(--foreground)]
              text-[var(--background)]
              uppercase tracking-widest text-sm font-medium
              transition-colors
              hover:bg-[var(--primary)]
            "
                    >
                        <span className="flex items-center justify-center gap-3">
                            <Lock className="w-4 h-4" />
                            Pagar ahora
                        </span>
                    </button>

                    <p className="text-[10px] text-center text-[var(--foreground)]/40 mt-4 tracking-widest">
                        Transacción protegida · SSL
                    </p>
                </div>
            </div>
        </div>
    );
}
