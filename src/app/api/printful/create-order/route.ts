import { NextResponse } from 'next/server';
import { db } from '@/backend/database/db';
import { createPrintfulOrderFromInternalOrder } from '@/backend/api/printful';

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'El ID del pedido es obligatorio.' }, { status: 400 });
    }

    try {
      // 1. Intentar crear el pedido en Printful
      const printfulRes = await createPrintfulOrderFromInternalOrder(orderId);
      const printfulOrderId = printfulRes.result.id;

      // 2. Actualizar el pedido en Neon a 'printful_submitted' y guardar printfulOrderId
      await db.order.update({
        where: { id: orderId },
        data: {
          printfulOrderId,
          orderStatus: 'printful_submitted',
          events: {
            create: {
              type: 'FULFILLMENT_SUBMITTED',
              message: `Pedido enviado a Printful con ID #${printfulOrderId}`,
            },
          },
        },
      });

      console.log(`✅ Order ${orderId} successfully submitted to Printful. Printful ID: ${printfulOrderId}`);

      return NextResponse.json({
        success: true,
        orderId,
        printfulOrderId,
        status: 'printful_submitted',
      });
    } catch (printfulError: any) {
      const errMsg = printfulError instanceof Error ? printfulError.message : String(printfulError);
      console.error(`❌ Falló la sincronización con Printful para el pedido ${orderId}:`, errMsg);

      // Registrar el error en Neon PostgreSQL como un evento del pedido
      await db.orderEvent.create({
        data: {
          orderId,
          type: 'ERROR',
          message: `Error al enviar a Printful: ${errMsg}`,
        },
      });

      return NextResponse.json(
        { error: 'Error en la integración de Printful.', details: errMsg },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error en el endpoint de envío a Printful:', error);
    return NextResponse.json(
      { error: 'Error interno de servidor.', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
