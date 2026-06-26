import { Product, ColorVariant, SizeVariant, ProductMockup } from '@/lib/products';
import { PrintfulSyncVariant } from '@/types/printful';
import { getPrintfulProductVariants } from '@/lib/printful';

// Diccionario de colores hexadecimales para el selector visual
export const COLOR_HEX_MAP: Record<string, string> = {
  'navy': '#1B2A4A',
  'maroon': '#800020',
  'forest green': '#2D5A27',
  'dark heather': '#4F4F4F',
  'indigo blue': '#4B0082',
  'light blue': '#ADD8E6',
  'sand': '#E6D7B8',
  'light pink': '#FFB6C1',
  'black': '#000000',
  'white': '#FFFFFF',
  'cream': '#F5F5DC',
  'gray': '#808080',
  'grey': '#808080',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'beige': '#F5F5DC',
  'brown': '#A52A2A',
  'gold': '#D4AF37',
  'silver': '#C0C0C0',
};

/**
 * Obtiene el código hexadecimal de un color a partir de su nombre.
 */
export function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  return COLOR_HEX_MAP[normalized] || '#808080'; // Gris por defecto si no se encuentra
}

/**
 * Mapea las variantes de Printful al modelo de color/talla unificado.
 */
export function mapPrintfulSyncVariantsToColors(variants: PrintfulSyncVariant[]): ColorVariant[] {
  const colorGroups: Record<string, ColorVariant> = {};

  for (const variant of variants) {
    const colorName = variant.color || 'Unisex';
    const colorId = colorName.toLowerCase().replace(/\s+/g, '-');

    if (!colorGroups[colorId]) {
      colorGroups[colorId] = {
        id: colorId,
        name: colorName,
        hex: getColorHex(colorName),
        mockups: [],
        sizes: [],
      };
    }

    const group = colorGroups[colorId];

    // Añadir talla si está definida
    if (variant.size) {
      // Evitar duplicar la misma talla
      const sizeExists = group.sizes.some(s => s.size === variant.size);
      if (!sizeExists) {
        group.sizes.push({
          size: variant.size,
          printfulVariantId: variant.variant_id,
          sku: variant.sku || '',
          available: variant.synced,
          retailPrice: variant.retail_price,
        });
      }
    }

    // Procesar y deduplicar archivos de previsualización (mockups)
    if (variant.files) {
      for (const file of variant.files) {
        if ((file.type === 'preview' || file.type === 'back') && file.preview_url) {
          const url = file.preview_url;
          const exists = group.mockups.some(m => m.url === url);
          if (!exists) {
            group.mockups.push({
              id: `${colorId}-mockup-${file.id}`,
              url: url,
              alt: `Alpha Addiction - mockup ${file.type === 'preview' ? 'frontal' : 'trasero'} (${colorName})`,
              source: 'printful',
              enabled: true,
              order: file.type === 'preview' ? 1 : 2,
            });
          }
        }
      }
    }
  }

  // Ordenar mockups y tallas dentro de cada color
  const result = Object.values(colorGroups);
  for (const group of result) {
    group.mockups.sort((a, b) => a.order - b.order);
    
    // Opcional: ordenar tallas por un estándar (S, M, L, XL...)
    const sizeOrder: Record<string, number> = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, '2XL': 6, '3XL': 7, 'XXL': 6 };
    group.sizes.sort((a, b) => {
      const orderA = sizeOrder[a.size.toUpperCase()] || 99;
      const orderB = sizeOrder[b.size.toUpperCase()] || 99;
      return orderA - orderB;
    });
  }

  return result;
}

/**
 * Carga dinámicamente las variantes del catálogo de Printful si el producto
 * tiene asignado un id de Printful y las fusiona en tiempo de servidor.
 */
export async function getDynamicProduct(product: Product): Promise<Product> {
  if (!product.printfulProductId) {
    return product;
  }

  try {
    const syncVariants = await getPrintfulProductVariants(product.printfulProductId);
    if (syncVariants && syncVariants.length > 0) {
      const colorVariants = mapPrintfulSyncVariantsToColors(syncVariants);
      
      // Combinar colores y tallas globales en base a las variantes dinámicas detectadas
      const dynamicColors = Array.from(new Set(syncVariants.map(v => v.color).filter((c): c is string => !!c)));
      const dynamicSizes = Array.from(new Set(syncVariants.map(v => v.size).filter((s): s is string => !!s)));

      return {
        ...product,
        colors: dynamicColors.length > 0 ? dynamicColors : product.colors,
        sizes: dynamicSizes.length > 0 ? dynamicSizes : product.sizes,
        colorVariants,
      };
    }
  } catch (error) {
    console.error(`❌ [Products Server] Error al recuperar detalles del producto de Printful ${product.slug}:`, error);
  }

  return product;
}
