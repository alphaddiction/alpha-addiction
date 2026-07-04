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
    const [systemMode, setSystemMode] = useState<string>('development');
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

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
    const [isCreatingDraft, setIsCreatingDraft] = useState(false);

    // Estados para consentimiento RGPD/LSSI
    const [consentMarketing, setConsentMarketing] = useState(false);
    const [consentNewsletter, setConsentNewsletter] = useState(false);

    // Estados para los cupones de descuento
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<any | null>(null);
    const [discountError, setDiscountError] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setIsApplying(true);
        setDiscountError(null);
        try {
            const res = await fetch('/api/discounts/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: discountCode,
                    email: formData.email,
                    items: items.map(item => ({
                        slug: item.slug,
                        quantity: item.qty,
                        price: item.priceEUR
                    }))
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fallo al validar código.');
            setAppliedDiscount(data);
        } catch (err: any) {
            setDiscountError(err.message);
            setAppliedDiscount(null);
        } finally {
            setIsApplying(false);
        }
    };

    const handleCreateDraftOrder = async () => {
        const isValid = validateForm();
        if (!isValid) return;

        setIsCreatingDraft(true);
        setPaymentError(null);

        try {
            const res = await fetch('/api/orders/create-draft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shippingAddress: formData,
                    items: items,
                    discountCode: appliedDiscount ? appliedDiscount.code : undefined,
                    isTestOrder: true,
                    consentMarketing,
                    consentNewsletter,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Fallo al crear el borrador del pedido.');
            }

            const data = await res.json();
            clearCart();
            router.push(`/checkout/success?orderId=${data.orderId}`);
        } catch (err) {
            console.error('❌ Error creating draft order:', err);
            setPaymentError(err instanceof Error ? err.message : 'Error al procesar el pedido de prueba.');
        } finally {
            setIsCreatingDraft(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        async function fetchConfig() {
            try {
                const res = await fetch('/api/paypal/config');
                if (res.ok) {
                    const data = await res.json();
                    setSystemMode(data.systemMode || 'development');
                    setIsAdmin(!!data.isAdmin);
                }
            } catch (err) {
                console.error('Error fetching config on checkout:', err);
            } finally {
                setIsLoadingConfig(false);
            }
        }
        fetchConfig();
    }, []);

    // Evitar hidratación mismatch
    if (!mounted || isLoadingConfig) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest text-[var(--foreground)]/50">Cargando pasarela de pago...</span>
            </div>
        );
    }

    if (systemMode === 'production_verification' && !isAdmin) {
        return (
            <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-6 py-12 max-w-xl mx-auto animate-in fade-in duration-500 font-mono">
                <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center rounded-full mb-6">
                    <span className="text-2xl font-bold">🧪</span>
                </div>
                <h1 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-widest mb-4">
                    Tienda en Verificación Técnica
                </h1>
                <p className="text-xs text-[var(--muted)] leading-relaxed mb-8">
                    La pasarela de pagos se encuentra temporalmente cerrada al público general por tareas de verificación y auditoría técnica de los administradores.
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 border border-white/10 hover:border-white/20 bg-white/5 text-[10px] uppercase tracking-widest font-bold transition-all text-[#f5f5f0]"
                >
                    Volver al Inicio
                </Link>
            </div>
        );
    }

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
                                    <div className="w-16 h-20 bg-[var(--surface)] flex-shrink-0 relative overflow-hidden border border-white/5">
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
                                        <span className="absolute -top-2 -right-2 bg-[var(--foreground)] text-[var(--background)] text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none z-10 font-bold">
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

                        {/* Campo de Código de Descuento */}
                        <div className="mb-6 space-y-2">
                            <label className="text-[10px] tracking-widest uppercase text-[var(--foreground)]/70 block">
                                Código de descuento
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Introduce tu código"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    disabled={isApplying}
                                    className="flex-1 bg-transparent border border-[var(--border)] p-2 text-xs uppercase focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--foreground)]/20 text-[var(--foreground)]"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyDiscount}
                                    disabled={isApplying || !discountCode.trim()}
                                    className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--primary)] hover:text-white text-xs font-semibold uppercase tracking-widest transition-colors duration-300 disabled:opacity-50"
                                >
                                    {isApplying ? '...' : 'Aplicar'}
                                </button>
                            </div>
                            {discountError && (
                                <p className="text-[10px] text-red-500 font-mono mt-1">{discountError}</p>
                            )}
                            {appliedDiscount && (
                                <p className="text-[10px] text-green-600 font-mono mt-1">
                                    ¡Cupón {appliedDiscount.code} aplicado con éxito!
                                </p>
                            )}
                        </div>

                        <div className="h-px bg-[var(--border)] mb-6" />

                        <div className="flex justify-between text-sm mb-3 text-[var(--foreground)]/70">
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>

                        {appliedDiscount && (
                            <div className="flex justify-between text-sm mb-3 text-green-600 font-medium">
                                <span>Descuento ({appliedDiscount.code})</span>
                                <span>-{formatPrice(appliedDiscount.discountAmount)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm mb-6 text-[var(--foreground)]/70">
                            <span>Envío</span>
                            <span>Gratis</span>
                        </div>

                        <div className="flex justify-between text-lg font-serif text-[var(--foreground)]">
                            <span>Total</span>
                            <span>{formatPrice(Math.max(0, subtotal - (appliedDiscount ? appliedDiscount.discountAmount : 0)))}</span>
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

                            {/* Consentimientos RGPD / LSSI */}
                            <div className="space-y-4 pt-6 border-t border-[var(--border)]/30">
                                <label className="flex items-start gap-3 cursor-pointer text-xs text-[var(--foreground)]/80 leading-relaxed select-none">
                                    <input
                                        type="checkbox"
                                        checked={consentMarketing}
                                        onChange={(e) => setConsentMarketing(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 border border-[var(--border)] bg-transparent text-[var(--primary)] focus:ring-0 focus:ring-offset-0 rounded-none accent-[var(--primary)]"
                                    />
                                    <span>Quiero recibir novedades, lanzamientos exclusivos, promociones y descuentos de Alpha Addiction.</span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer text-xs text-[var(--foreground)]/80 leading-relaxed select-none">
                                    <input
                                        type="checkbox"
                                        checked={consentNewsletter}
                                        onChange={(e) => setConsentNewsletter(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 border border-[var(--border)] bg-transparent text-[var(--primary)] focus:ring-0 focus:ring-offset-0 rounded-none accent-[var(--primary)]"
                                    />
                                    <span>Quiero recibir contenido exclusivo, inspiración, noticias y comunicaciones relacionadas con la marca Alpha Addiction.</span>
                                </label>

                                <p className="text-[10px] text-[var(--foreground)]/50 leading-relaxed mt-2 tracking-wide uppercase">
                                    Al marcar estas casillas aceptas que procesemos tus datos conforme a nuestra <a href="/legal/privacidad" target="_blank" className="text-[var(--primary)] hover:underline">Política de Privacidad</a>.
                                </p>
                            </div>

                            <PayPalButton
                                shippingAddress={formData}
                                items={items}
                                discountCode={appliedDiscount ? appliedDiscount.code : undefined}
                                onValidate={validateForm}
                                consentMarketing={consentMarketing}
                                consentNewsletter={consentNewsletter}
                                onSuccess={(localOrderId) => {
                                    clearCart();
                                    router.push(`/checkout/success?orderId=${localOrderId}`);
                                }}
                                onError={(msg) => {
                                    setPaymentError(msg);
                                }}
                            />

                            {process.env.NEXT_PUBLIC_ENABLE_TEST_PURCHASES === 'true' && process.env.NODE_ENV !== 'production' && (
                                <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border)]/30 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleCreateDraftOrder}
                                        disabled={isCreatingDraft}
                                        className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 text-xs font-semibold uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreatingDraft ? 'Creando Pedido...' : 'Confirmar y Crear Pedido de Prueba (OMS)'}
                                    </button>
                                </div>
                            )}

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
