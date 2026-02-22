'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
    const { items, subtotal } = useCart();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Evitar hidratación mismatch
    if (!mounted) return null;

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 animate-in fade-in">
                <h1 className="text-2xl font-serif mb-4 text-[var(--foreground)]">
                    Tu carrito está vacío
                </h1>
                <Link
                    href="/genesis"
                    className="text-[var(--primary)] underline underline-offset-4 tracking-widest text-sm uppercase"
                >
                    Volver a la colección
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 px-6 max-w-5xl mx-auto pb-24">

            {/* Back */}
            <Link
                href="/cart"
                className="flex items-center text-xs tracking-widest text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-10 transition-colors"
            >
                <ArrowLeft className="w-3 h-3 mr-2" />
                VOLVER A LA CESTA
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                {/* Checkout Form - Placeholder (Left side) */}
                <div className="lg:col-span-7">
                    <h2 className="text-2xl font-serif mb-8 text-[var(--foreground)]">
                        Detalles de envío
                    </h2>
                    <div className="space-y-6 opacity-60 pointer-events-none">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs tracking-widest uppercase text-[var(--foreground)]/70">Nombre</label>
                                <input disabled className="w-full bg-transparent border border-[var(--border)] p-3" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs tracking-widest uppercase text-[var(--foreground)]/70">Apellidos</label>
                                <input disabled className="w-full bg-transparent border border-[var(--border)] p-3" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs tracking-widest uppercase text-[var(--foreground)]/70">Dirección</label>
                            <input disabled className="w-full bg-transparent border border-[var(--border)] p-3" />
                        </div>
                    </div>
                </div>

                {/* Summary (Right side) */}
                <div className="lg:col-span-5">
                    <div className="bg-white/40 backdrop-blur-[2px] p-8 md:p-10 border border-[var(--border)]/50 sticky top-32">
                        <h2 className="text-xl font-serif mb-8 text-[var(--foreground)]">
                            Resumen del pedido
                        </h2>

                        <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.cartItemId} className="flex gap-4">
                                    <div className="w-16 h-20 bg-[var(--surface)] flex-shrink-0 relative">
                                        <span className="absolute -top-2 -right-2 bg-[var(--foreground)] text-[var(--background)] text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none z-10">
                                            {item.qty}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className="text-sm font-medium text-[var(--foreground)]">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-[var(--foreground)]/50 mt-1">
                                            Talla: {item.size}
                                        </p>
                                    </div>
                                    <div className="text-sm text-[var(--foreground)] flex items-center">
                                        {formatPrice(item.priceEUR * item.qty)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-[var(--border)] mb-6" />

                        <div className="flex justify-between text-sm mb-3 text-[var(--foreground)]/70">
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>

                        <div className="flex justify-between text-sm mb-6 text-[var(--foreground)]/70">
                            <span>Envío</span>
                            <span>Gratis</span>
                        </div>

                        <div className="flex justify-between text-lg font-serif text-[var(--foreground)] mb-10">
                            <span>Total</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>

                        {/* Action */}
                        <div className="flex flex-col justify-center">
                            <div className="mb-6 text-center">
                                <p className="text-[10px] tracking-widest text-[var(--foreground)]/50 mb-3 uppercase">
                                    PAGO SEGURO CON STRIPE
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    console.log('TODO: Redirigir a pasarela de pago Stripe');
                                }}
                                className="
                                    w-full py-4 bg-[var(--foreground)] text-[var(--background)]
                                    uppercase tracking-widest text-sm font-medium transition-colors hover:bg-[var(--primary)]
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
            </div>
        </div>
    );
}
