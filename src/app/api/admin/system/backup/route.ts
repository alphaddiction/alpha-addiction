import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('alpha_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const verified = await verifySessionToken(token);
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    // Restricción para entornos Serverless de producción
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
      return NextResponse.json({
        success: false,
        error: 'Operación no soportada.',
        message: 'Los backups manuales en caliente no están permitidos en Vercel/Producción debido a que el sistema de archivos local es efímero. Ejecute copias de seguridad de forma local usando "npm run backup:db" o a través de las herramientas de Neon Console.'
      }, { status: 403 });
    }

    console.log('🛡️ [Admin Backups API] Disparando copia de seguridad manual en desarrollo...');
    
    const { stdout, stderr } = await execAsync('npm run backup:db');

    console.log('🛡️ [Admin Backups API] stdout:', stdout);
    if (stderr) {
      console.warn('🛡️ [Admin Backups API] stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Copia de seguridad realizada correctamente.',
      output: stdout
    });

  } catch (error: any) {
    console.error('❌ [Admin Backups API POST] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error del servidor.',
      message: error.message
    }, { status: 500 });
  }
}
