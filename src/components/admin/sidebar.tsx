'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Users,
  TrendingUp,
  Megaphone,
  DollarSign,
  Brain,
  Shield,
  FileText,
  Settings,
  Menu,
  X,
  Lock,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/products', label: 'Productos', icon: Shirt },
  { href: '/admin/customers', label: 'Clientes', icon: Users },
  { href: '/admin/analytics', label: 'Analíticas', icon: TrendingUp },
  { href: '/admin/finance', label: 'Finanzas', icon: DollarSign },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/ai', label: 'IA Interna', icon: Brain },
  { href: '/admin/security', label: 'Seguridad', icon: Shield },
  { href: '/admin/logs', label: 'Auditoría', icon: FileText },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    document.cookie = 'alpha_session=; path=/admin; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict';
    router.push('/admin/login');
  };

  return (
    <>
      {/* Botón de Hamburguesa para Móviles */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#121212] border border-white/10 rounded text-[#f5f5f0] hover:text-[var(--primary)] transition-colors shadow-lg"
        aria-label="Abrir menú de administración"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay de Fondo para Móviles cuando el Sidebar está abierto */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#121212] border-r border-white/5 p-6 flex flex-col justify-between
          transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="space-y-8">
          {/* Logo del Panel */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-6">
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] p-1.5 rounded">
              <Lock className="w-4 h-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-sm tracking-[0.25em] font-bold text-[#f5f5f0]">
                ALPHA
              </span>
              <span className="text-[9px] tracking-[0.1em] text-[var(--muted)] font-medium uppercase mt-0.5">
                Control Center
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] pr-2 custom-scrollbar">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 text-xs tracking-wider uppercase font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-[var(--primary)] text-black font-semibold'
                        : 'text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sección de salida del admin / volver a la web pública */}
        <div className="border-t border-white/5 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-transparent border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 transition-colors uppercase tracking-widest text-[10px] font-semibold cursor-pointer"
          >
            <span>Salir del Panel</span>
          </button>
        </div>
      </aside>
    </>
  );
}
