'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Activity,
  Clock,
  RefreshCw,
  Terminal,
  Database,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Ticket,
  Users,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  X,
  CreditCard,
  Package,
  Mail,
  Zap,
  Globe,
  SlidersHorizontal,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types/order';

interface WidgetPreference {
  key: string;
  name: string;
  visible: boolean;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'mission' | 'classic'>('mission');
  const [stats, setStats] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estado del buscador global (Command Palette)
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Lista de checklist diario
  const [checklist, setChecklist] = useState<any[]>([
    { id: '1', task: 'Revisar pedidos pendientes de envío', completed: false },
    { id: '2', task: 'Responder tickets de soporte abiertos', completed: false },
    { id: '3', task: 'Comprobar cola de alertas críticas', completed: true },
    { id: '4', task: 'Verificar sincronización de catálogo Printful', completed: false },
    { id: '5', task: 'Supervisar registros de Drops y Waitlist', completed: true }
  ]);

  // Preferencias de widgets (Mission Control)
  const [widgets, setWidgets] = useState<WidgetPreference[]>([
    { key: 'summary', name: 'Resumen Ejecutivo', visible: true },
    { key: 'checklist', name: 'Checklist Diario', visible: true },
    { key: 'alerts', name: 'Alertas del Sistema', visible: true },
    { key: 'financial', name: 'Centro Financiero', visible: true },
    { key: 'nextDrop', name: 'Próximo Drop', visible: true },
    { key: 'integrations', name: 'Estado de Integraciones', visible: true },
    { key: 'performance', name: 'Rendimiento y Conversión', visible: true },
    { key: 'customers', name: 'Resumen de Clientes', visible: true },
    { key: 'timeline', name: 'Actividad Reciente', visible: true },
    { key: 'quickActions', name: 'Accesos Rápidos', visible: true }
  ]);
  const [showConfigurator, setShowConfigurator] = useState(false);

  // Cargar preferencias del administrador
  useEffect(() => {
    const saved = localStorage.getItem('alpha_mission_widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (_) {}
    }

    const savedChecklist = localStorage.getItem('alpha_mission_checklist');
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch (_) {}
    }
  }, []);

  const saveWidgetPrefs = (newPrefs: WidgetPreference[]) => {
    setWidgets(newPrefs);
    localStorage.setItem('alpha_mission_widgets', JSON.stringify(newPrefs));
  };

  const toggleWidget = (key: string) => {
    const updated = widgets.map(w => w.key === key ? { ...w, visible: !w.visible } : w);
    saveWidgetPrefs(updated);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newWidgets.length) {
      const temp = newWidgets[index];
      newWidgets[index] = newWidgets[targetIndex];
      newWidgets[targetIndex] = temp;
      saveWidgetPrefs(newWidgets);
    }
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setChecklist(updated);
    localStorage.setItem('alpha_mission_checklist', JSON.stringify(updated));
  };

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/orders')
      ]);

      if (!statsRes.ok || !ordersRes.ok) {
        if (!statsRes.ok) {
          try {
            const errData = await statsRes.json();
            console.error('❌ statsRes detailed error:', errData);
          } catch (_) {}
        }
        console.error('statsRes status:', statsRes.status, 'ordersRes status:', ordersRes.status);
        throw new Error(`Error al recuperar datos del panel de control. (Stats: ${statsRes.status}, Orders: ${ordersRes.status})`);
      }

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      setStats(statsData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message || 'No se pudo establecer conexión con los servicios de administración.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Búsqueda Global (Command Palette)
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Inicializando Mission Control...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center font-mono">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Error de Sincronización
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error || 'Error del servidor al cargar las métricas.'}
        </p>
        <button
          onClick={() => fetchDashboardData()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors cursor-pointer"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  const { metrics, integrations, alerts, unreadNotifications, recentActivity, nextDrop, lastBackupTime } = stats;

  // Calcular puntuación del estado general
  const calculateOverallScore = () => {
    let score = 100;
    // Restar por integraciones pendientes o caídas
    if (!integrations.paypal) score -= 10;
    if (!integrations.printful) score -= 10;
    if (!integrations.resend) score -= 10;
    if (!integrations.sentry) score -= 5;
    
    // Restar por notificaciones de error sin leer
    const errorAlerts = unreadNotifications.filter((n: any) => n.severity === 'critical' || n.severity === 'error').length;
    score -= errorAlerts * 8;

    // Restar si la waitlist tiene algún drop retrasado, etc (ejemplo hipotético)
    return Math.max(65, score);
  };

  const overallScore = calculateOverallScore();

  const getScoreStatus = (score: number) => {
    if (score >= 95) return { text: 'Estado Excelente', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' };
    if (score >= 80) return { text: 'Operatividad Estable', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' };
    return { text: 'Atención Requerida', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/10' };
  };

  const statusConfig = getScoreStatus(overallScore);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-mono relative">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Alpha Control Room</span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wide mt-1 uppercase">
            Mission Control
          </h1>
        </div>

        {/* Acciones y selector de tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador Rápido Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-white/70 hover:text-white transition-all cursor-pointer font-sans"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar (Ctrl+K)</span>
          </button>

          {/* Configurar widgets button */}
          <button
            onClick={() => setShowConfigurator(!showConfigurator)}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Widgets</span>
          </button>

          {/* Tab Selector */}
          <div className="flex bg-white/5 p-1 border border-white/5 rounded text-[10px] uppercase font-bold tracking-wider">
            <button
              onClick={() => setActiveTab('mission')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'mission' ? 'bg-[var(--primary)] text-black' : 'text-[#f5f5f0]/60 hover:text-white'
              }`}
            >
              Mission Control
            </button>
            <button
              onClick={() => setActiveTab('classic')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'classic' ? 'bg-[var(--primary)] text-black' : 'text-[#f5f5f0]/60 hover:text-white'
              }`}
            >
              Panel Clásico
            </button>
          </div>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'mission' ? (
        <div className="space-y-6">
          {/* Banner de Puntuación General y Estado */}
          <div className={`border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${statusConfig.border} ${statusConfig.bg}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full border-2 ${statusConfig.border} flex items-center justify-center text-xl font-bold font-serif`}>
                {overallScore}%
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Salud Operativa Global</h3>
                <p className={`text-[10px] uppercase font-bold mt-0.5 tracking-wider ${statusConfig.color}`}>{statusConfig.text}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-[9px] text-[var(--muted)] uppercase">
              <div className="flex flex-col gap-0.5 border-r border-white/5 pr-4">
                <span>Último Backup:</span>
                <span className="text-white">{lastBackupTime}</span>
              </div>
              <div className="flex flex-col gap-0.5 border-r border-white/5 pr-4">
                <span>Alertas Activas:</span>
                <span className={alerts.length > 0 ? 'text-amber-400 font-bold' : 'text-white'}>{alerts.length}</span>
              </div>
              <div className="flex flex-col gap-0.5 pr-4">
                <span>Notificaciones Unread:</span>
                <span className={unreadNotifications.length > 0 ? 'text-red-400 font-bold' : 'text-white'}>{unreadNotifications.length}</span>
              </div>
            </div>
          </div>

          {/* Panel de Configuración de Widgets (Collapsible) */}
          {showConfigurator && (
            <div className="bg-[#121212] border border-white/10 p-5 animate-in slide-in-from-top duration-200">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="text-xs font-bold text-[#f5f5f0] uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" /> Personalizar Mission Control
                </h3>
                <button 
                  onClick={() => setShowConfigurator(false)}
                  className="p-1 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-[var(--muted)] mb-4 font-sans leading-relaxed">
                Habilita, oculta o reordena los paneles de control a continuación. Tus preferencias se guardarán de forma persistente en tu navegador.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {widgets.map((widget, idx) => (
                  <div key={widget.key} className="bg-[#0a0a0a] border border-white/5 p-3 flex flex-col justify-between gap-3 text-[10px]">
                    <div className="flex justify-between items-start">
                      <span className="text-white/80 font-bold tracking-wide">{widget.name}</span>
                      <button
                        onClick={() => toggleWidget(widget.key)}
                        className={`p-1 border rounded transition-all ${
                          widget.visible ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-white/10 bg-white/5 text-[var(--muted)]'
                        }`}
                        title={widget.visible ? 'Ocultar' : 'Mostrar'}
                      >
                        {widget.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex gap-1.5 self-end">
                      <button
                        onClick={() => moveWidget(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveWidget(idx, 'down')}
                        disabled={idx === widgets.length - 1}
                        className="p-1 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render dinámico de los widgets de Mission Control */}
          <div className="space-y-6">
            {widgets.filter(w => w.visible).map((widget) => {
              switch (widget.key) {
                // ==========================================
                // 1. Resumen Ejecutivo (Executive Summary)
                // ==========================================
                case 'summary':
                  return (
                    <div key="widget-summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-100">
                      {/* Ventas Hoy */}
                      <div className="bg-[#121212] border border-white/5 p-5 hover:border-white/10 transition-colors shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Ventas Hoy</span>
                            <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                              <DollarSign className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h3 className="text-xl font-serif font-bold text-[#f5f5f0]">{formatPrice(metrics.salesToday)}</h3>
                        </div>
                        <p className="text-[8px] text-[var(--muted)] mt-3 uppercase tracking-widest">Ingresos acumulados hoy</p>
                      </div>

                      {/* Ventas Semana */}
                      <div className="bg-[#121212] border border-white/5 p-5 hover:border-white/10 transition-colors shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Ventas Semana</span>
                            <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h3 className="text-xl font-serif font-bold text-[#f5f5f0]">{formatPrice(metrics.salesWeek)}</h3>
                        </div>
                        <p className="text-[8px] text-[var(--muted)] mt-3 uppercase tracking-widest">Últimos 7 días móviles</p>
                      </div>

                      {/* Ventas Mes */}
                      <div className="bg-[#121212] border border-white/5 p-5 hover:border-white/10 transition-colors shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Ventas Mes</span>
                            <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h3 className="text-xl font-serif font-bold text-[#f5f5f0]">{formatPrice(metrics.salesMonth)}</h3>
                        </div>
                        <p className="text-[8px] text-[var(--muted)] mt-3 uppercase tracking-widest">Acumulado mes en curso</p>
                      </div>

                      {/* Conversión y Visitas */}
                      <div className="bg-[#121212] border border-white/5 p-5 hover:border-white/10 transition-colors shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Tasa Conversión</span>
                            <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                              <Zap className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <h3 className="text-xl font-serif font-bold text-[#f5f5f0]">
                            {metrics.conversionRate.toFixed(2)}%
                          </h3>
                        </div>
                        <p className="text-[8px] text-[var(--muted)] mt-3 uppercase tracking-widest">
                          {metrics.visitsCount} visitas estimadas
                        </p>
                      </div>
                    </div>
                  );

                // ==========================================
                // 2. Checklist Diario
                // ==========================================
                case 'checklist':
                  return (
                    <div key="widget-checklist" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-4 pb-2 border-b border-white/5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Checklist de Control Operativo
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                        {checklist.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => toggleChecklistItem(item.id)}
                            className={`p-3 border transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[75px] group select-none ${
                              item.completed ? 'border-emerald-500/10 bg-emerald-500/[0.01] opacity-60' : 'border-white/5 hover:border-white/15 bg-white/[0.01]'
                            }`}
                          >
                            <span className={`text-[10px] font-sans ${item.completed ? 'line-through text-[var(--muted)]' : 'text-white/80 group-hover:text-white'}`}>
                              {item.task}
                            </span>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[8px] uppercase tracking-wider text-[var(--muted)]">Checklist</span>
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                                item.completed ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400' : 'border-white/20 text-transparent'
                              }`}>
                                ✓
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                // ==========================================
                // 3. Alertas Activas y Críticas
                // ==========================================
                case 'alerts':
                  return (
                    <div key="widget-alerts" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Alertas del Sistema */}
                      <div className="lg:col-span-8 bg-[#121212] border border-white/5 p-5 shadow-sm">
                        <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-4 pb-2 border-b border-white/5 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> Advertencias del Sistema
                        </h2>
                        {alerts.length === 0 ? (
                          <div className="py-6 text-center text-[var(--muted)] text-xs uppercase">
                            No hay advertencias activas. Todo opera correctamente.
                          </div>
                        ) : (
                          <ul className="space-y-2.5">
                            {alerts.map((alert: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2.5 p-3 bg-white/[0.01] border border-white/5 rounded text-xs text-amber-400 font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span>{alert}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Notificaciones Críticas */}
                      <div className="lg:col-span-4 bg-[#121212] border border-white/5 p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                          <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold">
                            Notificaciones Unread
                          </h2>
                          <Link href="/admin/notifications" className="text-[8px] tracking-wider text-[var(--primary)] uppercase font-bold hover:underline">
                            Ver todas
                          </Link>
                        </div>
                        {unreadNotifications.length === 0 ? (
                          <div className="py-6 text-center text-[var(--muted)] text-[10px] uppercase">
                            No hay alertas en bandeja.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {unreadNotifications.map((notif: any) => (
                              <Link 
                                key={notif.id} 
                                href={notif.actionUrl || '/admin/notifications'}
                                className="block p-2.5 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] transition-all rounded text-[10px]"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[#f5f5f0] truncate max-w-[170px] uppercase">{notif.title}</span>
                                  <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                                    notif.severity === 'critical' || notif.severity === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>{notif.severity}</span>
                                </div>
                                <p className="text-[9px] text-[var(--muted)] mt-1 font-sans truncate">{notif.message}</p>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );

                // ==========================================
                // 4. Centro Financiero
                // ==========================================
                case 'financial':
                  return (
                    <div key="widget-financial" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                        <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-400" /> Resumen Financiero Consolidado
                        </h2>
                        <Link href="/admin/finance" className="text-[8px] tracking-wider text-[var(--primary)] uppercase font-bold hover:underline flex items-center gap-0.5">
                          Balances <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                          <span className="text-[8px] text-[var(--muted)] uppercase">Ingresos Brutos</span>
                          <span className="block text-base font-bold text-white mt-1">{formatPrice(stats.financialSummary.revenue)}</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                          <span className="text-[8px] text-[var(--muted)] uppercase">Costes Printful</span>
                          <span className="block text-base font-bold text-white mt-1">{formatPrice(stats.financialSummary.costs)}</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                          <span className="text-[8px] text-[var(--muted)] uppercase">Costes Envío</span>
                          <span className="block text-base font-bold text-white mt-1">{formatPrice(stats.financialSummary.shipping)}</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded">
                          <span className="text-[8px] text-[var(--muted)] uppercase">PayPal Fee (Est.)</span>
                          <span className="block text-base font-bold text-white mt-1">{formatPrice(stats.financialSummary.commissions)}</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-emerald-500/10 bg-emerald-500/[0.01] rounded col-span-2 md:col-span-1">
                          <span className="text-[8px] text-emerald-400 uppercase font-semibold">Beneficio Neto</span>
                          <span className="block text-base font-bold text-emerald-400 mt-1">{formatPrice(stats.financialSummary.net)}</span>
                        </div>
                      </div>
                    </div>
                  );

                // ==========================================
                // 5. Próximo Drop Activo
                // ==========================================
                case 'nextDrop':
                  return (
                    <div key="widget-nextdrop" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                        <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[var(--primary)]" /> Lanzamiento Programado / Drop Spotlight
                        </h2>
                        <Link href="/admin/drops" className="text-[8px] tracking-wider text-[var(--primary)] uppercase font-bold hover:underline">
                          Administrar Drops
                        </Link>
                      </div>
                      {nextDrop ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                          <div className="md:col-span-5 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-[var(--primary)] text-black font-bold text-[8px] uppercase">{nextDrop.status}</span>
                              <h3 className="text-sm font-bold text-white uppercase">{nextDrop.name}</h3>
                            </div>
                            <p className="text-[10px] text-[var(--muted)] font-sans">
                              Lanzamiento previsto el: {new Date(nextDrop.openingAt).toLocaleDateString('es-ES', { dateStyle: 'full' })}
                            </p>
                          </div>
                          
                          <div className="md:col-span-7 grid grid-cols-3 gap-3 text-center">
                            <div className="p-2.5 border border-white/5 bg-white/[0.01]">
                              <span className="text-[8px] text-[var(--muted)] uppercase">Productos</span>
                              <span className="block text-sm font-bold text-white mt-0.5">{nextDrop.productsCount} prendas</span>
                            </div>
                            <div className="p-2.5 border border-white/5 bg-white/[0.01]">
                              <span className="text-[8px] text-[var(--muted)] uppercase">Suscritos Waitlist</span>
                              <span className="block text-sm font-bold text-[var(--primary)] mt-0.5">{nextDrop.waitlistCount}</span>
                            </div>
                            <div className="p-2.5 border border-white/5 bg-white/[0.01]">
                              <span className="text-[8px] text-[var(--muted)] uppercase">Meta de Lanzamiento</span>
                              <span className="block text-sm font-bold text-white mt-0.5">
                                {Math.round((nextDrop.waitlistCount / nextDrop.targetSubscribers) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-[var(--muted)] text-xs uppercase">
                          No hay drops programados o en planificación activos.
                        </div>
                      )}
                    </div>
                  );

                // ==========================================
                // 6. Integraciones rápidas (Integration Hub Widget)
                // ==========================================
                case 'integrations':
                  return (
                    <div key="widget-integrations" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                        <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-indigo-400" /> Integraciones y Servicios
                        </h2>
                        <Link href="/admin/comunicaciones" className="text-[8px] tracking-wider text-[var(--primary)] uppercase font-bold hover:underline flex items-center gap-0.5">
                          Abrir Hub <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                        <Link href="/admin/comunicaciones" className="p-2.5 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between transition-colors">
                          <span className="text-[10px] text-white/70">PayPal Gateway</span>
                          <span className={`w-2 h-2 rounded-full ${integrations.paypal ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
                        </Link>
                        <Link href="/admin/comunicaciones" className="p-2.5 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between transition-colors">
                          <span className="text-[10px] text-white/70">Printful API</span>
                          <span className={`w-2 h-2 rounded-full ${integrations.printful ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
                        </Link>
                        <Link href="/admin/comunicaciones" className="p-2.5 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between transition-colors">
                          <span className="text-[10px] text-white/70">Resend Mailer</span>
                          <span className={`w-2 h-2 rounded-full ${integrations.resend ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
                        </Link>
                        <Link href="/admin/comunicaciones" className="p-2.5 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between transition-colors">
                          <span className="text-[10px] text-white/70">Sentry Monitor</span>
                          <span className={`w-2 h-2 rounded-full ${integrations.sentry ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
                        </Link>
                        <Link href="/admin/comunicaciones" className="p-2.5 border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.02] flex items-center justify-between transition-colors col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-white/70">Neon Backups</span>
                          <span className={`w-2 h-2 rounded-full ${integrations.backups ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        </Link>
                      </div>
                    </div>
                  );

                // ==========================================
                // 7. Rendimiento y Conversión
                // ==========================================
                case 'performance':
                  return (
                    <div key="widget-performance" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-4 pb-2 border-b border-white/5 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-orange-400" /> Rendimiento de la Tienda
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded text-center">
                          <span className="text-[8px] text-[var(--muted)] uppercase block">Visitas Totales</span>
                          <span className="text-lg font-bold text-white mt-1 block">{metrics.visitsCount}</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded text-center">
                          <span className="text-[8px] text-[var(--muted)] uppercase block">Pedidos Completados</span>
                          <span className="text-lg font-bold text-white mt-1 block">{orders.filter(o => o.paymentStatus === 'paid').length}</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded text-center">
                          <span className="text-[8px] text-[var(--muted)] uppercase block">Tasa Conversión</span>
                          <span className="text-lg font-bold text-emerald-400 mt-1 block">{metrics.conversionRate.toFixed(2)}%</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded text-center">
                          <span className="text-[8px] text-[var(--muted)] uppercase block">Carritos Abandonados</span>
                          <span className="text-lg font-bold text-[var(--muted)] mt-1 block">{metrics.abandonedCartsCount}</span>
                        </div>
                      </div>
                    </div>
                  );

                // ==========================================
                // 8. Clientes
                // ==========================================
                case 'customers':
                  return (
                    <div key="widget-customers" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                        <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-400" /> Resumen de Clientes
                        </h2>
                        <Link href="/admin/customers" className="text-[8px] tracking-wider text-[var(--primary)] uppercase font-bold hover:underline">
                          Ver Clientes
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded">
                          <span className="text-[8px] text-[var(--muted)] uppercase">Clientes Registrados</span>
                          <span className="block text-base font-bold text-white mt-1">{metrics.activeCustomers}</span>
                        </div>
                        <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded">
                          <span className="text-[8px] text-[var(--muted)] uppercase">Clientes Activos</span>
                          <span className="block text-base font-bold text-white mt-1">{orders.filter(o => o.status === 'shipped').length}</span>
                        </div>
                        <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded">
                          <span className="text-[8px] text-[var(--muted)] uppercase">Clientes VIP</span>
                          <span className="block text-base font-bold text-amber-400 mt-1">{metrics.vipCustomersCount}</span>
                        </div>
                        <div className="p-3.5 bg-white/[0.01] border border-red-500/10 bg-red-500/[0.01] rounded">
                          <span className="text-[8px] text-red-400 uppercase font-semibold">Con Incidencias</span>
                          <span className="block text-base font-bold text-red-400 mt-1">{metrics.activeIncidentsCustomersCount}</span>
                        </div>
                      </div>
                    </div>
                  );

                // ==========================================
                // 9. Actividad Reciente (Global Activity Stream)
                // ==========================================
                case 'timeline':
                  return (
                    <div key="widget-timeline" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-5 pb-2 border-b border-white/5 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" /> Actividad Reciente (Timeline Global)
                      </h2>
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 relative">
                        {recentActivity.length === 0 ? (
                          <div className="py-6 text-center text-[var(--muted)] text-xs uppercase">
                            No se han registrado eventos recientes.
                          </div>
                        ) : (
                          recentActivity.map((act: any, idx: number) => (
                            <div key={act.id} className="flex gap-4 items-start text-xs border-l-2 border-white/5 pl-4 relative">
                              <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-[#f5f5f0] uppercase text-[10px]">{act.title}</span>
                                  <span className="text-[9px] text-[var(--muted)]">
                                    {new Date(act.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[var(--muted)] mt-0.5 font-sans leading-relaxed">
                                  {act.description}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );

                // ==========================================
                // 10. Accesos Rápidos (Quick Actions)
                // ==========================================
                case 'quickActions':
                  return (
                    <div key="widget-quickactions" className="bg-[#121212] border border-white/5 p-5 shadow-sm">
                      <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-4 pb-2 border-b border-white/5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[var(--primary)]" /> Atajos de Acceso Rápido
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                        <Link href="/admin/products" className="flex flex-col items-center justify-center p-3.5 bg-white/[0.01] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.02] transition-all text-[9px] uppercase tracking-wider text-[#f5f5f0] gap-2 font-bold cursor-pointer group text-center">
                          <Plus className="w-3.5 h-3.5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                          <span>Nuevo Producto</span>
                        </Link>
                        <Link href="/admin/drops" className="flex flex-col items-center justify-center p-3.5 bg-white/[0.01] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.02] transition-all text-[9px] uppercase tracking-wider text-[#f5f5f0] gap-2 font-bold cursor-pointer group text-center">
                          <Plus className="w-3.5 h-3.5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                          <span>Nuevo Drop</span>
                        </Link>
                        <Link href="/admin/discounts" className="flex flex-col items-center justify-center p-3.5 bg-white/[0.01] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.02] transition-all text-[9px] uppercase tracking-wider text-[#f5f5f0] gap-2 font-bold cursor-pointer group text-center">
                          <Ticket className="w-3.5 h-3.5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                          <span>Crear Descuento</span>
                        </Link>
                        <Link href="/admin/support" className="flex flex-col items-center justify-center p-3.5 bg-white/[0.01] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.02] transition-all text-[9px] uppercase tracking-wider text-[#f5f5f0] gap-2 font-bold cursor-pointer group text-center">
                          <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                          <span>Soporte Técnico</span>
                        </Link>
                        <Link href="/admin/comunicaciones" className="flex flex-col items-center justify-center p-3.5 bg-white/[0.01] border border-white/5 hover:border-[var(--primary)]/30 hover:bg-white/[0.02] transition-all text-[9px] uppercase tracking-wider text-[#f5f5f0] gap-2 font-bold cursor-pointer group text-center col-span-2 sm:col-span-1">
                          <Database className="w-3.5 h-3.5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                          <span>Integration Hub</span>
                        </Link>
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      ) : (
        /* VISTA CLÁSICA ORIGINAL DEL DASHBOARD (Para cumplir con la directiva de NO romper el panel tradicional) */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Ventas Hoy */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Ventas Hoy</span>
                  <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{formatPrice(metrics.salesToday)}</h3>
              </div>
              <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Ingresos acumulados hoy</p>
            </div>

            {/* Ventas Mes */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Ventas Mes</span>
                  <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{formatPrice(metrics.salesMonth)}</h3>
              </div>
              <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Acumulado mes en curso</p>
            </div>

            {/* Clientes */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Clientes</span>
                  <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{metrics.activeCustomers}</h3>
              </div>
              <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Compradores recurrentes</p>
            </div>

            {/* Waitlist */}
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Waitlist</span>
                  <span className="bg-white/5 text-[var(--primary)] p-1.5 rounded">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{metrics.waitlistCount}</h3>
              </div>
              <p className="text-[8px] text-[var(--muted)] mt-4 uppercase tracking-widest">Registros de lanzamientos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
                Fulfillment & Estados de Pedidos
              </h2>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                  <span>Pedidos en Cola / Pendientes:</span>
                  <span className="font-bold text-white bg-white/5 px-2 py-0.5 border border-white/10">{metrics.pendingCount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                  <span>En Fabricación (Printful):</span>
                  <span className="font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 border border-blue-500/20">{metrics.productionCount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5 pb-2">
                  <span>Pedidos Enviados / Entregados:</span>
                  <span className="font-bold text-green-400 bg-green-500/10 px-2 py-0.5 border border-green-500/20">{metrics.shippedCount}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
                Estado de Integraciones del Sistema
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5">
                  <span className="text-white/60">PayPal Checkout</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${integrations.paypal ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500'}`}>{integrations.paypal ? 'CONFIG' : 'PENDIENTE'}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5">
                  <span className="text-white/60">Printful API</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${integrations.printful ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500'}`}>{integrations.printful ? 'CONFIG' : 'PENDIENTE'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BUSCADOR GLOBAL (Command Palette) */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh] animate-in fade-in duration-150">
          <div className="bg-[#121212] border border-white/10 w-full max-w-2xl p-5 shadow-2xl space-y-4">
            {/* Buscador Input */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Search className="w-5 h-5 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Buscar pedidos, clientes, productos, drops, tickets de soporte..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-sm text-[#f5f5f0] outline-none"
              />
              <button 
                onClick={() => { setShowSearchModal(false); setSearchQuery(''); setSearchResults(null); }}
                className="p-1 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Resultados */}
            <div className="max-h-[60vh] overflow-y-auto space-y-4 text-xs font-mono">
              {searching ? (
                <div className="py-8 text-center text-[var(--muted)]">Buscando en base de datos de Alpha...</div>
              ) : !searchResults ? (
                <div className="py-8 text-center text-[var(--muted)] text-[10px] uppercase tracking-wider">
                  Escribe un término para buscar
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pedidos */}
                  {searchResults.orders?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider block border-b border-white/5 pb-1">Pedidos</span>
                      {searchResults.orders.map((o: any) => (
                        <Link 
                          key={o.id} 
                          href="/admin/orders"
                          onClick={() => setShowSearchModal(false)}
                          className="flex justify-between items-center p-2 hover:bg-white/5 border border-transparent hover:border-white/5"
                        >
                          <span className="font-bold text-[#f5f5f0]">#{o.orderNumber} - {o.name}</span>
                          <span className="text-white/60">{o.email} | {o.total} EUR</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Productos */}
                  {searchResults.products?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider block border-b border-white/5 pb-1">Productos</span>
                      {searchResults.products.map((p: any) => (
                        <Link 
                          key={p.id} 
                          href="/admin/products"
                          onClick={() => setShowSearchModal(false)}
                          className="flex justify-between items-center p-2 hover:bg-white/5 border border-transparent hover:border-white/5"
                        >
                          <span className="font-bold text-[#f5f5f0]">{p.name} ({p.category})</span>
                          <span className="text-white/60">{p.priceEUR} EUR</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Drops */}
                  {searchResults.drops?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider block border-b border-white/5 pb-1">Drops</span>
                      {searchResults.drops.map((d: any) => (
                        <Link 
                          key={d.id} 
                          href="/admin/drops"
                          onClick={() => setShowSearchModal(false)}
                          className="flex justify-between items-center p-2 hover:bg-white/5 border border-transparent hover:border-white/5"
                        >
                          <span className="font-bold text-[#f5f5f0]">{d.name}</span>
                          <span className="text-white/60 uppercase">{d.status}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Tickets */}
                  {searchResults.tickets?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider block border-b border-white/5 pb-1">Tickets de Soporte</span>
                      {searchResults.tickets.map((t: any) => (
                        <Link 
                          key={t.id} 
                          href={`/admin/support/${t.id}`}
                          onClick={() => setShowSearchModal(false)}
                          className="flex justify-between items-center p-2 hover:bg-white/5 border border-transparent hover:border-white/5"
                        >
                          <span className="font-bold text-[#f5f5f0]">#{t.ticketNumber} - {t.subject}</span>
                          <span className="text-white/60 font-sans">{t.customerEmail} ({t.status})</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {(!searchResults.orders?.length && !searchResults.products?.length && !searchResults.drops?.length && !searchResults.tickets?.length) && (
                    <div className="py-8 text-center text-[var(--muted)]">No se encontraron coincidencias para la consulta.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
