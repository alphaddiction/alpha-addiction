import { getPrintfulProducts, getPrintfulProductVariants } from '@/lib/printful';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/printful/products
 * 
 * Consulta los productos del catálogo remoto y los devuelve junto
 * con estadísticas de variantes, tallas, colores y SKUs.
 */
export async function GET() {
  try {
    console.log('[Printful Products API] Solicitando lista de productos a través del cliente...');
    const syncProducts = await getPrintfulProducts();
    let totalVariants = 0;

    // Obtener los detalles de variante para cada producto en paralelo
    const detailedProducts = await Promise.all(
      syncProducts.map(async (product) => {
        try {
          const variants = await getPrintfulProductVariants(product.id);
          totalVariants += variants.length;
          
          return {
            productId: product.id,
            externalId: product.external_id,
            name: product.name,
            variantsCount: product.variants,
            syncedCount: product.synced,
            variants: variants.map((v) => {
              // Deducir color y talla a partir de la nomenclatura de la variante remota
              let size = '';
              let color = '';
              if (v.name.includes(' / ')) {
                const parts = v.name.split(' - ').pop()?.split(' / ');
                if (parts && parts.length === 2) {
                  color = parts[0].trim();
                  size = parts[1].trim();
                }
              }
              
              return {
                syncVariantId: v.id,
                catalogVariantId: v.variant_id,
                externalId: v.external_id,
                name: v.name,
                sku: v.sku,
                retailPrice: v.retail_price,
                currency: v.currency,
                synced: v.synced,
                size: size || undefined,
                color: color || undefined,
              };
            }),
          };
        } catch (err) {
          console.error(`❌ Error consultando variantes del producto ${product.id}:`, err);
          return null;
        }
      })
    );

    const validProductsList = detailedProducts.filter((p) => p !== null);

    return NextResponse.json({
      success: true,
      totalProducts: validProductsList.length,
      totalVariants,
      products: validProductsList,
    });
  } catch (error) {
    console.error('❌ Excepción en GET /api/printful/products:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al recuperar productos de Printful',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
