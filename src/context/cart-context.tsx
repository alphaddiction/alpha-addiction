'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/lib/products';

export interface CartItem {
    cartItemId: string; // combination of slug, color and size, e.g. "product-slug-navy-M"
    slug: string;
    name: string;
    priceEUR: number;
    size: string;
    color?: string;
    printfulVariantId?: number;
    qty: number;
    image?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, size: string, color?: string, printfulVariantId?: number, qty?: number) => void;
    removeItem: (cartItemId: string) => void;
    updateQty: (cartItemId: string, qty: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Re-hydrate from LocalStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('alpha_addiction_cart');
        if (savedCart) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart from local storage', e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('alpha_addiction_cart', JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addItem = (product: Product, size: string, color?: string, printfulVariantId?: number, qty = 1) => {
        setItems((prevItems) => {
            const colorPart = color ? color.toLowerCase().replace(/\s+/g, '-') : 'default';
            const cartItemId = `${product.slug}-${colorPart}-${size}`;
            const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);

            if (existingItem) {
                return prevItems.map((item) =>
                    item.cartItemId === cartItemId ? { ...item, qty: item.qty + qty } : item
                );
            }

            let image = '';
            if (color && product.colorVariants) {
                const variant = product.colorVariants.find(
                    (v) => v.name.toLowerCase() === color.toLowerCase()
                );
                if (variant && variant.mockups && variant.mockups.length > 0) {
                    image = variant.mockups[0].url;
                }
            }
            if (!image && product.images && product.images.length > 0) {
                const firstImg = product.images[0];
                image = typeof firstImg === 'string' ? firstImg : firstImg.src;
            }

            return [
                ...prevItems,
                {
                    cartItemId,
                    slug: product.slug,
                    name: product.name,
                    priceEUR: product.priceEUR,
                    size,
                    color,
                    printfulVariantId,
                    qty,
                    image
                },
            ];
        });
    };

    const removeItem = (cartItemId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
    };

    const updateQty = (cartItemId: string, qty: number) => {
        if (qty <= 0) {
            removeItem(cartItemId);
            return;
        }
        setItems((prevItems) =>
            prevItems.map((item) => (item.cartItemId === cartItemId ? { ...item, qty } : item))
        );
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.priceEUR * item.qty, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
