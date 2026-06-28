'use client';

import { useState, useEffect } from 'react';
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
  Layers,
  Activity,
  Mail,
  Calendar,
  Ticket,
  Cpu,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';

const menuGroups = [
  {
    name: 'Comercio',
    key: 'comercio',
    items: [
      { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
      { href: '/admin/products', label: 'Productos', icon: Shirt },
      { href: '/admin/drops', label: 'Drops', icon: Calendar },
      { href: '/admin/discounts', label: 'Cupones', icon: Ticket },
      { href: '/admin/finance', label: 'Finanzas', icon: DollarSign },
    ]
  },
  {
    name: 'Clientes',
    key: 'clientes',
    items: [
      { href: '/admin/customers', label: 'Clientes', icon: Users },
      { href: '/admin/support', label: 'Soporte', icon: MessageSquare },
      { href: '/admin/comunicaciones', label: 'Comunicaciones', icon: Mail },
    ]
  },
  {
    name: 'Marketing',
    key: 'marketing',
    items: [
      { href: '/admin/analytics', label: 'Analíticas', icon: TrendingUp },
      { href: '/admin/marketing', label: 'Campañas', icon: Megaphone },
      { href: '/admin/automations', label: 'Automatizaciones', icon: Cpu },
      { href: '/admin/ai', label: 'IA Interna', icon: Brain },
    ]
  },
  {
    name: 'Empresa',
    key: 'empresa',
    items: [
      { href: '/admin/settings', label: 'Configuración', icon: Settings },
      { href: '/admin/settings/integrations', label: 'Integraciones', icon: Layers },
    ]
  },
  {
    name: 'Sistema',
    key: 'sistema',
    items: [
      { href: '/admin/monitoring', label: 'Health Center', icon: Activity },
      { href: '/admin/printful', label: 'Printful Status', icon: Layers },
    ]
  },
  {
    name: 'Seguridad',
    key: 'seguridad',
    items: [
      { href: '/admin/security', label: 'Seguridad', icon: Shield },
      { href: '/admin/logs', label: 'Auditoría', icon: FileText },
    ]
  }
];

const favoriteLabelMap: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'Pedidos',
  '/admin/products': 'Productos',
  '/admin/drops': 'Drops',
  '/admin/discounts': 'Cupones',
  '/admin/finance': 'Finanzas',
  '/admin/customers': 'Clientes',
  '/admin/support': 'Soporte',
  '/admin/comunicaciones': 'Comunicaciones',
  '/admin/analytics': 'Analíticas',
  '/admin/marketing': 'Campañas',
  '/admin/automations': 'Automatizaciones',
  '/admin/ai': 'IA Interna',
  '/admin/settings': 'Configuración',
  '/admin/settings/integrations': 'Integraciones',
  '/admin/printful': 'Printful Status',
  '/admin/monitoring': 'Health Center',
  '/admin/security': 'Seguridad',
  '/admin/logs': 'Auditoría',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    comercio: true,
    clientes: true,
    marketing: true,
    empresa: true,
    sistema: true,
    seguridad: true,
  });

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const compactSaved = localStorage.getItem('alpha_sidebar_compact');
      if (compactSaved) {
        setIsCompact(compactSaved === 'true');
      }

      const groupsSaved = localStorage.getItem('alpha_sidebar_groups');
      if (groupsSaved) {
        try {
          setOpenGroups(JSON.parse(groupsSaved));
        } catch (_) {}
      }

      const favSaved = localStorage.getItem('alpha_favorites');
      if (favSaved) {
        try {
          setFavorites(JSON.parse(favSaved));
        } catch (_) {}
      }
    }
  }, []);

  // Escuchar actualizaciones de favoritos en tiempo real
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      const favSaved = localStorage.getItem('alpha_favorites');
      if (favSaved) {
        try {
          setFavorites(JSON.parse(favSaved));
        } catch (_) {}
      } else {
        setFavorites([]);
      }
    };

    window.addEventListener('alpha-favorites-updated', handleFavoritesUpdate);
    return () => {
      window.removeEventListener('alpha-favorites-updated', handleFavoritesUpdate);
    };
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const toggleCompact = () => {
    const newVal = !isCompact;
    setIsCompact(newVal);
    localStorage.setItem('alpha_sidebar_compact', String(newVal));
  };

  const toggleGroup = (groupKey: string) => {
    const newGroups = { ...openGroups, [groupKey]: !openGroups[groupKey] };
    setOpenGroups(newGroups);
    localStorage.setItem('alpha_sidebar_groups', JSON.stringify(newGroups));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('❌ Error al cerrar sesión en el servidor:', error);
    }
    document.cookie = 'alpha_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict';
    router.push('/admin/login');
  };

  const getIconForPath = (path: string) => {
    if (path === '/admin/dashboard') return LayoutDashboard;
    for (const group of menuGroups) {
      const item = group.items.find(i => i.href === path);
      if (item) return item.icon;
    }
    return Star;
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

      {/* Overlay de Fondo para Móviles */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 bg-[#121212] border-r border-white/5 flex flex-col justify-between
          transition-all duration-300 lg:translate-x-0 lg:static lg:h-screen lg:flex-shrink-0
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCompact ? 'lg:w-20 w-64 px-3' : 'w-64 p-6'}
        `}
      >
        <div className="space-y-6 flex flex-col h-full overflow-hidden">
          {/* Logo del Panel */}
          <div className={`flex items-center gap-3 border-b border-white/5 pb-4 mt-2 ${isCompact ? 'lg:justify-center lg:px-0 px-3' : ''}`}>
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] p-1.5 rounded flex-shrink-0">
              <Lock className="w-4 h-4" />
            </span>
            {!isCompact && (
              <div className="flex flex-col">
                <span className="font-serif text-sm tracking-[0.25em] font-bold text-[#f5f5f0]">
                  ALPHA
                </span>
                <span className="text-[9px] tracking-[0.1em] text-[var(--muted)] font-medium uppercase mt-0.5">
                  Control Center
                </span>
              </div>
            )}
            {/* Toggle compact en desktop */}
            {!isCompact && (
              <button
                onClick={toggleCompact}
                className="hidden lg:flex ml-auto p-1 text-[var(--muted)] hover:text-white border border-white/5 hover:bg-white/5 transition-colors cursor-pointer animate-in fade-in"
                title="Colapsar menú"
                aria-label="Colapsar menú"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Menú de Navegación */}
          <nav className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {/* 📊 Dashboard */}
            <div className="space-y-1">
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 text-[10px] tracking-wider uppercase font-medium transition-all duration-200
                  ${isCompact ? 'lg:justify-center' : ''}
                  ${
                    pathname === '/admin/dashboard'
                      ? 'bg-[var(--primary)] text-black font-semibold'
                      : 'text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5'
                  }
                `}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                {!isCompact && <span>Dashboard</span>}
                {isCompact && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-[#161616] border border-white/10 text-white text-[9px] uppercase tracking-wider font-semibold rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    Dashboard
                  </div>
                )}
              </Link>
            </div>

            {/* ⭐ Favoritos */}
            {favorites.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-white/5">
                {!isCompact ? (
                  <div className="px-3 text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-[var(--primary)]" />
                    <span>Favoritos</span>
                  </div>
                ) : (
                  <div className="w-full h-px bg-white/5 my-2" />
                )}
                {favorites.map(favPath => {
                  const FavIcon = getIconForPath(favPath);
                  const label = favoriteLabelMap[favPath] || 'Página';
                  const isActive = pathname === favPath;
                  return (
                    <Link
                      key={favPath}
                      href={favPath}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2 text-[10px] tracking-wider uppercase font-medium transition-all duration-200
                        ${isCompact ? 'lg:justify-center' : ''}
                        ${
                          isActive
                            ? 'bg-white/10 text-[var(--primary)] font-semibold border-l border-[var(--primary)]'
                            : 'text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5'
                        }
                      `}
                    >
                      <FavIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      {!isCompact && <span>{label}</span>}
                      <div className="absolute left-full ml-3 px-2 py-1 bg-[#161616] border border-white/10 text-white text-[9px] uppercase tracking-wider font-semibold rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Grupos del Menú */}
            {menuGroups.map(group => {
              const isGroupOpen = openGroups[group.key];
              return (
                <div key={group.key} className="space-y-1 pt-1.5 border-t border-white/5">
                  {/* Cabecera del Grupo */}
                  {!isCompact ? (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] hover:text-[#f5f5f0] transition-colors cursor-pointer"
                    >
                      <span>{group.name}</span>
                      {isGroupOpen ? (
                        <ChevronDown className="w-3 h-3 text-[var(--muted)]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-[var(--muted)]" />
                      )}
                    </button>
                  ) : (
                    <div className="w-full h-px bg-white/5 my-2" />
                  )}

                  {/* Elementos del Grupo */}
                  {(isGroupOpen || isCompact) && (
                    <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`
                              group relative flex items-center gap-3 px-3 py-2 text-[10px] tracking-wider uppercase font-medium transition-all duration-200
                              ${isCompact ? 'lg:justify-center' : ''}
                              ${
                                isActive
                                  ? 'text-[var(--primary)] bg-white/5 border-r-2 border-[var(--primary)] font-semibold'
                                  : 'text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5'
                              }
                            `}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            {!isCompact && <span>{item.label}</span>}
                            <div className="absolute left-full ml-3 px-2 py-1 bg-[#161616] border border-white/10 text-white text-[9px] uppercase tracking-wider font-semibold rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                              {item.label}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sección de salida del admin */}
        <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
          {/* Botón para expandir menú si está compacto */}
          {isCompact && (
            <button
              onClick={toggleCompact}
              className="hidden lg:flex items-center justify-center p-2 text-[var(--muted)] hover:text-white border border-white/10 hover:bg-white/5 transition-colors cursor-pointer w-full"
              title="Expandir menú"
              aria-label="Expandir menú"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2.5 py-3 bg-transparent border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 transition-all uppercase tracking-widest text-[9px] font-semibold cursor-pointer ${
              isCompact ? 'lg:p-2 lg:text-[0px] lg:gap-0' : 'w-full'
            }`}
            title="Salir del Panel"
          >
            <X className="w-3.5 h-3.5 flex-shrink-0" />
            {(!isCompact || typeof window !== 'undefined' && window.innerWidth < 1024) && <span>Salir</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
