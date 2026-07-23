'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { type Product, ProductMockup } from '@/shared/models/products';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/shared/utils/utils';

const USE_CONFIRMATION_PAGE = true;

interface ProductDetailClientProps {
  product: Product;
  dropStatus?: string;
  dropSlug?: string;
}

export default function ProductDetailClient({ product, dropStatus = 'LIVE', dropSlug }: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // 1. Identificar si el producto tiene variantes de color de Printful
  const hasColorVariants = product.colorVariants && product.colorVariants.length > 0;

  // 2. Estados locales
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [sizeError, setSizeError] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);

  // Estados del waitlist
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [imageError, setImageError] = useState<boolean>(false);
  const [failedMiniatures, setFailedMiniatures] = useState<Set<number>>(new Set());

  // Resetear estados de error al cambiar el índice o el color
  useEffect(() => {
    setImageError(false);
  }, [activeImageIndex, selectedColorId]);


  // 3. Inicializar el color seleccionado por defecto
  useEffect(() => {
    if (hasColorVariants && product.colorVariants) {
      setSelectedColorId(product.colorVariants[0].id);
    }
  }, [hasColorVariants, product.colorVariants]);

  // Resetear talla y activeImageIndex al cambiar el color
  const handleColorChange = (colorId: string) => {
    setSelectedColorId(colorId);
    setSelectedSize('');
    setActiveImageIndex(0);
    setSizeError(false);
  };

  // 4. Resolver imágenes/mockups a mostrar
  let imageSources: string[] = [];
  let imageAlts: string[] = [];
  let currentColorName = '';

  if (hasColorVariants && product.colorVariants) {
    const activeColorGroup = product.colorVariants.find(cv => cv.id === selectedColorId);
    if (activeColorGroup) {
      currentColorName = activeColorGroup.name;
      // Filtrar mockups activos
      const enabledMockups = activeColorGroup.mockups
        .filter(m => m.enabled)
        .sort((a, b) => a.order - b.order);

      if (enabledMockups.length > 0) {
        imageSources = enabledMockups.map(m => m.url);
        imageAlts = enabledMockups.map(m => m.alt);
      }
    }
  }

  // Fallback si no hay imágenes dinámicas activas de Printful, usar locales
  if (imageSources.length === 0) {
    const activeLocalImages = (product.images || [])
      .filter((img) => (typeof img === 'string' ? true : img.enabled));

    const sortedLocalImages = [...activeLocalImages].sort((a, b) => {
      const orderA = typeof a === 'string' ? 0 : a.order;
      const orderB = typeof b === 'string' ? 0 : b.order;
      return orderA - orderB;
    });

    imageSources = sortedLocalImages.map((img) => (typeof img === 'string' ? img : img.src));
    imageAlts = sortedLocalImages.map((img) => (typeof img === 'string' ? product.name : img.alt));
  }

  // 5. Determinar disponibilidad y variantes físicas
  const availableSizes = hasColorVariants && product.colorVariants
    ? product.colorVariants.find(cv => cv.id === selectedColorId)?.sizes || []
    : [];

  const selectedColorVariant = hasColorVariants && product.colorVariants
    ? product.colorVariants.find(cv => cv.id === selectedColorId)
    : null;

  const selectedSizeInfo = selectedColorVariant
    ? selectedColorVariant.sizes.find(s => s.size === selectedSize)
    : null;

  const printfulVariantId = selectedSizeInfo?.printfulVariantId;
  const colorNameToSend = selectedColorVariant?.name;

  // 6. Añadir al carrito
  const handleAddToCart = () => {
    const requiresSize = hasColorVariants ? availableSizes.length > 0 : product.sizes.length > 0;
    if (requiresSize && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    const sizeName = requiresSize ? selectedSize : 'One Size';
    addItem(product, sizeName, colorNameToSend || undefined, printfulVariantId || undefined);

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Comprar ahora
  const handleBuyNow = () => {
    const requiresSize = hasColorVariants ? availableSizes.length > 0 : product.sizes.length > 0;
    if (requiresSize && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    const sizeName = requiresSize ? selectedSize : 'One Size';
    addItem(product, sizeName, colorNameToSend || undefined, printfulVariantId || undefined);
    router.push('/checkout');
  };

  // Waitlist form
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

  return (
    <div className="min-h-screen pt-32 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-24 mb-24 relative">
      
      {/* Volver */}
      <button 
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push(dropSlug ? `/drops/${dropSlug}` : '/');
          }
        }}
        className="absolute top-24 left-6 md:left-auto flex items-center text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors tracking-widest bg-transparent border-0 outline-none cursor-pointer"
      >
        <ArrowLeft className="w-3 h-3 mr-2" />
        VOLVER
      </button>

      {/* Galería de imágenes (Izquierda) */}
      <div className="w-full md:w-1/2 mt-8 md:mt-0 flex flex-col">
        <div className="aspect-[3/4] bg-[var(--surface)] w-full relative overflow-hidden shadow-sm flex items-center justify-center border-2 border-[var(--primary)] transition-all duration-300">
          {imageSources.length > 0 && !imageError && (
            <Image
              src={imageSources[activeImageIndex] || imageSources[0]}
              alt={imageAlts[activeImageIndex] || imageAlts[0]}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover animate-fade-in absolute inset-0 z-10"
              onError={() => setImageError(true)}
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#111111] select-none">
            <span className="text-white/5 text-7xl font-serif uppercase tracking-wider">
              {product.name.split(' ')[0]}
            </span>
            <span className="text-white/10 text-[9px] tracking-[0.3em] uppercase font-light mt-4">
              AlphaAddiction
            </span>
          </div>
        </div>

        {/* Miniaturas de la galería */}
        {imageSources.length > 1 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {imageSources.map((src, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`
                  aspect-square bg-[var(--surface)] overflow-hidden border-2 transition-all duration-200 relative
                  ${activeImageIndex === index 
                    ? 'border-[var(--primary)] opacity-100 scale-[1.02]' 
                    : 'border-[var(--border)]/30 opacity-60 hover:opacity-100 hover:border-[var(--primary)]/60'
                  }
                `}
              >
                {!failedMiniatures.has(index) && (
                  <Image
                    src={src}
                    alt={imageAlts[index]}
                    fill
                    sizes="100px"
                    className="object-cover"
                    onError={() => {
                      setFailedMiniatures(prev => {
                        const next = new Set(prev);
                        next.add(index);
                        return next;
                      });
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Información del producto (Derecha) */}
      <div className="w-full md:w-1/2 flex flex-col max-w-md">
        <h1 className="text-4xl md:text-5xl font-serif mb-2 leading-tight text-[var(--foreground)]">
          {product.name}
        </h1>
        <p className="text-xl text-[var(--muted)] mb-8 font-light tracking-wide">
          {formatPrice(product.priceEUR)}
        </p>

        <div className="h-px w-full bg-[var(--border)] mb-8 opacity-50" />

        <p className="text-[var(--foreground)]/80 leading-relaxed mb-8 font-light text-sm md:text-base">
          {product.descriptionShort}
        </p>

        {product.status === 'in_stock' ? (
          <div className="space-y-8">
            
            {/* Selector de color */}
            {hasColorVariants && product.colorVariants && (
              <div className="mb-6">
                <span className="text-[10px] text-[var(--muted)] tracking-widest uppercase block mb-3 font-semibold">
                  COLOR: <span className="text-[var(--foreground)] ml-1 font-medium">{currentColorName}</span>
                </span>
                <div className="flex flex-wrap gap-3">
                  {product.colorVariants.map(cv => (
                    <button
                      key={cv.id}
                      onClick={() => handleColorChange(cv.id)}
                      title={cv.name}
                      className={`
                        w-8 h-8 rounded-full border transition-all duration-200 flex items-center justify-center relative
                        ${selectedColorId === cv.id 
                          ? 'border-[var(--primary)] scale-110 ring-2 ring-[var(--primary)]/20' 
                          : 'border-[var(--border)] hover:border-[var(--muted)] hover:scale-105'
                        }
                      `}
                      style={{ backgroundColor: cv.hex }}
                    >
                      {selectedColorId === cv.id && (
                        <div className={`w-1.5 h-1.5 rounded-full ${cv.hex.toUpperCase() === '#FFFFFF' ? 'bg-black' : 'bg-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de talla */}
            {((hasColorVariants && availableSizes.length > 0) || (!hasColorVariants && product.sizes.length > 0)) && (
              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] text-[var(--muted)] tracking-widest uppercase font-semibold">TALLA</span>
                  {sizeError && (
                    <span className="text-[10px] text-red-500 tracking-widest uppercase animate-pulse">Selecciona una talla</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasColorVariants
                    ? availableSizes.map(sizeObj => {
                        const isSizeDisabled = !sizeObj.available || (sizeObj.virtualStock !== undefined && sizeObj.virtualStock <= 0);
                        return (
                          <button
                            key={sizeObj.size}
                            disabled={isSizeDisabled}
                            onClick={() => {
                              setSelectedSize(sizeObj.size);
                              setSizeError(false);
                            }}
                            className={`
                              border px-4 py-2 text-xs transition-all duration-200 relative min-w-[48px] text-center
                              ${isSizeDisabled 
                                ? 'border-[var(--border)]/30 text-[var(--muted)]/40 cursor-not-allowed opacity-40 line-through' 
                                : selectedSize === sizeObj.size
                                  ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] scale-105 font-medium'
                                  : 'border-[var(--border)] text-[var(--foreground)]/70 hover:border-[var(--primary)] hover:text-[var(--foreground)]'
                              }
                            `}
                          >
                            {sizeObj.size}
                            {sizeObj.virtualStock !== undefined && sizeObj.virtualStock > 0 && sizeObj.virtualStock <= 10 && (
                              <span className="absolute -top-1.5 -right-1 px-1 bg-amber-500 text-black text-[7px] font-bold rounded-full">
                                {sizeObj.virtualStock}
                              </span>
                            )}
                          </button>
                        );
                      })
                    : product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => {
                            setSelectedSize(size);
                            setSizeError(false);
                          }}
                          className={`
                            border px-4 py-2 text-xs transition-all duration-200 min-w-[48px] text-center
                            ${selectedSize === size
                              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] scale-105 font-medium'
                              : 'border-[var(--border)] text-[var(--foreground)]/70 hover:border-[var(--primary)] hover:text-[var(--foreground)]'
                            }
                          `}
                        >
                          {size}
                        </button>
                      ))
                  }
                </div>
              </div>
            )}

            {/* Acciones de añadir al carrito / Alertas de Drop */}
            {dropStatus !== 'LIVE' ? (
              <div className="space-y-3 pt-4">
                {dropStatus === 'COMING_SOON' ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 text-xs font-mono text-center uppercase tracking-wider">
                    ⏳ Este artículo pertenece a un drop programado que abrirá próximamente.
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-xs font-mono text-center uppercase tracking-wider">
                    🚫 Colección Cerrada. Este Drop ha finalizado.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className={`
                    w-full py-4 text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-200
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
                    flex items-center justify-center gap-3 transition-all duration-200
                    hover:bg-transparent hover:text-[var(--foreground)] hover:border hover:border-[var(--primary)]
                  "
                >
                  <span>Comprar ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        ) : (
          /* Agotado / Lista de espera */
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
        )}

        {/* Garantías e info extra */}
        <div className="mt-12 space-y-3 text-[10px] tracking-widest text-[var(--muted)] uppercase opacity-70">
          <p>AUTENTICIDAD GARANTIZADA</p>
          <p>PRODUCCIÓN LIMITADA</p>
          <p>ENVÍO DESDE ALPHA ADDICTION HQ</p>
        </div>
      </div>

    </div>
  );
}
