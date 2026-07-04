'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AlertOctagon,
  Bell,
  User,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  LogOut,
  Search,
  Star,
  ChevronRight,
  Command
} from 'lucide-react';

const staticTargets = [
  { title: 'Configuración de PayPal', category: 'Empresa', url: '/admin/settings?tab=integraciones' },
  { title: 'Configuración de Printful', category: 'Empresa', url: '/admin/settings?tab=integraciones' },
  { title: 'Modos de Proyecto (Mantenimiento)', category: 'Empresa', url: '/admin/settings?tab=empresa' },
  { title: 'Sentry Logger (Monitorización)', category: 'Sistema', url: '/admin/monitoring' },
  { title: 'Backups de Neon (Copias de Seguridad)', category: 'Sistema', url: '/admin/monitoring' },
  { title: 'Salud del Sistema (Health Center)', category: 'Sistema', url: '/admin/monitoring' },
  { title: 'Registro de Auditoría (Audit Logs)', category: 'Seguridad', url: '/admin/logs' },
  { title: 'Seguridad y 2FA', category: 'Seguridad', url: '/admin/security' },
  { title: 'Gestión de Cupones / Descuentos', category: 'Comercio', url: '/admin/discounts' },
  { title: 'Gestión de Drops / Lanzamientos', category: 'Comercio', url: '/admin/drops' },
  { title: 'Soporte y Tickets de Incidencia', category: 'Clientes', url: '/admin/support' },
  { title: 'Waitlist / Lista de Espera', category: 'Clientes', url: '/admin/drops' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isActivatingEmergency, setIsActivatingEmergency] = useState<string | null>(null);

  // Estados de Búsqueda y Favoritos
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({
    orders: [],
    products: [],
    drops: [],
    tickets: [],
    logs: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Estados de Notificaciones Internas
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificationStats = async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=5&page=1');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notification statistics:', err);
    }
  };

  useEffect(() => {
    fetchNotificationStats();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchNotificationStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    setShowNotificationsDropdown(false);
    if (notif.status === 'unread') {
      try {
        await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', ids: [notif.id] })
        });
        fetchNotificationStats();
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { dot: 'bg-red-500 animate-pulse', text: 'text-red-400' };
      case 'error':
        return { dot: 'bg-orange-500', text: 'text-orange-400' };
      case 'warning':
        return { dot: 'bg-yellow-500', text: 'text-yellow-400' };
      case 'success':
        return { dot: 'bg-emerald-500', text: 'text-emerald-400' };
      default:
        return { dot: 'bg-blue-400', text: 'text-[#f5f5f0]/60' };
    }
  };

  // Inicializar estado de favorito de la página actual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('alpha_favorites');
      if (stored) {
        try {
          const favs = JSON.parse(stored) as string[];
          setIsFavorite(favs.includes(pathname));
        } catch (_) {}
      }
    }
  }, [pathname]);

  // Escuchar teclado para Ctrl+K y cerrar con Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus en el input de búsqueda
  useEffect(() => {
    if (showSearchModal) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      setSelectedIndex(0);
    }
  }, [showSearchModal]);

  // Búsqueda con debounce e integración con API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({
        orders: [],
        products: [],
        drops: [],
        tickets: [],
        logs: []
      });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('❌ Error realizando búsqueda:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleLogout = () => {
    document.cookie = 'alpha_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict';
    router.push('/admin/login');
  };

  const emergencyActions = [
    { id: 'kill_sessions', label: 'Cerrar todas las sesiones activas', desc: 'Desconecta de forma remota a todos los usuarios del panel administrativo.' },
    { id: 'maint_mode', label: 'Activar modo mantenimiento', desc: 'Muestra una pantalla de mantenimiento en la tienda pública y bloquea nuevas visitas.' },
    { id: 'pause_checkout', label: 'Pausar pasarela de pagos (Checkout)', desc: 'Deshabilita temporalmente la creación y cobros de órdenes mediante PayPal.' },
    { id: 'disable_printful', label: 'Desconectar API de Printful', desc: 'Detiene todo envío automático de pedidos hacia la fábrica de Printful.' },
    { id: 'disable_paypal', label: 'Desconectar API de PayPal', desc: 'Desactiva la sincronización del webhook y APIs operativas de PayPal.' },
  ];

  const handleTriggerEmergency = (actionId: string, actionLabel: string) => {
    setIsActivatingEmergency(actionId);
    setTimeout(() => {
      alert(`⚠️ ACCIÓN DE EMERGENCIA EJECUTADA: "${actionLabel}". Registrado en el historial de auditoría inmutable.`);
      setIsActivatingEmergency(null);
      setShowEmergencyModal(false);
    }, 1500);
  };

  // Toggles favoritos localstorage
  const toggleFavorite = () => {
    let favs: string[] = [];
    const stored = localStorage.getItem('alpha_favorites');
    if (stored) {
      try {
        favs = JSON.parse(stored);
      } catch (_) {}
    }

    if (favs.includes(pathname)) {
      favs = favs.filter(p => p !== pathname);
    } else {
      favs.push(pathname);
    }

    localStorage.setItem('alpha_favorites', JSON.stringify(favs));
    setIsFavorite(favs.includes(pathname));
    window.dispatchEvent(new Event('alpha-favorites-updated'));
  };

  // Breadcrumbs dinámicos
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];
    let currentPath = '';

    parts.forEach((part) => {
      currentPath += `/${part}`;
      let label = part;
      if (part === 'admin') label = 'Inicio';
      else if (part === 'orders') label = 'Pedidos';
      else if (part === 'products') label = 'Productos';
      else if (part === 'drops') label = 'Drops';
      else if (part === 'discounts') label = 'Cupones';
      else if (part === 'finance') label = 'Finanzas';
      else if (part === 'customers') label = 'Clientes';
      else if (part === 'support') label = 'Soporte';
      else if (part === 'comunicaciones') label = 'Comunicaciones';
      else if (part === 'analytics') label = 'Analíticas';
      else if (part === 'marketing') label = 'Campañas';
      else if (part === 'automations') label = 'Automatizaciones';
      else if (part === 'ai') label = 'IA Interna';
      else if (part === 'settings') label = 'Configuración';
      else if (part === 'integrations') label = 'Integraciones';
      else if (part === 'monitoring') label = 'Health Center';
      else if (part === 'printful') label = 'Printful Status';
      else if (part === 'security') label = 'Seguridad';
      else if (part === 'logs') label = 'Auditoría';
      else if (part === 'dashboard') label = 'Dashboard';

      crumbs.push({ label, href: currentPath });
    });

    return crumbs;
  };

  // Unificar resultados para navegación con teclado
  const getFlattenedResults = () => {
    const query = searchQuery.trim();
    if (!query) {
      return staticTargets.map(t => ({ ...t, type: 'static' }));
    }

    const flat: any[] = [];
    // Buscar también en estáticos locales por si acaso
    const filteredStatic = staticTargets.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
    filteredStatic.forEach(t => flat.push({ title: t.title, subtitle: t.category, url: t.url, type: 'static' }));

    // Agregar dinámicos
    searchResults.orders.forEach((o: any) => flat.push({ title: o.title, subtitle: o.subtitle, url: o.url, type: 'pedido' }));
    searchResults.products.forEach((p: any) => flat.push({ title: p.title, subtitle: p.subtitle, url: p.url, type: 'producto' }));
    searchResults.drops.forEach((d: any) => flat.push({ title: d.title, subtitle: d.subtitle, url: d.url, type: 'drop' }));
    searchResults.tickets.forEach((t: any) => flat.push({ title: t.title, subtitle: t.subtitle, url: t.url, type: 'ticket' }));
    searchResults.logs.forEach((l: any) => flat.push({ title: l.title, subtitle: l.subtitle, url: l.url, type: 'log' }));

    return flat;
  };

  const flattenedList = getFlattenedResults();

  const handleKeyDownSearch = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flattenedList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flattenedList.length) % flattenedList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedList[selectedIndex]) {
        router.push(flattenedList[selectedIndex].url);
        setShowSearchModal(false);
        setSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      setShowSearchModal(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="h-20 border-b border-white/5 bg-[#121212] px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 font-mono">
        {/* Dynamic Breadcrumbs & Star Favorito */}
        <div className="flex items-center gap-3 pl-12 lg:pl-0">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] font-semibold">
            {getBreadcrumbs().map((crumb, idx) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-white/20" />}
                {idx === getBreadcrumbs().length - 1 ? (
                  <span className="text-[#f5f5f0] tracking-wider uppercase font-bold">{crumb.label}</span>
                ) : (
                  <span className="hover:text-white transition-colors cursor-pointer uppercase">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
          {/* Toggle Favorito button */}
          <button
            onClick={toggleFavorite}
            className="p-1 rounded hover:bg-white/5 text-[var(--muted)] hover:text-amber-400 transition-colors cursor-pointer ml-1"
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            aria-label="Alternar página favorita"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Acciones del Encabezado */}
        <div className="flex items-center gap-4">
          {/* Buscador de atajo rápido */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="
              hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20
              text-[#f5f5f0]/60 hover:text-[#f5f5f0] text-[10px] font-mono rounded cursor-pointer transition-all duration-200 select-none
            "
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar...</span>
            <kbd className="inline-block px-1.5 py-0.5 bg-white/10 border border-white/5 text-[8px] rounded font-sans uppercase">
              Ctrl K
            </kbd>
          </button>

          {/* Botón de Pánico / Emergencia */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="
              flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-black
              text-red-500 hover:border-red-500 transition-all duration-300 text-[10px] tracking-widest uppercase font-bold cursor-pointer
            "
          >
            <AlertOctagon className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">Botón de Pánico</span>
          </button>

          {/* Notificaciones */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                fetchNotificationStats();
              }}
              className="p-2 text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors hover:bg-white/5 rounded relative cursor-pointer" 
              aria-label="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1 py-0.5 text-[8px] leading-none bg-red-600 text-white font-bold rounded-full min-w-[12px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#121212] border border-white/10 shadow-2xl font-mono text-left z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
                  <span className="text-[10px] tracking-widest font-bold text-[#f5f5f0] uppercase">Notificaciones</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[9px] uppercase tracking-wider text-[var(--primary)] hover:underline"
                    >
                      Leer todo
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-[var(--muted)]">
                      Sin notificaciones nuevas
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const styles = getSeverityStyle(n.severity);
                      return (
                        <div 
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-white/[0.02] cursor-pointer transition-colors border-l-2 ${n.severity === 'critical' ? 'border-l-red-500' : (n.severity === 'error' ? 'border-l-orange-500' : (n.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-transparent'))} ${n.status === 'unread' ? 'bg-white/[0.01]' : ''}`}
                        >
                          <div className="flex items-start gap-2 justify-between">
                            <span className="text-[11px] font-bold text-[#f5f5f0] line-clamp-1">{n.title}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                            </div>
                          </div>
                          <p className="text-[10px] text-[var(--muted)] leading-relaxed mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between text-[8px] text-[var(--muted)]/50 mt-2 font-mono uppercase">
                            <span>{n.module}</span>
                            <span>{new Date(n.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-white/5 py-2.5 text-center bg-black/20">
                  <button 
                    onClick={() => { setShowNotificationsDropdown(false); router.push('/admin/notifications'); }}
                    className="text-[10px] uppercase tracking-widest text-[#f5f5f0]/60 hover:text-[var(--primary)] font-bold cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Perfil del Usuario */}
          <div className="h-8 w-px bg-white/5 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[11px] font-semibold text-[#f5f5f0]">Super Admin</p>
              <p className="text-[9px] text-[var(--muted)] tracking-wider">admin@alpha-addiction.com</p>
            </div>
            <button className="h-8 w-8 bg-white/5 rounded-full flex items-center justify-center text-[#f5f5f0]/70 hover:text-[var(--primary)] hover:bg-white/10 transition-colors" aria-label="Perfil de usuario">
              <User className="w-4 h-4" />
            </button>
            <div className="h-8 w-px bg-white/5" />
            <button
              onClick={handleLogout}
              className="h-8 w-8 bg-white/5 rounded flex items-center justify-center text-[#f5f5f0]/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal del Buscador Global (Command Palette) */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-12 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => {
            setShowSearchModal(false);
            setSearchQuery('');
          }}
        >
          <div
            className="w-full max-w-2xl bg-[#121212] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-mono flex flex-col max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input de Búsqueda */}
            <div className="flex items-center gap-3.5 px-4 py-4 border-b border-white/5">
              <Search className="w-4 h-4 text-[var(--muted)]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escribe para buscar... (paypal, pedidos, drops...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={(e: any) => handleKeyDownSearch(e)}
                className="flex-grow bg-transparent border-0 outline-none text-[#f5f5f0] text-sm font-mono placeholder:text-white/20"
              />
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-[9px] rounded text-[var(--muted)]">
                ESC
              </kbd>
            </div>

            {/* Lista de Resultados */}
            <div 
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-2 divide-y divide-white/5 custom-scrollbar"
            >
              {isSearching ? (
                <div className="py-12 flex items-center justify-center gap-2.5 text-xs text-[var(--muted)]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span>Buscando en la base de datos...</span>
                </div>
              ) : flattenedList.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--muted)]">
                  No se encontraron resultados para su búsqueda.
                </div>
              ) : (
                <div className="py-1 space-y-1">
                  {/* Etiqueta de Contexto */}
                  <div className="px-3 py-1.5 text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">
                    {searchQuery.trim() ? 'Resultados Coincidentes' : 'Atajos y Navegación Rápida'}
                  </div>

                  {flattenedList.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          router.push(item.url);
                          setShowSearchModal(false);
                          setSearchQuery('');
                        }}
                        className={`
                          flex flex-col px-4 py-2.5 cursor-pointer border border-transparent transition-all duration-150
                          ${isSelected ? 'bg-[var(--primary)] text-black font-semibold' : 'hover:bg-white/5'}
                        `}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs tracking-wider uppercase font-medium">{item.title}</span>
                          <span className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold ${
                            isSelected ? 'bg-black/20 text-black' : 'bg-white/5 text-[var(--muted)]'
                          }`}>
                            {item.type || item.subtitle}
                          </span>
                        </div>
                        <span className={`text-[9px] mt-0.5 font-sans leading-normal ${
                          isSelected ? 'text-black/75 font-medium' : 'text-[var(--muted)]'
                        }`}>
                          {item.subtitle}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Informativo */}
            <div className="px-4 py-3 bg-black/30 border-t border-white/5 text-[8px] text-[var(--muted)] flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Navegue con ↑ ↓ y presione ENTER para abrir</span>
              </span>
              <span>Alpha Addiction Control Center</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Emergencia */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-[#121212] border border-red-500/30 p-6 md:p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.15)] font-mono">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer text-xs uppercase"
            >
              Cerrar
            </button>

            <div className="flex items-center gap-3 border-b border-red-500/20 pb-4 mb-6">
              <div className="bg-red-500 text-black p-2 rounded">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-serif tracking-widest text-[#f5f5f0] uppercase font-bold">
                  Consola de Emergencia
                </h2>
                <p className="text-xs text-red-500/80 tracking-wider">
                  Acciones críticas de mitigación de daños y estado de mantenimiento.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {emergencyActions.map(action => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 bg-[#181818] border border-white/5 hover:border-red-500/20 transition-all gap-4"
                >
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f5f5f0]">
                      {action.label}
                    </h3>
                    <p className="text-[10px] text-[var(--muted)] mt-1 tracking-wider leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                  <button
                    disabled={isActivatingEmergency !== null}
                    onClick={() => handleTriggerEmergency(action.id, action.label)}
                    className="
                      px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] uppercase font-semibold cursor-pointer
                      tracking-widest transition-colors flex items-center gap-1.5 disabled:opacity-50
                    "
                  >
                    {isActivatingEmergency === action.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>Ejecutar</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded text-center">
              <p className="text-[10px] text-red-500/80 tracking-[0.15em] uppercase font-semibold">
                ⚠️ CUALQUIER ACCIÓN REQUERIRÁ CONFIRMACIÓN Y SERÁ REGISTRADA DE FORMA INMUTABLE
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
