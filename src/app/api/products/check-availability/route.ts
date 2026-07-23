import { NextResponse } from 'next/server';
import { products } from '@/shared/models/products';

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Lista de productos inválida.' }, { status: 400 });
    }

    const available: any[] = [];
    const missing: any[] = [];

    for (const item of items) {
      // Intentar buscar el producto por ID o slug
      const foundProduct = products.find(p => p.id === item.productId || p.slug === item.productId);

      if (!foundProduct) {
        missing.push({
          productId: item.productId,
          name: item.name,
          color: item.color,
          size: item.size,
          reason: 'El producto ya no se encuentra disponible en la tienda.'
        });
        continue;
      }

      // Validar si el producto está fuera de stock general
      if (foundProduct.status !== 'in_stock') {
        missing.push({
          productId: item.productId,
          name: item.name,
          color: item.color,
          size: item.size,
          reason: 'El producto se encuentra agotado (Sold Out).'
        });
        continue;
      }

      // Validar color y talla
      const hasColor = foundProduct.colors ? foundProduct.colors.includes(item.color) : true;
      const hasSize = foundProduct.sizes ? foundProduct.sizes.includes(item.size) : true;

      // Buscar si tiene la variante mapeada físicamente
      const variant = foundProduct.variants?.find(
        v => v.color.toLowerCase() === item.color.toLowerCase() && 
             v.size.toLowerCase() === item.size.toLowerCase()
      );

      if (!hasColor || !hasSize || !variant) {
        missing.push({
          productId: item.productId,
          name: item.name,
          color: item.color,
          size: item.size,
          reason: `La combinación de color "${item.color}" y talla "${item.size}" ya no está disponible.`
        });
        continue;
      }

      // El producto es completamente válido y tiene stock disponible
      available.push({
        product: foundProduct,
        color: item.color,
        size: item.size,
        printfulVariantId: variant.printfulVariantId
      });
    }

    return NextResponse.json({
      success: true,
      available,
      missing
    });

  } catch (error: any) {
    console.error('❌ [Check Availability POST] Error:', error);
    return NextResponse.json({ error: 'Error interno de servidor.' }, { status: 500 });
  }
}
