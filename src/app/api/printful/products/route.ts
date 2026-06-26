import { printfulFetch } from '@/lib/printful';
import { PrintfulSyncProduct, PrintfulProductDetails } from '@/types/printful';
import { NextResponse } from 'next/server';

/**
 * GET /api/printful/products
 * 
 * Recupera la lista completa de productos sincronizados en la tienda de Printful.
 * Resuelve recursivamente los detalles de cada producto para incluir variantes, SKUs,
 * precios y mapeos de ID.
 */
export async function GET() {
  try {
    // 1. Obtener listado de productos base sincronizados
    console.log('[Printful API] Solicitando lista de productos sincronizados (GET sync/products)...');
    const productsListResponse = await printfulFetch<{ result: PrintfulSyncProduct[] }>('sync/products');
    const syncProducts = productsListResponse.result || [];

    // 2. Obtener detalles de variantes para cada producto en paralelo
    console.log(`[Printful API] Recuperando detalles para ${syncProducts.length} productos...`);
    const detailedProducts = await Promise.all(
      syncProducts.map(async (product) => {
        try {
          const detailResponse = await printfulFetch<{ result: PrintfulProductDetails }>(`sync/products/${product.id}`);
          return detailResponse.result;
        } catch (err) {
          console.error(`❌ Error al obtener detalles para el producto ${product.id} (${product.name}):`, err);
          return null;
        }
      })
    );

    // Filtrar cualquier producto que haya fallado al cargarse
    const validProducts = detailedProducts.filter((p): p is PrintfulProductDetails => p !== null);

    // 3. Formatear y estructurar el catálogo devuelto
    const formattedProducts = validProducts.map((p) => ({
      productId: p.sync_product.id,
      externalId: p.sync_product.external_id,
      name: p.sync_product.name,
      variantsCount: p.sync_product.variants,
      syncedCount: p.sync_product.synced,
      variants: p.sync_variants.map((v) => {
        // Deducir el tamaño y color a partir del nombre en formato estándar "Nombre - Color / Talla"
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
          syncVariantId: v.id,             // ID de la variante sincronizada en la tienda
          catalogVariantId: v.variant_id,  // ID de la variante base en el catálogo de Printful
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
    }));

    return NextResponse.json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    console.error('❌ Excepción al listar productos de Printful:', error);
    
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
