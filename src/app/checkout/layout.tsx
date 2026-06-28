import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finalizar Compra | Alpha Addiction',
  description: 'Completa tu pedido de forma segura a través de PayPal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
