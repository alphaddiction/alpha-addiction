import { NextResponse } from 'next/server';
import { db } from '@/backend/database/db';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/backend/auth/auth-tokens';

export async function GET(req: Request) {
  try {
    // 1. Validar autenticación de administrador
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('alpha_session')?.value;
    const isAdmin = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const marketingFilter = searchParams.get('marketing'); // "accepted", "not_accepted", or null
    const newsletterFilter = searchParams.get('newsletter'); // "accepted", "not_accepted", or null
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // 2. Extraer todos los correos registrados en el sistema
    const orders = await db.order.findMany({
      select: { email: true, name: true, createdAt: true }
    });
    const waitlist = await db.dropWaitlist.findMany({
      select: { email: true, name: true, createdAt: true }
    });
    const tickets = await db.supportTicket.findMany({
      select: { customerEmail: true, customerName: true, createdAt: true }
    });

    // Consolidador en memoria
    const customerMap = new Map<string, {
      email: string;
      name: string;
      ordersCount: number;
      ticketsCount: number;
      waitlistCount: number;
      lastActivity: Date;
    }>();

    const addOrUpdate = (email: string, name: string, date: Date, type: 'order' | 'waitlist' | 'ticket') => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) return;

      const existing = customerMap.get(cleanEmail);
      const cleanName = name?.trim() || '';

      if (existing) {
        if (cleanName && (!existing.name || type === 'order')) {
          existing.name = cleanName; // Preferimos el nombre de la compra
        }
        if (type === 'order') existing.ordersCount++;
        if (type === 'waitlist') existing.waitlistCount++;
        if (type === 'ticket') existing.ticketsCount++;
        if (date > existing.lastActivity) {
          existing.lastActivity = date;
        }
      } else {
        customerMap.set(cleanEmail, {
          email: cleanEmail,
          name: cleanName || cleanEmail.split('@')[0],
          ordersCount: type === 'order' ? 1 : 0,
          waitlistCount: type === 'waitlist' ? 1 : 0,
          ticketsCount: type === 'ticket' ? 1 : 0,
          lastActivity: date,
        });
      }
    };

    orders.forEach(o => addOrUpdate(o.email, o.name, o.createdAt, 'order'));
    waitlist.forEach(w => addOrUpdate(w.email, w.name || '', w.createdAt, 'waitlist'));
    tickets.forEach(t => addOrUpdate(t.customerEmail, t.customerName, t.createdAt, 'ticket'));

    const allCustomers = Array.from(customerMap.values());

    // 3. Consultar los estados de consentimiento
    const emailsList = Array.from(customerMap.keys());
    const consents = await db.customerConsent.findMany({
      where: {
        email: { in: emailsList }
      },
      orderBy: {
        createdAt: 'asc' // Las más antiguas primero para que las últimas machaquen el estado
      }
    });

    const consentMap = new Map<string, { marketing: boolean; newsletter: boolean }>();
    consents.forEach(c => {
      const email = c.email.toLowerCase();
      const existing = consentMap.get(email) || { marketing: false, newsletter: false };
      if (c.consentType === 'marketing') {
        existing.marketing = c.accepted;
      } else if (c.consentType === 'newsletter') {
        existing.newsletter = c.accepted;
      }
      consentMap.set(email, existing);
    });

    // Mapear los consentimientos consolidados
    let filtered = allCustomers.map(c => {
      const emailConsents = consentMap.get(c.email) || { marketing: false, newsletter: false };
      return {
        ...c,
        marketingConsent: emailConsents.marketing,
        newsletterConsent: emailConsents.newsletter,
      };
    });

    // 4. Aplicar Filtros
    if (search) {
      filtered = filtered.filter(
        c => c.email.includes(search) || c.name.toLowerCase().includes(search)
      );
    }

    if (marketingFilter === 'accepted') {
      filtered = filtered.filter(c => c.marketingConsent === true);
    } else if (marketingFilter === 'not_accepted') {
      filtered = filtered.filter(c => c.marketingConsent === false);
    }

    if (newsletterFilter === 'accepted') {
      filtered = filtered.filter(c => c.newsletterConsent === true);
    } else if (newsletterFilter === 'not_accepted') {
      filtered = filtered.filter(c => c.newsletterConsent === false);
    }

    // Ordenar por última actividad
    filtered.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // 5. Paginación
    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      customers: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err: any) {
    console.error('❌ [Customers API] Error al obtener clientes:', err);
    return NextResponse.json({
      success: false,
      error: 'Error al consultar el listado de clientes en Neon DB.',
      message: err.message,
    }, { status: 500 });
  }
}
