import { db } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Tratamiento, conservación y derechos de protección de datos personales en Alpha Addiction.',
  alternates: {
    canonical: '/legal/privacidad',
  },
};

export default async function PrivacyPage() {
  const records = await db.systemSetting.findMany({
    where: {
      key: { in: [
        'company_name',
        'legal_rgpd_responsible',
        'legal_treatment_responsible',
        'company_email_legal',
        'legal_policy_privacy'
      ] }
    }
  });

  const settings = records.reduce((acc, r) => {
    acc[r.key] = r.value;
    return acc;
  }, {} as Record<string, string>);

  const name = settings.company_name || 'Alpha Addiction';
  const rgpd = settings.legal_rgpd_responsible;
  const treatment = settings.legal_treatment_responsible;
  const email = settings.company_email_legal || 'privacy@alphaddiction.com';
  const privacyText = settings.legal_policy_privacy;

  return (
    <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto text-[var(--foreground)] space-y-6">
      <h1 className="text-3xl font-serif font-bold tracking-tight">Política de Privacidad</h1>
      <p className="text-xs text-[var(--muted)] font-mono">Última actualización: Junio 2026</p>
      
      <section className="space-y-3">
        <h2 className="text-lg font-serif font-semibold">1. Tratamiento de Datos Personales</h2>
        <p className="text-sm font-light leading-relaxed text-[var(--muted)]">
          En <strong>{name}</strong> respetamos tu privacidad y cumplimos estrictamente con el Reglamento General de Protección de Datos (RGPD) y la LOPDGDD. Recopilamos datos únicamente para procesar tus pedidos o notificarte los nuevos drops si te unes de forma voluntaria.
        </p>
      </section>

      {(rgpd || treatment) && (
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-semibold">2. Responsables del Tratamiento</h2>
          <div className="bg-white/[0.01] border border-white/5 p-4 text-xs font-mono space-y-1 text-[var(--muted)] leading-relaxed">
            {treatment && <div>Entidad del Tratamiento: <span className="text-[#f5f5f0]">{treatment}</span></div>}
            {rgpd && <div>Delegado de Protección de Datos (DPO): <span className="text-[#f5f5f0]">{rgpd}</span></div>}
            <div>Contacto Legal: <span className="text-[#f5f5f0]">{email}</span></div>
          </div>
        </section>
      )}

      {privacyText ? (
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-semibold">3. Cláusulas Adicionales</h2>
          <div className="text-sm font-light leading-relaxed whitespace-pre-wrap text-[var(--muted)]">
            {privacyText}
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold">3. Lista de Espera de Drops (Lanzamientos)</h2>
            <p className="text-sm font-light leading-relaxed text-[var(--muted)]">
              Al unirte voluntariamente a la lista de espera de un Drop en estado de preventa o próximamente, recogemos tu dirección de correo electrónico (y opcionalmente tu nombre) con el único fin de enviarte notificaciones transaccionales de aviso cuando el lanzamiento esté activo.
            </p>
            <p className="text-sm font-light leading-relaxed text-[var(--muted)]">
              Para prevenir fraudes en el formulario, ataques de denegación de servicio o registros duplicados masivos, registramos en nuestra base de datos únicamente una firma criptográfica hasheada (SHA-256) de tu dirección IP y de la información de tu navegador (User-Agent). De este modo, protegemos tu identidad al no almacenar tu dirección de red ni tus firmas en crudo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold">4. Conservación y Derechos de los Usuarios</h2>
            <p className="text-sm font-light leading-relaxed text-[var(--muted)]">
              Conservamos tus datos el tiempo mínimo imprescindible según la legislación fiscal y la duración de los lanzamientos. Puedes ejercer tus derechos de acceso, rectificación, supresión y oposición escribiendo a <span className="font-mono text-[#f5f5f0]">{email}</span>.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
