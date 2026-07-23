import { testPrintfulConnection } from '@/backend/api/printful';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/printful/test
 * 
 * Invoca la función auxiliar de test de conexión para validar
 * el estado y la validez de las credenciales de la API de Printful.
 */
export async function GET() {
  const result = await testPrintfulConnection();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
