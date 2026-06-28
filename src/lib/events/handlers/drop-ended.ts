import { EventHandler } from '../types';
import { db } from '../../db';

export const handleDropEnded: EventHandler<'DROP_ENDED'> = async ({ dropId }) => {
  const drop = await db.drop.update({
    where: { id: dropId },
    data: { status: 'ENDED' }
  });
  return { success: true, message: `Drop ${drop.name} ha finalizado de forma oficial.` };
};
