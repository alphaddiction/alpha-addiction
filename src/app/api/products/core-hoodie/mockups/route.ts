import { products } from '@/lib/products';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/core-hoodie/mockups
 * 
 * Devuelve los mockups activos del producto local 'core-hoodie' (definidos con enabled: true).
 */
export async function GET() {
  try {
    const product = products.find((p) => p.slug === 'core-hoodie');
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado en el catálogo local' },
        { status: 404 }
      );
    }

    const activeMockups = (product.mockups || []).filter((m) => m.enabled);

    return NextResponse.json({
      success: true,
      slug: 'core-hoodie',
      totalActiveMockups: activeMockups.length,
      mockups: activeMockups,
    });
  } catch (error) {
    console.error('❌ Error obteniendo mockups del producto local:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fallo al obtener mockups del catálogo local',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
