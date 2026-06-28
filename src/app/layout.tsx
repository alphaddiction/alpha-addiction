import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import ConditionalLayout from '@/components/layout/conditional-layout';
import Analytics from '@/components/layout/analytics';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com'),
  title: {
    default: 'Alpha Addiction | Moda Minimalista de Edición Limitada',
    template: '%s | Alpha Addiction',
  },
  description: 'Colecciones exclusivas y numeradas de moda urbana y lujo silencioso. Cada drop es único.',
  alternates: {
    canonical: './',
  },
  openGraph: {
    title: 'Alpha Addiction | Moda Minimalista de Edición Limitada',
    description: 'Colecciones exclusivas y numeradas de moda urbana y lujo silencioso. Cada drop es único.',
    url: './',
    siteName: 'Alpha Addiction',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Addiction | Moda Minimalista de Edición Limitada',
    description: 'Colecciones exclusivas y numeradas de moda urbana y lujo silencioso. Cada drop es único.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      {/* 
          TEXTURE CONTROL: 
          data-texture="on" -> Activa el overlay (ahora CSS body background)
          data-texture="off" -> Fondo plano limpio
       */}
      <body data-texture="on" className="min-h-screen flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
        <CartProvider>
          <Analytics />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </CartProvider>
      </body>
    </html>
  );
}
