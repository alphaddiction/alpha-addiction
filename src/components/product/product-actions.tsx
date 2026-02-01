'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { type Product } from '@/lib/products';

const USE_CONFIRMATION_PAGE = true;

export default function ProductActions({ product }: { product: Product }) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBuy = () => {
        router.push(`/checkout?product=${product.slug}`);
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
            <button
                onClick={handleBuy}
                className="
          w-full py-4
          bg-[var(--primary)]
          text-black
          uppercase tracking-widest text-sm font-medium
          flex items-center justify-center gap-3
          transition-all
          hover:bg-transparent
          hover:text-[var(--foreground)]
          hover:border hover:border-[var(--primary)]
        "
            >
                <span>Comprar</span>
                <ArrowRight className="w-4 h-4" />
            </button>
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
