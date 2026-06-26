'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/sidebar';
import Header from '@/components/admin/header';
// Componente de Cabecera del Panel

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Si estamos en la página de login, evitamos mostrar el Sidebar y el Header de administración.
  if (isLoginPage) {
    return <div className="min-h-screen bg-[#0a0a0a] w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0] flex font-sans antialiased overflow-x-hidden">
      {/* Menú de Navegación Lateral */}
      <Sidebar />

      {/* Área del Contenido del Panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Cabecera superior (Header) */}
        <Header />

        {/* Contenido principal del admin */}
        <main className="flex-grow p-6 md:p-10 bg-[#0d0d0d]">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
