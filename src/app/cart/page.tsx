'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
    const { items, subtotal, removeItem, updateQty } = useCart();

    const shipping = subtotal > 0 ? 0 : 0; // Gratis
    const total = subtotal + shipping;

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 animate-in fade-in">
                <h1 className="text-2xl font-serif mb-4 text-[var(--foreground)]">Tu cesta está vacía</h1>
                <p className="text-sm text-[var(--foreground)]/50 mb-8 max-w-sm">
                    Aún no has añadido ningún artículo de la colección a tu cesta.
                </p>
                <Link
                    href="/genesis"
                    className="
                        px-8 py-3 bg-[var(--foreground)] text-[var(--background)] 
                        uppercase tracking-widest text-xs font-medium hover:bg-[var(--primary)] transition-colors
                    "
                >
                    Descubrir Genesis
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 px-6 max-w-5xl mx-auto pb-24 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <Link
                        href="/genesis"
                        className="flex items-center text-xs tracking-widest text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3 mr-2" />
                        VOLVER A LA COLECCIÓN
                    </Link>
                    <h1 className="text-4xl font-serif text-[var(--foreground)]">Tu Cesta</h1>
                </div>
                <div className="text-sm tracking-widest text-[var(--foreground)]/50 uppercase">
                    {items.length} {items.length === 1 ? 'Artículo' : 'Artículos'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-[var(--border)] text-[10px] tracking-widest uppercase text-[var(--foreground)]/50 font-medium">
                        <div className="col-span-6">Producto</div>
                        <div className="col-span-3 text-center">Cantidad</div>
                        <div className="col-span-3 text-right">Total</div>
                    </div>

                    {items.map((item) => (
                        <div key={item.cartItemId} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-[var(--border)] items-center">
                            {/* Product Info */}
                            <div className="col-span-1 md:col-span-6 flex gap-4">
                                <div className="w-20 h-24 bg-[var(--surface)] flex-shrink-0 overflow-hidden relative border border-white/5">
                                    {item.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/5" />
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <Link href={`/product/${item.slug}`} className="text-base font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                                        {item.name}
                                    </Link>
                                    <div className="text-xs text-[var(--foreground)]/60 mt-2 space-y-1">
                                        <p>Talla: <span className="text-[var(--foreground)]">{item.size}</span></p>
                                        <p>{formatPrice(item.priceEUR)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity & Remove (Mobile format differs slightly ideally, but simple here) */}
                            <div className="col-span-1 md:col-span-3 flex items-center justify-between md:justify-center mt-4 md:mt-0">
                                <span className="md:hidden text-xs text-[var(--foreground)]/50 uppercase tracking-widest">Cantidad</span>
                                <div className="flex items-center border border-[var(--border)]">
                                    <button
                                        onClick={() => updateQty(item.cartItemId, item.qty - 1)}
                                        className="p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-8 text-center text-sm">{item.qty}</span>
                                    <button
                                        onClick={() => updateQty(item.cartItemId, item.qty + 1)}
                                        className="p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Price & Remove */}
                            <div className="col-span-1 md:col-span-3 flex items-center justify-between md:justify-end mt-4 md:mt-0">
                                <span className="md:hidden text-xs text-[var(--foreground)]/50 uppercase tracking-widest">Total</span>
                                <div className="flex items-center gap-6">
                                    <span className="text-sm font-medium">{formatPrice(item.priceEUR * item.qty)}</span>
                                    <button
                                        onClick={() => removeItem(item.cartItemId)}
                                        className="text-[var(--foreground)]/40 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-[var(--surface)]/50 p-8 border border-[var(--border)]/50">
                        <h2 className="text-lg font-serif mb-6 text-[var(--foreground)]">Resumen</h2>

                        <div className="space-y-4 text-sm mb-6">
                            <div className="flex justify-between text-[var(--foreground)]/70">
                                <span>Subtotal</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[var(--foreground)]/70">
                                <span>Envío</span>
                                <span>Gratis</span>
                            </div>
                        </div>

                        <div className="h-px bg-[var(--border)] mb-6" />

                        <div className="flex justify-between text-lg font-serif text-[var(--foreground)] mb-8">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>

                        <Link
                            href="/checkout"
                            className="
                                flex items-center justify-center w-full py-4
                                bg-[var(--foreground)] text-[var(--background)]
                                uppercase tracking-widest text-sm font-medium
                                transition-colors hover:bg-[var(--primary)]
                            "
                        >
                            Finalizar compra
                        </Link>

                        <p className="text-[10px] text-center text-[var(--foreground)]/40 mt-4 tracking-widest uppercase">
                            Impuestos incluidos. Pago seguro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
