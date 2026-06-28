import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/orders';
import { verifySessionToken } from '@/lib/auth-tokens';
import { logAuditEvent } from '@/lib/auth-node';
import { cookies } from 'next/headers';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * GET /api/orders/[id]
 * 
 * Recupera un único pedido por su identificador interno de la base de datos de Neon.
 * Requiere sesión de administrador.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: `Pedido ${id} no encontrado en Neon.` }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('❌ Error in GET /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * 
 * Actualiza propiedades de un pedido en Neon (ej: estado, tracking, notas internas)
 * y registra automáticamente un evento en el historial en la base de datos.
 * Requiere sesión de administrador y audita cambios manuales de pago.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: `Pedido ${id} no encontrado en Neon.` }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // 1. Auditoría: Cambio manual de estado de pago
    if (body.paymentStatus && body.paymentStatus !== order.paymentStatus) {
      await logAuditEvent(
        verified.sessionId,
        'ORDER_PAYMENT_MANUAL_UPDATE',
        `Estado de pago de pedido ${order.orderNumber} cambiado manualmente de "${order.paymentStatus}" a "${body.paymentStatus}". Notas: ${body.notes || ''}`,
        ip,
        userAgent
      );
    }

    // 2. Auditoría: Cambio de estado de pedido general
    if (body.status && body.status !== order.status) {
      await logAuditEvent(
        verified.sessionId,
        'ORDER_STATUS_MANUAL_UPDATE',
        `Estado del pedido ${order.orderNumber} cambiado manualmente de "${order.status}" a "${body.status}". Notas: ${body.notes || ''}`,
        ip,
        userAgent
      );
    }

    // Registrar evento de cambio de estado o nota en la tabla OrderEvent de Neon
    if (body.status && body.status !== order.status) {
      await db.orderEvent.create({
        data: {
          orderId: id,
          type: 'STATUS_CHANGED',
          message: `Estado cambiado a: ${body.status}. ${body.notes || 'Actualización realizada desde la administración del OMS.'}`,
          createdAt: new Date(),
        }
      });
    } else if (body.notes) {
      await db.orderEvent.create({
        data: {
          orderId: id,
          type: 'NOTE_ADDED',
          message: `Nota interna agregada: ${body.notes}`,
          createdAt: new Date(),
        }
      });
    }

    // Excluir 'notes' de las actualizaciones directas de la cabecera del pedido
    const { notes, ...updates } = body;

    const updatedOrder = await updateOrder(id, updates);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('❌ Error in PATCH /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]
 * 
 * Elimina físicamente un pedido de la base de datos de Neon.
 * Requiere sesión de administrador y audita la eliminación.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: `Pedido ${id} no encontrado en Neon.` }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const success = await deleteOrder(id);

    if (!success) {
      return NextResponse.json({ error: `Fallo al eliminar pedido ${id} de Neon.` }, { status: 404 });
    }

    // Registrar auditoría de eliminación
    await logAuditEvent(
      verified.sessionId,
      'ORDER_DELETED',
      `Pedido #${order.orderNumber} (Neon ID: ${id}) eliminado permanentemente por administración.`,
      ip,
      userAgent
    );

    return NextResponse.json({ success: true, message: `Pedido ${id} eliminado con éxito.` });
  } catch (error) {
    console.error('❌ Error in DELETE /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
