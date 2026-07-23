import { EventHandler } from '@/backend/events/types';
import { db } from '@/backend/database/db';

export const handleDropComingSoon: EventHandler<'DROP_COMING_SOON'> = async ({ dropId }) => {
  const drop = await db.drop.update({
    where: { id: dropId },
    data: { status: 'COMING_SOON' }
  });
  return { success: true, message: `Drop ${drop.name} configurado como Coming Soon.` };
};
