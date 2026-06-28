import { EventHandler } from '../types';
import { db } from '../../db';

export const handleDropComingSoon: EventHandler<'DROP_COMING_SOON'> = async ({ dropId }) => {
  const drop = await db.drop.update({
    where: { id: dropId },
    data: { status: 'COMING_SOON' }
  });
  return { success: true, message: `Drop ${drop.name} configurado como Coming Soon.` };
};
