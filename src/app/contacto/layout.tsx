import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto y Soporte | Alpha Addiction',
  description: 'Ponte en contacto con el equipo de soporte de Alpha Addiction. Resuelve tus dudas, incidencias y consultas sobre tus pedidos.',
  alternates: {
    canonical: '/contacto',
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
