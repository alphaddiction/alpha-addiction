import { printfulFetch } from '@/lib/printful';
import { NextResponse } from 'next/server';

/**
 * GET /api/printful/test
 * 
 * Comprueba de forma inocua que la API responde y que la clave de API (PRINTFUL_API_KEY)
 * es válida consultando el endpoint de tiendas del usuario.
 */
export async function GET() {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: true,
          message: 'La variable de entorno PRINTFUL_API_KEY no está configurada.',
        },
        { status: 400 }
      );
    }

    // Realizar llamada inocua a Printful (obtener la lista de tiendas vinculadas a la clave)
    // Devuelve éxito si responde con HTTP 200.
    const response = await printfulFetch<{ code: number; result: any }>('stores');

    return NextResponse.json({
      success: true,
      error: false,
      message: 'Conexión con la API de Printful establecida con éxito.',
      code: response.code,
    });
  } catch (error) {
    console.error('❌ Error de conexión al testear API de Printful:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido de red.';
    
    return NextResponse.json(
      {
        success: false,
        error: true,
        message: `Fallo en la conexión: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
