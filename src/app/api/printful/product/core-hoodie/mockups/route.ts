import { getPrintfulProductVariants } from '@/lib/printful';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORE_HOODIE_PRINTFUL_ID = 442791728;

/**
 * GET /api/printful/product/core-hoodie/mockups
 * 
 * Obtiene los mockups y archivos de previsualización directamente desde la API de Printful.
 * Filtra los archivos de tipo 'preview' y 'back', deduplica por URL de previsualización,
 * y propone un orden y estado 'enabled' inicial.
 */
export async function GET() {
  try {
    const variants = await getPrintfulProductVariants(CORE_HOODIE_PRINTFUL_ID);
    
    const mockupsMap = new Map<string, any>();
    let orderCounter = 1;

    for (const variant of variants) {
      if (variant.files) {
        for (const file of variant.files) {
          // Filtrar archivos de previsualización (frente/dorso) con URL válida
          if ((file.type === 'preview' || file.type === 'back') && file.preview_url) {
            const url = file.preview_url;
            if (!mockupsMap.has(url)) {
              const nameParts = variant.name.split(' / ');
              const colorName = nameParts[1] || 'Unisex';
              mockupsMap.set(url, {
                id: `core-hoodie-mockup-${file.id}`,
                url: url,
                alt: `Alpha Addiction Core Hoodie - mockup ${file.type === 'preview' ? 'frontal' : 'trasero'} (${colorName})`,
                source: 'printful',
                enabled: true,
                order: orderCounter++,
                variantId: variant.id,
                fileType: file.type,
              });
            }
          }
        }
      }
    }

    const mockupsList = Array.from(mockupsMap.values());

    return NextResponse.json({
      success: true,
      productId: CORE_HOODIE_PRINTFUL_ID,
      totalMockups: mockupsList.length,
      mockups: mockupsList,
    });
  } catch (error) {
    console.error('❌ Error recuperando mockups de Printful:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fallo al recuperar mockups del producto desde Printful',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
