'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/cart-context';

export default function CartIcon() {
    const { totalItems } = useCart();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch by only rendering the icon after mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Link href="/cart" className="group relative flex items-center">
            <ShoppingBag className="w-5 h-5 text-[#f5f5f0] group-hover:text-[#d4af37] transition-colors" />
            {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-2 bg-[var(--foreground)] text-[var(--background)] text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none">
                    {totalItems}
                </span>
            )}
        </Link>
    );
}
