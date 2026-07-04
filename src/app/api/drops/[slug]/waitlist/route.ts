import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { dispatchEvent } from '@/lib/events/dispatcher';
import { saveCustomerConsent } from '@/lib/email/consents';

// Interface para el control de rate limit en memoria
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const waitlistRateLimits = new Map<string, RateLimitEntry>();

// Función de limpieza de rate limit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of waitlistRateLimits.entries()) {
      if (now > entry.resetAt) {
        waitlistRateLimits.delete(ip);
      }
    }
  }, 10 * 60 * 1000); // Cada 10 minutos
}

// Función helper para hashear datos con SHA-256
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.trim().toLowerCase();

    // 1. Rate Limit por IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const now = Date.now();
    const entry = waitlistRateLimits.get(ip);
    const windowMs = 10 * 60 * 1000; // 10 minutos
    const maxAttempts = 5;

    if (entry && now < entry.resetAt) {
      if (entry.attempts >= maxAttempts) {
        const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
        return NextResponse.json(
          { error: `Demasiados intentos. Por favor, inténtalo de nuevo en ${minutesLeft} minutos.` },
          { status: 429 }
        );
      }
      entry.attempts++;
    } else {
      waitlistRateLimits.set(ip, { attempts: 1, resetAt: now + windowMs });
    }

    // 2. Parsear y validar cuerpo de petición
    const body = await req.json();
    const { email, name, consentMarketing } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es obligatorio.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Formato de correo electrónico inválido.' },
        { status: 400 }
      );
    }

    // 3. Comprobar existencia del Drop
    const drop = await db.drop.findUnique({
      where: { slug: cleanSlug },
    });

    if (!drop) {
      return NextResponse.json(
        { error: 'El lanzamiento (Drop) especificado no existe.' },
        { status: 404 }
      );
    }

    // 4. Validar que el Drop permite lista de espera (COMING_SOON o DRAFT)
    const allowedStatuses = ['COMING_SOON', 'DRAFT'];
    if (!allowedStatuses.includes(drop.status)) {
      return NextResponse.json(
        { error: 'Este lanzamiento ya no admite registros en la lista de espera.' },
        { status: 400 }
      );
    }

    // 5. Hashear IP y User Agent para la privacidad
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ipHash = sha256(ip);
    const userAgentHash = sha256(userAgent);

    // 6. Evitar duplicados
    const existing = await db.dropWaitlist.findUnique({
      where: {
        dropId_email: {
          dropId: drop.id,
          email: cleanEmail,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        message: 'Ya estabas registrado en la lista de espera de este lanzamiento. ¡Te notificaremos!',
      });
    }

    // 7. Guardar registro en Neon PostgreSQL
    const waitlistEntry = await db.dropWaitlist.create({
      data: {
        dropId: drop.id,
        email: cleanEmail,
        name: name ? name.trim() : null,
        origin: 'web',
        status: 'registered',
        ipHash,
        userAgentHash,
      },
    });

    // Registrar consentimiento de marketing si se especificó el checkbox
    if (typeof consentMarketing === 'boolean') {
      await saveCustomerConsent({
        email: cleanEmail,
        consentType: 'marketing',
        accepted: consentMarketing,
        ipAddress: ip,
        userAgent,
        legalTextVersion: 'v1.0'
      });
    }

    console.log(`✉️ [Waitlist API] Nuevo registro en lista de espera para el Drop "${drop.name}": ${cleanEmail}`);

    // 8. Disparar evento de registro en waitlist en el Event Engine de forma asíncrona sin bloquear la respuesta
    dispatchEvent('WAITLIST_REGISTERED', {
      waitlistId: waitlistEntry.id,
      email: cleanEmail,
      dropName: drop.name
    }).catch(err => console.error('⚠️ [Event Engine] Error al despachar WAITLIST_REGISTERED en webhook waitlist:', err));

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      message: 'Te has registrado con éxito. Te enviaremos un correo cuando el lanzamiento esté activo.',
    });
  } catch (error) {
    console.error('❌ [API Drops Waitlist] Error crítico:', error);
    return NextResponse.json(
      { error: 'Error del servidor.', message: (error as Error).message },
      { status: 500 }
    );
  }
}
