import { getPrintfulProducts, getPrintfulProductVariants } from '@/backend/api/printful';
import { products as localProducts } from '@/shared/models/products';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/printful/sync-products
 * 
 * Descarga el catálogo de Printful y realiza un mapeo lógico y reporte cruzado 
 * con el catálogo local de Alpha Addiction.
 * 
 * Detecta discrepancias de productos, variantes y duplicados de SKUs o Variant IDs.
 */
export async function POST() {
  try {
    console.log('[Sync API] Descargando catálogo remoto para diagnóstico...');
    const printfulSyncProducts = await getPrintfulProducts();

    // Obtener detalles de cada producto en paralelo
    const printfulDetails = await Promise.all(
      printfulSyncProducts.map(async (product) => {
        try {
          const variants = await getPrintfulProductVariants(product.id);
          return {
            sync_product: product,
            sync_variants: variants,
          };
        } catch (err) {
          console.error(`❌ [Sync API] Error al recuperar detalles del producto ${product.id}:`, err);
          return null;
        }
      })
    );

    const activePrintfulProducts = printfulDetails.filter((p): p is any => p !== null);

    const comparisonList: any[] = [];
    const duplicateSkus: string[] = [];
    const duplicatePrintfulVariantIds: number[] = [];

    const skuSet = new Set<string>();
    const variantIdSet = new Set<number>();

    // Cruzar catálogo local
    for (const localProduct of localProducts) {
      const remoteProduct = activePrintfulProducts.find(
        (p: any) => 
          p.sync_product.external_id === localProduct.slug ||
          p.sync_product.id === localProduct.printfulProductId
      );

      if (remoteProduct) {
        const localVariantsCount = localProduct.colors.length * localProduct.sizes.length;
        const remoteVariants = remoteProduct.sync_variants;

        const variantsComparison: any[] = [];
        let matchedCount = 0;

        for (const color of localProduct.colors) {
          for (const size of localProduct.sizes) {
            const remoteVariant = remoteVariants.find((rv: any) => {
              const rvColor = (rv.color || '').toLowerCase();
              const rvSize = (rv.size || '').toLowerCase();
              return rvColor === color.toLowerCase() && rvSize === size.toLowerCase();
            });

            if (remoteVariant) {
              matchedCount++;
              
              if (remoteVariant.sku) {
                if (skuSet.has(remoteVariant.sku)) {
                  duplicateSkus.push(remoteVariant.sku);
                }
                skuSet.add(remoteVariant.sku);
              }

              if (remoteVariant.variant_id) {
                if (variantIdSet.has(remoteVariant.variant_id)) {
                  duplicatePrintfulVariantIds.push(remoteVariant.variant_id);
                }
                variantIdSet.add(remoteVariant.variant_id);
              }

              variantsComparison.push({
                color,
                size,
                status: 'sincronizado',
                sku: remoteVariant.sku,
                printfulVariantId: remoteVariant.variant_id,
                syncVariantId: remoteVariant.id,
                files: remoteVariant.files || [],
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

        const orphanedRemoteVariants = remoteVariants.filter((rv: any) => {
          return !localProduct.colors.some((color) =>
            localProduct.sizes.some((size) => {
              const nameLower = rv.name.toLowerCase();
              return nameLower.includes(color.toLowerCase()) && nameLower.includes(`/${size.toLowerCase()}`);
            })
          );
        }).map((rv: any) => ({
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
        // Producto local que no existe en Printful
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

    // Identificar productos remotos huérfanos sin slug local
    const orphanedRemoteProducts = activePrintfulProducts
      .filter((p: any) => p.sync_product.external_id === null || !localProducts.some((lp) => lp.slug === p.sync_product.external_id))
      .map((p: any) => ({
        printfulProductId: p.sync_product.id,
        externalId: p.sync_product.external_id,
        name: p.sync_product.name,
        variantsCount: p.sync_product.variants,
      }));

    const totalLocalProducts = localProducts.length;
    const totalRemoteProducts = activePrintfulProducts.length;
    const matchedProducts = comparisonList.filter((c) => c.status === 'vinculado').length;
    const missingProducts = comparisonList.filter((c) => c.status === 'no_vinculado_en_printful').length;

    const summaryReport = {
      timestamp: new Date().toISOString(),
      stats: {
        totalLocalProducts,
        totalRemoteProducts,
        matchedProducts,
        missingProducts,
        orphanedProducts: orphanedRemoteProducts.length,
      },
      duplicateSkus,
      duplicatePrintfulVariantIds,
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
