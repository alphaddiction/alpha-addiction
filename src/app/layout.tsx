import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import ConditionalLayout from '@/components/layout/conditional-layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'AlphaAddiction | Genesis Drop 01',
  description: 'Edición limitada de moda minimalista.',
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
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </CartProvider>
      </body>
    </html>
  );
}
