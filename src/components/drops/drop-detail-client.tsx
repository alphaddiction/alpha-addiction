'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Mail, CheckCircle2, ArrowRight, ArrowUpRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface DropDetailClientProps {
  drop: {
    id: string;
    name: string;
    slug: string;
    description: string;
    mainImage: string;
    banner: string;
    videoUrl?: string | null;
    status: string;
    openingAt: string;
    closingAt: string;
    primaryColor: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    products: any[];
  };
}

export default function DropDetailClient({ drop }: DropDetailClientProps) {
  const router = useRouter();
  
  // Estados para la cuenta atrás
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isLiveTransition, setIsLiveTransition] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [failedProducts, setFailedProducts] = useState<Set<string>>(new Set());

  // Efecto de cuenta atrás para Coming Soon
  useEffect(() => {
    if (drop.status !== 'COMING_SOON') return;

    const openingDate = new Date(drop.openingAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = openingDate - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setIsLiveTransition(true);
        // Recargar la página para transicionar de estado a LIVE en el servidor
        setTimeout(() => {
          router.refresh();
        }, 1000);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [drop.openingAt, drop.status, router]);

  // Manejar suscripción a lista de espera
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setWaitlistStatus(null);

    try {
      const res = await fetch(`/api/drops/${drop.slug}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, consentMarketing }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al unirse.');

      setWaitlistStatus({ type: 'success', message: data.message });
      setEmail('');
      setName('');
    } catch (err: any) {
      setWaitlistStatus({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel =
    drop.status === 'LIVE' ? 'DROP ACTIVO' :
    drop.status === 'COMING_SOON' ? 'PRÓXIMAMENTE' :
    drop.status === 'SOLD_OUT' ? 'AGOTADO' :
    'DROP FINALIZADO';

  const statusBadgeColor =
    drop.status === 'LIVE' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
    drop.status === 'COMING_SOON' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 animate-pulse' :
    'border-red-500/20 bg-red-500/10 text-red-400';

  return (
    <div className="min-h-screen pb-20 text-[var(--foreground)] font-sans relative overflow-hidden">
      {/* Background radial glow based on drop color (very subtle) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-[0.03]"
        style={{ backgroundColor: drop.primaryColor }}
      />

      {/* Header Clásico (Adaptado de la página /genesis) */}
      <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto mb-8">
        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 tracking-tighter text-[var(--foreground)]">
          {drop.name === 'Genesis Drop 01' ? 'Genesis' : drop.name}
        </h1>
        <div className="flex flex-col gap-6 items-start">
          <div className="inline-block px-4 py-2 bg-white/30 backdrop-blur-[1px] border border-black/5 shadow-sm">
            <p className="text-[var(--foreground)]/60 text-xs uppercase tracking-[0.25em] font-medium">
              DROP 01 · {drop.products.length} PIEZAS · EDICIÓN LIMITADA
            </p>
          </div>
        </div>
      </div>

      {/* Vista de COMING SOON: Cuenta atrás + Lista de Espera (Estilo Claro y Translúcido) */}
      {drop.status === 'COMING_SOON' && (
        <div className="max-w-3xl mx-auto px-6 py-12 text-center space-y-8 relative">
          <div className="bg-white/40 backdrop-blur-md border border-black/5 p-8 md:p-12 space-y-6 shadow-sm">
            <div className="inline-flex p-3 bg-black/[0.02] border border-black/5 rounded-full text-[var(--primary)]">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            
            <h2 className="text-lg font-serif uppercase tracking-widest text-[var(--foreground)]">
              El lanzamiento abre en
            </h2>

            {/* Timer Grid */}
            {timeLeft ? (
              <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto font-mono text-[var(--foreground)]">
                <div className="bg-white/60 border border-black/5 p-3 rounded shadow-xs">
                  <span className="block text-2xl font-bold">{timeLeft.days}</span>
                  <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">días</span>
                </div>
                <div className="bg-white/60 border border-black/5 p-3 rounded shadow-xs">
                  <span className="block text-2xl font-bold">{timeLeft.hours}</span>
                  <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">horas</span>
                </div>
                <div className="bg-white/60 border border-black/5 p-3 rounded shadow-xs">
                  <span className="block text-2xl font-bold">{timeLeft.minutes}</span>
                  <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">min</span>
                </div>
                <div className="bg-white/60 border border-black/5 p-3 rounded shadow-xs">
                  <span className="block text-2xl font-bold">{timeLeft.seconds}</span>
                  <span className="text-[8px] text-[var(--muted)] uppercase tracking-wider">seg</span>
                </div>
              </div>
            ) : (
              <p className="text-sm font-mono text-emerald-600 font-bold">¡Abriendo drop activo ahora...!</p>
            )}

            {/* Lista de espera form */}
            <div className="max-w-md mx-auto pt-6 border-t border-black/5 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[var(--foreground)] font-semibold">
                Quiero que me aviséis
              </h3>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                Únete a la lista de espera oficial de este drop. Te notificaremos por correo electrónico minutos antes de la apertura pública.
              </p>

              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="waitlist-name"
                  aria-label="Tu nombre (opcional)"
                  placeholder="Tu nombre (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-white/50 border border-black/10 text-xs text-[var(--foreground)] px-4 py-3 outline-none focus:border-[var(--primary)] transition-colors placeholder-black/30"
                />
                <input
                  type="email"
                  id="waitlist-email"
                  required
                  aria-label="Tu correo electrónico"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/50 border border-black/10 text-xs text-[var(--foreground)] px-4 py-3 outline-none focus:border-[var(--primary)] transition-colors placeholder-black/30"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 sm:py-0 bg-[var(--primary)] hover:bg-black hover:text-white text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" /> Avisadme del lanzamiento
                </button>
              </form>

              <div className="text-left pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-[10px] text-[var(--foreground)]/70 leading-relaxed select-none">
                  <input
                    type="checkbox"
                    checked={consentMarketing}
                    onChange={(e) => setConsentMarketing(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 border border-black/15 bg-white/50 text-[var(--primary)] focus:ring-0 focus:ring-offset-0 rounded-none accent-[var(--primary)]"
                  />
                  <span>Quiero recibir información sobre futuros Drops y novedades de Alpha Addiction. Acepto la <a href="/legal/privacidad" target="_blank" className="underline text-black font-semibold">Política de Privacidad</a>.</span>
                </label>
              </div>

              {waitlistStatus && (
                <div className={`p-3 text-[10px] border font-mono text-left flex gap-1.5 items-start ${
                  waitlistStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{waitlistStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid de Productos (Visible si el drop es LIVE, SOLD_OUT o ENDED) */}
      {drop.status !== 'COMING_SOON' && (
        <div className="max-w-7xl mx-auto px-6">
          <div className="border-b border-black/5 pb-4 mb-12">
            <h2 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">
              Artículos Exclusivos del Drop
            </h2>
          </div>

          {drop.products.length === 0 ? (
            <div className="text-center py-16 border border-white/5 bg-[#111111]/40">
              <p className="text-xs text-[var(--muted)] tracking-wider">
                No hay productos asignados a este Drop en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {drop.products.map((product) => {
                let imageSrc = '';
                if (product.colorVariants && product.colorVariants.length > 0) {
                  const firstVariant = product.colorVariants[0];
                  if (firstVariant.mockups && firstVariant.mockups.length > 0) {
                    imageSrc = firstVariant.mockups[0].url;
                  }
                }
                if (!imageSrc && product.images && product.images.length > 0) {
                  const firstImg = product.images[0];
                  imageSrc = typeof firstImg === 'string' ? firstImg : firstImg.src;
                }

                // Determinar disponibilidad virtual
                const isSoldOut = product.status === 'sold_out' || 
                  (product.colorVariants && product.colorVariants.every((cv: any) => 
                    cv.sizes.every((sz: any) => sz.virtualStock === 0)
                  ));

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#111111] mb-5 shadow-sm border border-white/5">
                      <div className="w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-out flex items-center justify-center relative">
                        {imageSrc && !failedProducts.has(product.id) && (
                          <Image
                            src={imageSrc}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover absolute inset-0 z-10"
                            onError={() => {
                              setFailedProducts((prev) => {
                                const next = new Set(prev);
                                next.add(product.id);
                                return next;
                              });
                            }}
                          />
                        )}
                        <div className="w-full h-full flex items-center justify-center text-white/5 text-4xl font-serif uppercase select-none">
                          {product.name.split(' ')[0]}
                        </div>
                      </div>

                      {/* Sold Out Badge */}
                      {isSoldOut && (
                        <div className="absolute top-4 right-4 bg-[#0a0a0a]/95 border border-red-500/20 text-red-400 text-[9px] px-2 py-1 uppercase tracking-widest font-bold font-mono">
                          Agotado
                        </div>
                      )}

                      {/* Drop Ended / Inactive Banner */}
                      {drop.status === 'ENDED' && !isSoldOut && (
                        <div className="absolute top-4 right-4 bg-[#0a0a0a]/95 border border-white/10 text-white/60 text-[9px] px-2 py-1 uppercase tracking-widest font-bold font-mono">
                          Cerrado
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--primary)] group-hover:text-black transition-colors duration-300">
                          {product.name}
                        </h3>
                        <p className="text-xs text-black/60 font-mono mt-1">
                          {formatPrice(product.priceEUR)}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-black/30 group-hover:text-[var(--primary)] transition-colors transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mensaje de Drop finalizado en el pie del banner si procede */}
      {drop.status === 'ENDED' && (
        <div className="max-w-3xl mx-auto px-6 pt-12 text-center">
          <div className="bg-red-500/5 border border-red-500/10 p-6 text-xs text-red-400 tracking-wider uppercase font-mono">
            ⚠️ Este Drop finalizó el {new Date(drop.closingAt).toLocaleDateString('es-ES')}. Ya no se admiten pedidos para esta colección.
          </div>
        </div>
      )}
    </div>
  );
}
