import { NextResponse } from 'next/server';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/orders';

/**
 * GET /api/orders/[id]
 * 
 * Recupera un único pedido por su identificador interno del OMS.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: `Pedido ${id} no encontrado.` }, { status: 404 });
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
 * Actualiza propiedades de un pedido (ej: estado, tracking, notas internas)
 * y registra automáticamente la acción en el historial de eventos del pedido.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: `Pedido ${id} no encontrado.` }, { status: 404 });
    }

    const history = order.history || [];
    
    // Registrar evento de cambio de estado si se solicita
    if (body.status && body.status !== order.status) {
      history.push({
        timestamp: new Date().toISOString(),
        event: `Estado cambiado: ${body.status}`,
        notes: body.notes || 'Actualización realizada desde la administración del OMS.',
      });
    } else if (body.notes) {
      history.push({
        timestamp: new Date().toISOString(),
        event: 'Nota interna agregada',
        notes: body.notes,
      });
    }

    // Excluir 'notes' de las actualizaciones directas del objeto order
    const { notes, ...updates } = body;

    const updatedOrder = await updateOrder(id, {
      ...updates,
      history,
    });

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
 * Elimina físicamente un pedido del almacén OMS (control de depuración).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteOrder(id);

    if (!success) {
      return NextResponse.json({ error: `Pedido ${id} no encontrado o no pudo borrarse.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Pedido ${id} eliminado con éxito.` });
  } catch (error) {
    console.error('❌ Error in DELETE /api/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
