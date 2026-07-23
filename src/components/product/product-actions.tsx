'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import { type Product } from '@/shared/models/products';
import { useCart } from '@/context/cart-context';

const USE_CONFIRMATION_PAGE = true;

export default function ProductActions({ product }: { product: Product }) {
    const router = useRouter();
    const { addItem } = useCart();

    const [selectedSize, setSelectedSize] = useState<string>('');
    const [sizeError, setSizeError] = useState<boolean>(false);
    const [added, setAdded] = useState<boolean>(false);

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddToCart = () => {
        if (product.sizes.length > 0 && !selectedSize) {
            setSizeError(true);
            return;
        }
        setSizeError(false);
        addItem(product, product.sizes.length > 0 ? selectedSize : 'One Size');

        // Show elegant confirmation
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleBuyNow = () => {
        if (product.sizes.length > 0 && !selectedSize) {
            setSizeError(true);
            return;
        }
        setSizeError(false);
        addItem(product, product.sizes.length > 0 ? selectedSize : 'One Size');
        router.push('/checkout');
    };

    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, productSlug: product.slug }),
            });

            if (!res.ok) throw new Error();

            if (USE_CONFIRMATION_PAGE) {
                router.push(`/waitlist/gracias?product=${product.slug}`);
            } else {
                router.push('/genesis?waitlist=ok');
            }
        } catch {
            setError('Introduce un email válido.');
        } finally {
            setIsLoading(false);
        }
    };

    /* ===== DISPONIBLE ===== */
    if (product.status === 'in_stock') {
        return (
            <div className="space-y-8">
                {product.sizes.length > 0 && (
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] text-[var(--muted)] tracking-widest uppercase font-medium">TALLA</span>
                            {sizeError && (
                                <span className="text-[10px] text-red-500 tracking-widest uppercase transition-opacity">Selecciona una talla</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {product.sizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => {
                                        setSelectedSize(size);
                                        setSizeError(false);
                                    }}
                                    className={`
                                        border px-4 py-1.5 text-xs transition-colors
                                        ${selectedSize === size
                                            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                                            : 'border-[var(--border)] text-[var(--foreground)]/70 hover:border-[var(--primary)]'}
                                    `}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleAddToCart}
                        className={`
                            w-full py-4 text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-3 transition-all
                            ${added
                                ? 'bg-transparent border border-green-600 text-green-700 dark:text-green-500'
                                : 'bg-transparent border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]'
                            }
                        `}
                    >
                        {added ? (
                            <>
                                <span>Añadido a la cesta</span>
                                <Check className="w-4 h-4" />
                            </>
                        ) : (
                            <span>Añadir a la cesta</span>
                        )}
                    </button>

                    <button
                        onClick={handleBuyNow}
                        className="
                            w-full py-4 bg-[var(--primary)] text-black uppercase tracking-widest text-sm font-medium
                            flex items-center justify-center gap-3 transition-all
                            hover:bg-transparent hover:text-[var(--foreground)] hover:border hover:border-[var(--primary)]
                        "
                    >
                        <span>Comprar ahora</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    /* ===== AGOTADO ===== */
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3">

            <div className="text-xs tracking-widest text-[var(--foreground)]/50 uppercase">
                Agotado · Drop cerrado
            </div>

            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <input
                    type="email"
                    required
                    placeholder="Déjanos tu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="
            w-full px-4 py-3
            bg-transparent
            border border-[var(--border)]
            text-sm text-[var(--foreground)]
            placeholder:text-[var(--foreground)]/30
            focus:outline-none
            focus:border-[var(--primary)]
            transition-colors
          "
                />

                {error && (
                    <p className="text-xs text-[var(--foreground)]/60">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="
            w-full py-3
            border border-[var(--foreground)]
            text-[var(--foreground)]
            uppercase tracking-widest text-xs font-medium
            transition-colors
            hover:bg-[var(--foreground)]
            hover:text-[var(--background)]
            disabled:opacity-50
          "
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                        'Avísame del próximo drop'
                    )}
                </button>
            </form>
        </div>
    );
}
