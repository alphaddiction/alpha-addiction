'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/lib/products';

export interface CartItem {
    cartItemId: string; // combination of slug and size, e.g. "product-slug-M"
    slug: string;
    name: string;
    priceEUR: number;
    size: string;
    qty: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, size: string, qty?: number) => void;
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

    const addItem = (product: Product, size: string, qty = 1) => {
        setItems((prevItems) => {
            const cartItemId = `${product.slug}-${size}`;
            const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);

            if (existingItem) {
                return prevItems.map((item) =>
                    item.cartItemId === cartItemId ? { ...item, qty: item.qty + qty } : item
                );
            }

            return [
                ...prevItems,
                {
                    cartItemId,
                    slug: product.slug,
                    name: product.name,
                    priceEUR: product.priceEUR,
                    size,
                    qty,
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
