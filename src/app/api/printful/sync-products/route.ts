import { printfulFetch } from '@/lib/printful';
import { products as localProducts } from '@/lib/products';
import { PrintfulSyncProduct, PrintfulProductDetails } from '@/types/printful';
import { NextResponse } from 'next/server';

/**
 * POST /api/printful/sync-products
 * 
 * Descarga todo el catálogo sincronizado de la API de Printful y lo contrasta
 * de manera lógica con el catálogo de productos local (definido en src/lib/products.ts).
 * 
 * Devuelve un resumen de estado de vinculación y diferencias en variantes
 * sin guardar cambios en la base de datos (según las restricciones de la Fase 1).
 */
export async function POST() {
  try {
    // 1. Obtener la lista base de productos en Printful
    console.log('[Sync API] Recuperando productos base desde Printful...');
    const printfulListResponse = await printfulFetch<{ result: PrintfulSyncProduct[] }>('sync/products');
    const printfulSyncProducts = printfulListResponse.result || [];

    // 2. Obtener detalles de variantes para cada producto en paralelo
    console.log(`[Sync API] Descargando detalles para ${printfulSyncProducts.length} productos remotos...`);
    const printfulDetails = await Promise.all(
      printfulSyncProducts.map(async (product) => {
        try {
          const detailResponse = await printfulFetch<{ result: PrintfulProductDetails }>(`sync/products/${product.id}`);
          return detailResponse.result;
        } catch (err) {
          console.error(`❌ [Sync API] Error al recuperar detalles del producto ${product.id}:`, err);
          return null;
        }
      })
    );

    const activePrintfulProducts = detailedProductsFilter(printfulDetails);

    // 3. Realizar comparación cruzada (local vs remoto)
    const comparisonList: any[] = [];

    for (const localProduct of localProducts) {
      // Intentar encontrar el producto equivalente en Printful a través del slug (external_id)
      const remoteProduct = activePrintfulProducts.find(
        (p) => p.sync_product.external_id === localProduct.slug
      );

      if (remoteProduct) {
        const localVariantsCount = localProduct.colors.length * localProduct.sizes.length;
        const remoteVariants = remoteProduct.sync_variants;

        const variantsComparison: any[] = [];
        let matchedCount = 0;

        // Evaluar cada combinación teórica de Talla + Color definida localmente
        for (const color of localProduct.colors) {
          for (const size of localProduct.sizes) {
            // Buscar la variante correspondiente en Printful por coincidencia de nombre
            const remoteVariant = remoteVariants.find((rv) => {
              const nameLower = rv.name.toLowerCase();
              return nameLower.includes(color.toLowerCase()) && nameLower.includes(`/${size.toLowerCase()}`);
            });

            if (remoteVariant) {
              matchedCount++;
              variantsComparison.push({
                color,
                size,
                status: 'sincronizado',
                sku: remoteVariant.sku,
                printfulVariantId: remoteVariant.variant_id,
                syncVariantId: remoteVariant.id,
              });
            } else {
              variantsComparison.push({
                color,
                size,
                status: 'no_encontrado_en_printful',
                sku: null,
                printfulVariantId: null,
                syncVariantId: null,
              });
            }
          }
        }

        // Buscar variantes remotas en Printful que no correspondan a combinaciones del catálogo local
        const orphanedRemoteVariants = remoteVariants.filter((rv) => {
          return !localProduct.colors.some((color) =>
            localProduct.sizes.some((size) => {
              const nameLower = rv.name.toLowerCase();
              return nameLower.includes(color.toLowerCase()) && nameLower.includes(`/${size.toLowerCase()}`);
            })
          );
        }).map((rv) => ({
          name: rv.name,
          sku: rv.sku,
          syncVariantId: rv.id,
          catalogVariantId: rv.variant_id,
        }));

        comparisonList.push({
          slug: localProduct.slug,
          name: localProduct.name,
          status: 'vinculado',
          printfulProductId: remoteProduct.sync_product.id,
          totalLocalVariants: localVariantsCount,
          totalRemoteVariants: remoteVariants.length,
          matchedVariants: matchedCount,
          missingVariants: localVariantsCount - matchedCount,
          orphanedRemoteVariantsCount: orphanedRemoteVariants.length,
          variants: variantsComparison,
          orphanedRemoteVariants,
        });
      } else {
        // Producto local que no existe en el catálogo remoto de Printful
        comparisonList.push({
          slug: localProduct.slug,
          name: localProduct.name,
          status: 'no_vinculado_en_printful',
          printfulProductId: null,
          totalLocalVariants: localProduct.colors.length * localProduct.sizes.length,
          totalRemoteVariants: 0,
          matchedVariants: 0,
          missingVariants: localProduct.colors.length * localProduct.sizes.length,
          orphanedRemoteVariantsCount: 0,
          variants: [],
          orphanedRemoteVariants: [],
        });
      }
    }

    // Identificar productos en Printful que no están mapeados con ningún slug local
    const orphanedRemoteProducts = activePrintfulProducts
      .filter((p) => p.sync_product.external_id === null || !localProducts.some((lp) => lp.slug === p.sync_product.external_id))
      .map((p) => ({
        printfulProductId: p.sync_product.id,
        externalId: p.sync_product.external_id,
        name: p.sync_product.name,
        variantsCount: p.sync_product.variants,
      }));

    // 4. Calcular estadísticas generales del reporte
    const totalLocalProducts = localProducts.length;
    const totalRemoteProducts = activePrintfulProducts.length;
    const matchedProducts = comparisonList.filter((c) => c.status === 'vinculado').length;
    const missingProducts = comparisonList.filter((c) => c.status === 'no_vinculado_en_printful').length;
    const orphanedProducts = orphanedRemoteProducts.length;

    const summaryReport = {
      timestamp: new Date().toISOString(),
      stats: {
        totalLocalProducts,
        totalRemoteProducts,
        matchedProducts,
        missingProducts,
        orphanedProducts,
      },
      comparison: comparisonList,
      orphanedRemoteProducts,
    };

    return NextResponse.json({
      success: true,
      message: 'Comparación lógica de catálogo realizada con éxito (sin cambios en base de datos).',
      summary: summaryReport,
    });
  } catch (error) {
    console.error('❌ Error en POST /api/printful/sync-products:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fallo al ejecutar la sincronización lógica',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * Filtro auxiliar de tipos para limpiar productos no cargados.
 */
function detailedProductsFilter(products: (PrintfulProductDetails | null)[]): PrintfulProductDetails[] {
  return products.filter((p): p is PrintfulProductDetails => p !== null);
}
