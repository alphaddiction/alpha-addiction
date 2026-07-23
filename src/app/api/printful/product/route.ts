import { printfulFetch } from '@/backend/api/printful';
import { PrintfulProductDetails } from '@/shared/types/printful';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/printful/product?id=<id_producto_printful>
 * 
 * Recupera los detalles completos de un único producto sincronizado en Printful,
 * incluyendo su estructura de variantes físicas, SKUs y precios.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Falta el parámetro ID',
          message: 'Debe suministrar el ID de producto de Printful (?id=...) para realizar la consulta.',
        },
        { status: 400 }
      );
    }

    console.log(`[Printful API] Recuperando detalles para el producto con ID: ${id}...`);
    const detailResponse = await printfulFetch<{ result: PrintfulProductDetails }>(`sync/products/${id}`);

    if (!detailResponse.result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Producto no encontrado',
          message: `La API de Printful no devolvió información para el ID ${id}.`,
        },
        { status: 404 }
      );
    }

    const p = detailResponse.result;

    // Formatear y estructurar el producto devuelto
    const formattedProduct = {
      productId: p.sync_product.id,
      externalId: p.sync_product.external_id,
      name: p.sync_product.name,
      variantsCount: p.sync_product.variants,
      syncedCount: p.sync_product.synced,
      variants: p.sync_variants.map((v) => {
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

    return NextResponse.json({
      success: true,
      product: formattedProduct,
    });
  } catch (error) {
    console.error(`❌ Excepción al recuperar detalles del producto de Printful:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error al recuperar detalles del producto',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
