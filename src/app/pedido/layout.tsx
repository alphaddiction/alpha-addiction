import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consultar Pedido | Alpha Addiction',
  description: 'Consulta el estado de fabricación y envío de tu pedido.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PedidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
