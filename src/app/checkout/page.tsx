'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PayPalButton from '@/components/paypal/paypal-button';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal, clearCart } = useCart();
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        province: '',
        country: 'España',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [paymentError, setPaymentError] = useState<string | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clean error when typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validaciones requeridas
        if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
        if (!formData.lastName.trim()) newErrors.lastName = 'Los apellidos son obligatorios';
        if (!formData.email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'El formato del email no es válido';
        }
        if (!formData.address.trim()) newErrors.address = 'La dirección es obligatoria';
        if (!formData.city.trim()) newErrors.city = 'La ciudad es obligatoria';
        if (!formData.postalCode.trim()) newErrors.postalCode = 'El código postal es obligatorio';
        if (!formData.province.trim()) newErrors.province = 'La provincia es obligatoria';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to the first error field
            const firstErrorKey = Object.keys(newErrors)[0];
            const errorElement = document.getElementById(firstErrorKey);
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        return true;
    };

    return (
        <div className="min-h-screen pt-32 px-6 max-w-6xl mx-auto pb-24">
            {/* Back */}
            <Link
                href="/cart"
                className="flex items-center text-xs tracking-widest text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-10 transition-colors w-fit"
            >
                <ArrowLeft className="w-3 h-3 mr-2" />
                VOLVER A LA CESTA
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">

                {/* Columna Izquierda: Resumen del pedido */}
                <div className="lg:col-span-5 order-2 lg:order-1">
                    <div className="bg-white/40 backdrop-blur-[2px] p-8 md:p-10 border border-[var(--border)]/50 lg:sticky lg:top-32">
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

                        <div className="flex justify-between text-lg font-serif text-[var(--foreground)]">
                            <span>Total</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario completo */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-12 animate-in fade-in">

                        {/* Datos Personales */}
                        <section>
                            <h2 className="text-xl font-serif mb-6 text-[var(--foreground)] pb-2 border-b border-[var(--border)]/50">
                                Contacto
                            </h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                            Nombre *
                                        </label>
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                            placeholder="John"
                                        />
                                        {errors.firstName && <p className="text-xs text-red-500/80 mt-1">{errors.firstName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                            Apellidos *
                                        </label>
                                        <input
                                            id="lastName"
                                            name="lastName"
                                            type="text"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                            placeholder="Doe"
                                        />
                                        {errors.lastName && <p className="text-xs text-red-500/80 mt-1">{errors.lastName}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                            Email *
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                            placeholder="john@example.com"
                                        />
                                        {errors.email && <p className="text-xs text-red-500/80 mt-1">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                            Teléfono <span className="text-[var(--foreground)]/40 lowercase normal-case tracking-normal">(Opcional)</span>
                                        </label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                            placeholder="+34 600 000 000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Dirección de Envío */}
                        <section>
                            <h2 className="text-xl font-serif mb-6 text-[var(--foreground)] pb-2 border-b border-[var(--border)]/50">
                                Dirección de envío
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="country" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                        País *
                                    </label>
                                    <select
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)] appearance-none rounded-none"
                                    >
                                        <option value="España">España</option>
                                        <option value="Portugal">Portugal</option>
                                        <option value="Francia">Francia</option>
                                        <option value="Italia">Italia</option>
                                        <option value="Alemania">Alemania</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="address" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                        Dirección exacta *
                                    </label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                        placeholder="Calle, número, piso, puerta..."
                                    />
                                    {errors.address && <p className="text-xs text-red-500/80 mt-1">{errors.address}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 md:col-span-1">
                                        <label htmlFor="postalCode" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                            CP *
                                        </label>
                                        <input
                                            id="postalCode"
                                            name="postalCode"
                                            type="text"
                                            value={formData.postalCode}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                            placeholder="28001"
                                        />
                                        {errors.postalCode && <p className="text-xs text-red-500/80 mt-1">{errors.postalCode}</p>}
                                    </div>
                                    <div className="space-y-2 md:col-span-1">
                                        <label htmlFor="city" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                            Ciudad *
                                        </label>
                                        <input
                                            id="city"
                                            name="city"
                                            type="text"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                            placeholder="Madrid"
                                        />
                                        {errors.city && <p className="text-xs text-red-500/80 mt-1">{errors.city}</p>}
                                    </div>
                                    <div className="space-y-2 md:col-span-1">
                                        <label htmlFor="province" className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70">
                                            Provincia *
                                        </label>
                                        <input
                                            id="province"
                                            name="province"
                                            type="text"
                                            value={formData.province}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                            placeholder="Madrid"
                                        />
                                        {errors.province && <p className="text-xs text-red-500/80 mt-1">{errors.province}</p>}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Pagar ahora Action */}
                        <div className="pt-8 space-y-6">
                            {paymentError && (
                                <div className="text-center text-xs tracking-widest text-red-500 uppercase py-3 px-4 border border-red-500/20 bg-red-500/5">
                                    {paymentError}
                                </div>
                            )}

                            <PayPalButton
                                shippingAddress={formData}
                                items={items}
                                onValidate={validateForm}
                                onSuccess={(localOrderId) => {
                                    clearCart();
                                    router.push(`/checkout/success?orderId=${localOrderId}`);
                                }}
                                onError={(msg) => {
                                    setPaymentError(msg);
                                }}
                            />

                            <p className="text-[10px] text-center text-[var(--foreground)]/40 mt-5 tracking-widest">
                                PAGO SEGURO CON PAYPAL · TRANSACCIÓN PROTEGIDA POR SSL
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
