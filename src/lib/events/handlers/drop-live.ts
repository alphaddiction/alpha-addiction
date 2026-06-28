import { EventHandler } from '../types';
import { db } from '../../db';
import { processWaitlistNotificationsInBatches } from '../helpers';

export const handleDropLive: EventHandler<'DROP_LIVE'> = async ({ dropId }) => {
  const drop = await db.drop.findUnique({
    where: { id: dropId }
  });

  if (!drop) {
    return { success: false, error: 'No se encontró el Drop.' };
  }

  // Asegurar que está en LIVE en la base de datos
  if (drop.status !== 'LIVE') {
    await db.drop.update({
      where: { id: dropId },
      data: { status: 'LIVE' }
    });
  }

  // Procesar el envío de notificaciones en lotes a los inscritos en la waitlist
  const waitlistRes = await processWaitlistNotificationsInBatches(dropId, drop.name, drop.slug);

  return { 
    success: true, 
    message: `Drop ${drop.name} está LIVE. Notificaciones waitlist enviadas: ${waitlistRes.sent}. Errores: ${waitlistRes.errors.length}` 
  };
};
