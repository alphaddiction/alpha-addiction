import { db } from '@/backend/database/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso Legal',
  description: 'Términos y condiciones de uso y aviso legal de la tienda online Alpha Addiction.',
  alternates: {
    canonical: '/legal/aviso-legal',
  },
};

export default async function LegalNoticePage() {
  const records = await db.systemSetting.findMany({
    where: {
      key: { in: [
        'company_name',
        'company_social',
        'company_nif',
        'company_address',
        'company_postcode',
        'company_city',
        'company_state',
        'company_email_legal',
        'legal_aviso_legal'
      ] }
    }
  });

  const settings = records.reduce((acc, r) => {
    acc[r.key] = r.value;
    return acc;
  }, {} as Record<string, string>);

  const name = settings.company_name || 'Alpha Addiction';
  const social = settings.company_social;
  const nif = settings.company_nif;
  const address = settings.company_address;
  const postcode = settings.company_postcode;
  const city = settings.company_city;
  const state = settings.company_state;
  const email = settings.company_email_legal || 'staff.alphaddiction@gmail.com';
  const avisoLegalText = settings.legal_aviso_legal;

  return (
    <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto text-[var(--foreground)] space-y-6">
      <h1 className="text-3xl font-serif font-bold tracking-tight">Aviso Legal</h1>
      <p className="text-xs text-[var(--muted)] font-mono">Última actualización: Junio 2026</p>
      
      <section className="space-y-3">
        <h2 className="text-lg font-serif font-semibold">1. Datos Identificativos</h2>
        <p className="text-sm font-light leading-relaxed text-[var(--muted)]">
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se exponen los siguientes datos de la entidad responsable de este sitio web:
        </p>
        <div className="bg-white/[0.01] border border-white/5 p-5 text-xs font-mono space-y-2 leading-relaxed text-[var(--muted)]">
          <div>Nombre Comercial: <span className="text-[#f5f5f0]">{name}</span></div>
          {social && <div>Razón Social: <span className="text-[#f5f5f0]">{social}</span></div>}
          {nif && <div>NIF / CIF: <span className="text-[#f5f5f0]">{nif}</span></div>}
          {address && (
            <div>Dirección Fiscal: <span className="text-[#f5f5f0]">{address}{postcode ? `, ${postcode}` : ''}{city ? ` ${city}` : ''}{state ? ` (${state})` : ''}</span></div>
          )}
          <div>Email de Contacto: <span className="text-[#f5f5f0]">{email}</span></div>
        </div>
      </section>

      {avisoLegalText && (
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-semibold">2. Condiciones Generales y Responsabilidades</h2>
          <div className="text-sm font-light leading-relaxed whitespace-pre-wrap text-[var(--muted)]">
            {avisoLegalText}
          </div>
        </section>
      )}
    </div>
  );
}
