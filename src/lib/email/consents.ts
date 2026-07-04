import crypto from 'crypto';
import { db } from '../db';

// Función helper para hashear datos con SHA-256 (preservando privacidad)
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value || '').digest('hex');
}

/**
 * Registra un nuevo consentimiento (o su revocación) en el histórico inmutable.
 */
export async function saveCustomerConsent(params: {
  email: string;
  consentType: 'marketing' | 'newsletter';
  accepted: boolean;
  ipAddress: string;
  userAgent: string;
  legalTextVersion?: string;
}) {
  const cleanEmail = params.email.trim().toLowerCase();
  const ipHash = sha256(params.ipAddress || '127.0.0.1');
  const userAgentHash = sha256(params.userAgent || 'unknown');
  const legalTextVersion = params.legalTextVersion || 'v1.0';

  console.log(`🔒 [Consent Service] Registrando consentimiento [${params.consentType}] = ${params.accepted} para ${cleanEmail}`);

  return await db.customerConsent.create({
    data: {
      email: cleanEmail,
      consentType: params.consentType,
      accepted: params.accepted,
      ipHash,
      userAgentHash,
      legalTextVersion,
      createdAt: new Date(),
    },
  });
}

/**
 * Comprueba el estado de consentimiento activo (más reciente) de un email.
 */
export async function checkConsent(email: string, consentType: 'marketing' | 'newsletter'): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  
  const lastConsent = await db.customerConsent.findFirst({
    where: {
      email: cleanEmail,
      consentType,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return lastConsent ? lastConsent.accepted : false;
}
