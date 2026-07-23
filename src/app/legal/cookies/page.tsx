import { db } from '@/backend/database/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Información sobre el uso de cookies esenciales y analíticas en la plataforma Alpha Addiction.',
  alternates: {
    canonical: '/legal/cookies',
  },
};

export default async function CookiesPage() {
  const records = await db.systemSetting.findMany({
    where: {
      key: { in: ['company_name', 'legal_policy_cookies'] }
    }
  });

  const settings = records.reduce((acc, r) => {
    acc[r.key] = r.value;
    return acc;
  }, {} as Record<string, string>);

  const name = settings.company_name || 'Alpha Addiction';
  const cookiesText = settings.legal_policy_cookies;

  return (
    <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto text-[var(--foreground)] space-y-6">
      <h1 className="text-3xl font-serif font-bold tracking-tight">Política de Cookies</h1>
      <p className="text-xs text-[var(--muted)] font-mono">Última actualización: Junio 2026</p>
      
      <section className="space-y-3">
        <h2 className="text-lg font-serif font-semibold">1. Uso de Cookies</h2>
        <p className="text-sm font-light leading-relaxed text-[var(--muted)]">
          En la plataforma de <strong>{name}</strong> utilizamos cookies esenciales con el fin de garantizar el correcto funcionamiento del sitio web (guardar el carrito de compras, recordar sesiones seguras de portal y evitar ataques CSRF).
        </p>
      </section>

      {cookiesText ? (
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-semibold">2. Declaración Detallada de Cookies</h2>
          <div className="text-sm font-light leading-relaxed whitespace-pre-wrap text-[var(--muted)]">
            {cookiesText}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-semibold">2. Cookies Esenciales Utilizadas</h2>
          <ul className="list-disc pl-5 text-sm font-light text-[var(--muted)] space-y-2">
            <li><strong>alpha_session</strong>: Almacena la sesión cifrada del panel de control de administración.</li>
            <li><strong>client_portal_session</strong>: Token HMAC firmado para dar acceso seguro al Portal Inteligente de Clientes.</li>
            <li><strong>cart_id</strong>: Identificador temporal de la selección de artículos en tu carrito de compra.</li>
          </ul>
        </section>
      )}
    </div>
  );
}
