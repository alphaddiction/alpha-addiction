import { products } from '@/lib/products';
import { NextResponse } from 'next/server';

/**
 * GET /api/products/validate
 * 
 * Diagnostica y valida la integridad de los productos definidos localmente.
 * Reporta duplicidades de IDs, SKUs y Variant IDs de Printful, y verifica
 * que las variantes físicas pertenezcan a los atributos válidos del producto.
 */
export async function GET() {
  try {
    const totalProducts = products.length;
    let linkedProductsCount = 0;
    let unlinkedProductsCount = 0;

    const duplicateProductIds: string[] = [];
    const duplicateSkus: string[] = [];
    const duplicatePrintfulVariantIds: number[] = [];
    const productsWithoutVariants: string[] = [];
    const invalidVariants: string[] = [];
    const errors: string[] = [];

    const idSet = new Set<string>();
    const skuSet = new Set<string>();
    const printfulVariantIdSet = new Set<number>();

    for (const p of products) {
      // 1. Validar IDs duplicados de producto
      if (idSet.has(p.id)) {
        duplicateProductIds.push(p.id);
        errors.push(`ID de producto duplicado detectado: ${p.id}`);
      }
      idSet.add(p.id);

      // Evaluar si está vinculado con la API de Printful
      if (p.printfulProductId !== undefined && p.printfulProductId !== null) {
        linkedProductsCount++;
      } else {
        unlinkedProductsCount++;
      }

      // 2. Validar si el producto no tiene variantes físicas declaradas
      if (!p.variants || p.variants.length === 0) {
        productsWithoutVariants.push(p.slug);
        errors.push(`El producto "${p.name}" (${p.slug}) no tiene variantes físicas asociadas.`);
        continue;
      }

      // 3. Validar consistencia de las variantes
      for (const v of p.variants) {
        // Validar SKUs duplicados (ignorar los que no se han configurado aún)
        if (v.sku) {
          if (skuSet.has(v.sku)) {
            duplicateSkus.push(v.sku);
            errors.push(`Código SKU duplicado detectado: ${v.sku}`);
          }
          skuSet.add(v.sku);
        }

        // Validar Variant IDs de Printful duplicados (ignorar no configurados)
        if (v.printfulVariantId) {
          if (printfulVariantIdSet.has(v.printfulVariantId)) {
            duplicatePrintfulVariantIds.push(v.printfulVariantId);
            errors.push(`ID de variante de Printful duplicado detectado: ${v.printfulVariantId}`);
          }
          printfulVariantIdSet.add(v.printfulVariantId);
        }

        // Validar si el color y la talla pertenecen a los atributos declarados en el producto padre
        const isColorValid = p.colors.includes(v.color);
        const isSizeValid = p.sizes.includes(v.size);

        if (!isColorValid || !isSizeValid) {
          const detail = `${p.slug} - Color: ${v.color} (Válido: ${isColorValid}), Talla: ${v.size} (Válido: ${isSizeValid})`;
          invalidVariants.push(detail);
          errors.push(`Variante física inválida en ${p.slug}: Color "${v.color}" o Talla "${v.size}" no existen en la definición del producto.`);
        }
      }
    }

    // Calcular estado general del catálogo
    // Si hay errores de integridad (duplicados, variantes inválidas), es "error".
    // Si el catálogo es consistente pero tiene elementos sin vincular, es "advertencia" (requiere revisión).
    // Si todo está completo y mapeado correctamente, es "ok".
    let generalStatus = 'ok';
    if (errors.length > 0) {
      generalStatus = 'error';
    } else if (unlinkedProductsCount > 0) {
      generalStatus = 'advertencia';
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts,
        linkedProducts: linkedProductsCount,
        unlinkedProducts: unlinkedProductsCount,
        duplicateProductIds,
        duplicateSkus,
        duplicatePrintfulVariantIds,
        productsWithoutVariants,
        invalidVariants,
        errorsCount: errors.length,
        errors,
        generalStatus,
      },
    });
  } catch (error) {
    console.error('❌ Excepción ejecutando validación de productos:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fallo al ejecutar diagnóstico de catálogo',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
