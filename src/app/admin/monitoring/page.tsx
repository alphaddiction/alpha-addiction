'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/utils';
import {
  Activity,
  Server,
  Database,
  Clock,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Globe,
  CloudLightning,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  ShoppingBag,
  FileText,
  HelpCircle,
  Mail,
} from 'lucide-react';

interface SystemHealthData {
  status: 'green' | 'yellow' | 'red';
  timestamp: string;
  system: {
    nextVersion: string;
    environment: string;
    buildId: string;
  };
  database: {
    status: 'connected' | 'error';
    latencyMs: number;
    lastCheck: string;
  };
  printful: {
    status: 'connected' | 'error';
    lastSync: string;
    lastWebhook: string;
    lastOrder: string;
  };
  paypal: {
    status: 'configured' | 'pending_setup';
    mode: string;
    setupInfo: string;
  };
  envVariables: {
    DATABASE_URL: 'configured' | 'missing';
    PRINTFUL_API_KEY: 'configured' | 'missing';
    PRINTFUL_WEBHOOK_SECRET: 'configured' | 'missing';
    PAYPAL_CLIENT_ID: 'configured' | 'missing';
    PAYPAL_CLIENT_SECRET: 'configured' | 'missing';
    JWT_SECRET: 'configured' | 'missing';
    ADMIN_SESSION_SECRET: 'configured' | 'missing';
  };
  orders: {
    total: number;
    paid: number;
    pending: number;
    production: number;
    shipped: number;
    failed: number;
  };
  logs: Array<{
    id: string;
    action: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
  }>;
  resend?: {
    status: 'configured' | 'pending_setup';
    configured: boolean;
    lastEmail?: string;
    totalErrors: number;
  };
  drops?: {
    activeDrop: string;
    status: string;
    productsCount: number;
    totalVirtualStock: number;
    openingAt: string;
    closingAt: string;
  };
  seoPerformance?: {
    sitemapAvailable: boolean;
    robotsAvailable: boolean;
    metadataConfigured: boolean;
    legalPagesAvailable: boolean;
    imagesOptimized: boolean;
    indexingStatus: 'preparado' | 'advertencia';
    warnings: string[];
  };
  support?: {
    openTickets: number;
    urgentTickets: number;
    unrepliedTickets: number;
    lastTicketReceived: string;
  };
  portal?: {
    totalCustomerAccesses: number;
    lastCustomerAccess: string;
    otpErrors: number;
    activeSecureTokens: number;
    avgAuthTimeSeconds: number;
  };
  configuration?: {
    completionPercentage: number;
    isReadyForProduction: boolean;
    pendingCount: number;
  };
  twoFactorAdmin?: {
    enabled: boolean;
    lastEventAt: string;
    recommendation: string;
  };
  testPurchases?: {
    status: 'disabled' | 'enabled' | 'error';
    enabled: boolean;
    recommendation: string;
  };
  sentry?: {
    configured: boolean;
    dsn: string | null;
    recommendation: string;
  };
  backups?: {
    enabled: boolean;
    configured: boolean;
    encryptionActive: boolean;
    lastBackupFile: string | null;
    lastBackupSize: string | null;
    lastBackupTime: string | null;
    recommendation: string;
  };
}

export default function HealthCenterPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // E2E Test State
  const [e2eRunning, setE2eRunning] = useState(false);
  const [e2eResult, setE2eResult] = useState<{ success: boolean; timestamp: string; steps: any[] } | null>(null);
  const [e2eError, setE2eError] = useState<string | null>(null);

  // Backups State
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupResult, setBackupResult] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const triggerBackup = async () => {
    setBackupRunning(true);
    setBackupResult(null);
    setBackupError(null);

    try {
      const res = await fetch('/api/admin/system/backup', { method: 'POST' });
      const resData = await res.json();

      if (res.ok && resData.success) {
        setBackupResult(resData.output || resData.message);
        // Recargar datos de salud para actualizar la tarjeta del último backup
        const healthRes = await fetch('/api/admin/system/health');
        if (healthRes.ok) {
          const freshData = await healthRes.json();
          setData(freshData);
        }
      } else {
        setBackupError(resData.message || resData.error || 'Error al ejecutar backup.');
      }
    } catch (err: any) {
      setBackupError(err.message || 'Error en la petición de red.');
    } finally {
      setBackupRunning(false);
    }
  };

  const handleRunE2eTest = async () => {
    setE2eRunning(true);
    setE2eError(null);
    setE2eResult(null);
    try {
      const res = await fetch('/api/admin/system/test-e2e', {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al ejecutar la prueba de integración.');
      }
      const result = await res.json();
      setE2eResult(result);
    } catch (err: any) {
      console.error(err);
      setE2eError(err.message || 'Error de red al ejecutar las pruebas.');
    } finally {
      setE2eRunning(false);
    }
  };

  const fetchHealth = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/system/health');
      if (!response.ok) {
        throw new Error('El servidor devolvió un error de diagnóstico.');
      }
      const result = (await response.json()) as SystemHealthData;
      setData(result);
    } catch (err) {
      console.error('❌ Health status fetch error:', err);
      setError('No se pudo establecer conexión con el centro de monitorización del sistema.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Conectando Diagnósticos del Sistema...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border border-red-500/10 bg-red-500/5 p-8 max-w-xl mx-auto rounded text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-sm font-serif font-bold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Fallo de Conexión
        </h2>
        <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed mb-6">
          {error || 'Error inesperado.'}
        </p>
        <button
          onClick={() => fetchHealth()}
          className="px-6 py-3 bg-[var(--primary)] text-black text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  const lastCheckDate = new Date(data.timestamp).toLocaleString('es-ES');

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Cabecera de Página */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Health Center & Diagnóstico
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Actualizado: {lastCheckDate}</span>
          </div>
          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de Estado General del E-Commerce */}
      <div className={`border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded ${
        data.status === 'green' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
        data.status === 'yellow' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
        'bg-red-500/5 border-red-500/20 text-red-400'
      }`}>
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold font-mono">Estado Visual Operativo</h3>
          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed max-w-2xl font-sans">
            {data.status === 'green' && '🟢 Todos los servicios críticos (Base de datos y API de Printful) están funcionando de forma correcta en producción.'}
            {data.status === 'yellow' && '🟡 Los servicios principales están en línea pero algunas pasarelas están en modo de pruebas (PayPal Sandbox).'}
            {data.status === 'red' && '🔴 Error crítico: Se ha perdido comunicación con servicios clave o hay configuraciones de pruebas activadas en producción.'}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 border text-xs rounded font-bold uppercase tracking-wider ${
            data.status === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            data.status === 'yellow' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' :
            'bg-red-500/10 border-red-500/20 text-red-500 animate-bounce'
          }`}>
            {data.status === 'green' ? '🟢 Correcto' : data.status === 'yellow' ? '🟡 Advertencia' : '🔴 Error'}
          </span>
        </div>
      </div>

      {/* Panel de Validación E2E */}
      <div className="bg-[#121212] border border-white/5 p-6 rounded mb-8 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#f5f5f0]">Validación de Compra y Webhooks E2E</h3>
            <p className="text-[10px] text-[var(--muted)] mt-1 font-sans">
              Realiza una simulación completa de compra real, recepción de webhooks de PayPal, actualización de base de datos relacional y bloqueo de envíos ficticios a Printful en Neon.
            </p>
          </div>
          <button
            onClick={handleRunE2eTest}
            disabled={e2eRunning}
            className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--primary)] hover:text-white transition-colors text-[10px] tracking-widest uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {e2eRunning ? 'Ejecutando Simulación...' : 'Iniciar Prueba E2E'}
          </button>
        </div>

        {e2eError && (
          <div className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded">
            ❌ {e2eError}
          </div>
        )}

        {e2eResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--muted)]">Último Test: {new Date(e2eResult.timestamp).toLocaleString()}</span>
              <span className={`inline-block px-3 py-1 border text-[10px] rounded font-bold uppercase tracking-wider ${
                e2eResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
              }`}>
                {e2eResult.success ? '✔ E2E VALIDADO CON ÉXITO' : '❌ FALLO EN PRUEBA E2E'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] leading-relaxed">
              {e2eResult.steps.map((s: any, idx: number) => (
                <div key={idx} className={`p-3 border rounded flex items-start gap-2.5 ${
                  s.success ? 'bg-green-500/5 border-green-500/10 text-green-400/80' : 'bg-red-500/5 border-red-500/10 text-red-400'
                }`}>
                  <span className="text-xs">{s.success ? '✔' : '❌'}</span>
                  <div>
                    <div className="font-bold tracking-wider text-[#f5f5f0]">{s.step}</div>
                    <div className="font-sans mt-0.5 text-white/50">{s.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!e2eResult && !e2eRunning && !e2eError && (
          <div className="text-[10px] text-[var(--muted)] text-center py-6 border border-dashed border-white/5 rounded">
            Ninguna prueba E2E ejecutada en esta sesión. Pulsa el botón superior para verificar la integridad del checkout.
          </div>
        )}
      </div>

      {/* Grid de Estado Físico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Base de Datos */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">PostgreSQL (Neon)</span>
              <span className={`p-2 rounded ${data.database.status === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                <Database className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.database.status === 'connected' ? 'CONECTADA' : 'DESCONECTADA'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Latencia:</span>
                <span className="text-[#f5f5f0]">{data.database.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Último Test:</span>
                <span className="text-[#f5f5f0] truncate">{new Date(data.database.lastCheck).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Printful Sincronización */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">API Printful</span>
              <span className={`p-2 rounded ${data.printful.status === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.printful.status === 'connected' ? 'CONECTADO' : 'ERROR CONEXIÓN'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Última Sincronización:</span>
                <span className="text-[#f5f5f0]">{data.printful.lastSync}</span>
              </div>
              <div className="flex justify-between">
                <span>Último Webhook:</span>
                <span className="text-[#f5f5f0] truncate max-w-[100px]" title={data.printful.lastWebhook}>{data.printful.lastWebhook}</span>
              </div>
              <div className="flex justify-between">
                <span>Último Envío:</span>
                <span className="text-[#f5f5f0] truncate max-w-[100px]" title={data.printful.lastOrder}>{data.printful.lastOrder}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PayPal Checkout */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">PayPal Pasarela</span>
              <span className={`p-2 rounded ${data.paypal.status === 'configured' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
                <Globe className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.paypal.status === 'configured' ? 'SANDBOX ACTIVO' : 'PENDIENTE'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Entorno PayPal:</span>
                <span className="text-indigo-400 uppercase font-bold">{data.paypal.mode}</span>
              </div>
              <div className="flex justify-between">
                <span>Último Webhook:</span>
                <span className="text-[#f5f5f0] truncate max-w-[100px]" title={(data.paypal as any).lastWebhook || 'Ninguno'}>{(data.paypal as any).lastWebhook || 'Ninguno'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resend Email Pasarela */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Resend Email</span>
              <span className={`p-2 rounded ${(data as any).resend?.status === 'configured' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'}`}>
                <Mail className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {(data as any).resend?.status === 'configured' ? 'ACTIVO' : 'PENDIENTE'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Envíos Fallidos:</span>
                <span className="text-[#f5f5f0]">{(data as any).resend?.totalErrors || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Último Envío:</span>
                <span className="text-[#f5f5f0] truncate max-w-[100px]" title={(data as any).resend?.lastEmail || 'Ninguno'}>{(data as any).resend?.lastEmail || 'Ninguno'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEO y Rendimiento */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">SEO y Rendimiento</span>
              <span className={`p-2 rounded ${data.seoPerformance?.indexingStatus === 'preparado' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <Globe className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.seoPerformance?.indexingStatus === 'preparado' ? 'PREPARADO' : 'ADVERTENCIA'}
            </h3>
            <div className="text-[10px] text-[var(--muted)] font-mono mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span>Sitemap:</span>
                <span className={data.seoPerformance?.sitemapAvailable ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {data.seoPerformance?.sitemapAvailable ? '✔ Disponible' : '❌ Falta'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Robots:</span>
                <span className={data.seoPerformance?.robotsAvailable ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {data.seoPerformance?.robotsAvailable ? '✔ Disponible' : '❌ Falta'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Págs. Legales:</span>
                <span className={data.seoPerformance?.legalPagesAvailable ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {data.seoPerformance?.legalPagesAvailable ? '✔ Listas' : '❌ Incompletas'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2FA Admin */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between font-mono">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">2FA Admin</span>
              <span className={`p-2 rounded ${data.twoFactorAdmin?.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                <Lock className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.twoFactorAdmin?.enabled ? 'ACTIVO' : 'INACTIVO'}
            </h3>
            <div className="text-[9px] text-[var(--muted)] mt-4 space-y-1.5 leading-relaxed">
              <div className="flex justify-between">
                <span>Evento:</span>
                <span className="text-white truncate max-w-[80px]" title={data.twoFactorAdmin?.lastEventAt || 'Ninguno'}>{data.twoFactorAdmin?.lastEventAt || 'Ninguno'}</span>
              </div>
              <div className="pt-1.5 border-t border-white/5 flex flex-col text-[8px] text-[var(--muted)]">
                <span>Recomendación:</span>
                <span className="text-white font-sans mt-0.5 leading-normal">{data.twoFactorAdmin?.recommendation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compras de Prueba */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between font-mono">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Compras de Prueba</span>
              <span className={`p-2 rounded ${
                data.testPurchases?.status === 'error' ? 'bg-red-500/10 text-red-500' :
                data.testPurchases?.status === 'enabled' ? 'bg-amber-500/10 text-amber-400' :
                'bg-green-500/10 text-green-400'
              }`}>
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.testPurchases?.status === 'error' ? '🚨 ERROR' :
               data.testPurchases?.status === 'enabled' ? 'ACTIVAS' : 'DESACTIVADAS'}
            </h3>
            <div className="text-[9px] text-[var(--muted)] mt-4 space-y-1.5 leading-relaxed">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={`font-bold ${
                  data.testPurchases?.status === 'error' ? 'text-red-500 font-bold' :
                  data.testPurchases?.status === 'enabled' ? 'text-amber-400 animate-pulse' :
                  'text-green-400'
                }`}>
                  {data.testPurchases?.status === 'error' ? 'CRÍTICO (PROD)' :
                   data.testPurchases?.status === 'enabled' ? 'HABILITADAS (DEV)' : 'DESACTIVADAS'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-white/5 flex flex-col text-[8px] text-[var(--muted)]">
                <span>Recomendación:</span>
                <span className="text-white font-sans mt-0.5 leading-normal">{data.testPurchases?.recommendation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sentry Error Monitoring */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between font-mono">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Sentry Logger</span>
              <span className={`p-2 rounded ${data.sentry?.configured ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.sentry?.configured ? 'CONFIGURADO' : 'INACTIVO'}
            </h3>
            <div className="text-[9px] text-[var(--muted)] mt-4 space-y-1.5 leading-relaxed">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={`font-bold ${data.sentry?.configured ? 'text-green-400' : 'text-amber-400'}`}>
                  {data.sentry?.configured ? 'ACTIVO (PROD)' : 'PENDIENTE'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-white/5 flex flex-col text-[8px] text-[var(--muted)]">
                <span>Recomendación:</span>
                <span className="text-white font-sans mt-0.5 leading-normal">{data.sentry?.recommendation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Backups de Neon PostgreSQL */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between font-mono">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Neon Backups</span>
              <span className={`p-2 rounded ${
                data.backups?.lastBackupFile ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'
              }`}>
                <Database className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#f5f5f0] uppercase tracking-wider">
              {data.backups?.lastBackupFile ? 'DISPONIBLE' : 'SIN COPIAS'}
            </h3>
            <div className="text-[9px] text-[var(--muted)] mt-4 space-y-1.5 leading-relaxed">
              <div className="flex justify-between">
                <span>Último:</span>
                <span className="text-white truncate max-w-[100px]" title={data.backups?.lastBackupFile || 'Ninguno'}>
                  {data.backups?.lastBackupFile ? `${data.backups.lastBackupSize} (${data.backups.lastBackupFile.substring(0, 12)}...)` : 'Ninguno'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cifrado:</span>
                <span className={data.backups?.encryptionActive ? 'text-green-400' : 'text-amber-400'}>
                  {data.backups?.encryptionActive ? '✔ Activo (AES)' : '⚠️ Inactivo'}
                </span>
              </div>
              <div className="pt-1.5 border-t border-white/5 flex flex-col text-[8px] text-[var(--muted)]">
                <span>Recomendación:</span>
                <span className="text-white font-sans mt-0.5 leading-normal">{data.backups?.recommendation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Variables & Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Variables de Entorno */}
        <div className="lg:col-span-6 bg-[#121212] border border-white/5 p-6 shadow-sm">
          <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
            Variables de Entorno
          </h2>
          <div className="space-y-2.5">
            {Object.entries(data.envVariables).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-2.5 bg-white/[0.01] border border-white/5 font-mono text-[10px]">
                <span className="text-[#f5f5f0]/80 tracking-wider truncate mr-2" title={key}>
                  {key}
                </span>
                {val === 'configured' ? (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[8px] rounded font-bold uppercase tracking-wider">
                    ✔ Existe
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] rounded font-bold uppercase tracking-wider">
                    ❌ No existe
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Métricas de Pedidos e Info Sistema */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Métricas de Pedidos */}
          <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex-1">
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Métricas de Pedidos (OMS)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Total</span>
                <span className="text-xl font-bold text-[#f5f5f0]">{data.orders.total}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Pagados</span>
                <span className="text-xl font-bold text-green-400">{data.orders.paid}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Pendientes</span>
                <span className="text-xl font-bold text-yellow-500">{data.orders.pending}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">En fábrica</span>
                <span className="text-xl font-bold text-indigo-400">{data.orders.production}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Enviados</span>
                <span className="text-xl font-bold text-emerald-400">{data.orders.shipped}</span>
              </div>
              <div className="p-3 bg-white/[0.01] border border-white/5 text-center">
                <span className="text-[9px] text-[var(--muted)] uppercase block">Errores</span>
                <span className="text-xl font-bold text-red-500">{data.orders.failed}</span>
              </div>
            </div>
          </div>

          {/* Sistema */}
          <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Información de la Aplicación
            </h2>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Versión Next.js:</span>
                <span className="text-[#f5f5f0]">{data.system.nextVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Entorno:</span>
                <span className="text-indigo-400 uppercase font-bold">{data.system.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Git Commit SHA:</span>
                <span className="text-[#f5f5f0] truncate max-w-[150px]">{data.system.buildId}</span>
              </div>
            </div>
          </div>

          {/* Estado de Drops */}
          {data.drops && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
                Monitor de Lanzamientos (Drops)
              </h2>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Drop Activo:</span>
                  <span className="text-[var(--primary)] font-bold">{data.drops.activeDrop}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Estado Drop:</span>
                  <span className={`px-2 py-0.5 border text-[8px] rounded font-bold uppercase tracking-wider ${
                    data.drops.status === 'LIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    data.drops.status === 'COMING_SOON' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' :
                    'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {data.drops.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Prendas Asignadas:</span>
                  <span className="text-[#f5f5f0]">{data.drops.productsCount} productos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Stock Virtual Disponible:</span>
                  <span className="text-[#f5f5f0] font-bold">{data.drops.totalVirtualStock} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Apertura Programada:</span>
                  <span className="text-[#f5f5f0]">{data.drops.openingAt !== '—' ? new Date(data.drops.openingAt).toLocaleString('es-ES') : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Cierre Programado:</span>
                  <span className="text-[#f5f5f0]">{data.drops.closingAt !== '—' ? new Date(data.drops.closingAt).toLocaleString('es-ES') : '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Métricas de Lista de Espera */}
          {(data as any).waitlist && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
                Métricas de Lista de Espera (Waitlist)
              </h2>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Registrados Totales:</span>
                  <span className="text-[var(--primary)] font-bold">{(data as any).waitlist.total} leads</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Siguiente Drop Waitlist:</span>
                  <span className="text-[#f5f5f0]">
                    {(data as any).waitlist.nextDropWaitlist} leads ({(data as any).waitlist.nextDropName})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Último Registro:</span>
                  <span className="text-[#f5f5f0] truncate max-w-[200px]" title={(data as any).waitlist.lastRegister}>
                    {(data as any).waitlist.lastRegister}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Confirmaciones Enviadas:</span>
                  <span className="text-green-400 font-bold">{(data as any).waitlist.emailStatus?.success || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Envíos Fallidos/Pendientes:</span>
                  <span className="text-red-400 font-bold">{(data as any).waitlist.emailStatus?.failed || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Métricas de Descuentos */}
          {(data as any).discounts && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
                Métricas de Cupones y Descuentos
              </h2>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Cupones Activos / Vigentes:</span>
                  <span className="text-green-400 font-bold">{(data as any).discounts.active} cupones</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Cupones Inactivos / Expirados:</span>
                  <span className="text-white/40">{(data as any).discounts.expired} cupones</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Redenciones Totales:</span>
                  <span className="text-[var(--primary)] font-bold">{(data as any).discounts.used} redenciones</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Descuentos Aplicados Hoy:</span>
                  <span className="text-[#f5f5f0] font-bold">{formatPrice((data as any).discounts.appliedToday)}</span>
                </div>
              </div>
            </div>
          )}

          {/* SEO y Rendimiento Detalle */}
          {data.seoPerformance && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
                Checklist SEO y Rendimiento
              </h2>
              <div className="space-y-3.5 font-mono text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Sitemap.xml dinámico:</span>
                  <span className={`px-2 py-0.5 border text-[8px] rounded font-bold uppercase tracking-wider ${
                    data.seoPerformance.sitemapAvailable ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {data.seoPerformance.sitemapAvailable ? 'Disponible' : 'Falta'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Robots.txt global:</span>
                  <span className={`px-2 py-0.5 border text-[8px] rounded font-bold uppercase tracking-wider ${
                    data.seoPerformance.robotsAvailable ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {data.seoPerformance.robotsAvailable ? 'Disponible' : 'Falta'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Metadatos Configurados:</span>
                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] rounded font-bold uppercase tracking-wider">
                    Correcto
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Páginas Legales:</span>
                  <span className={`px-2 py-0.5 border text-[8px] rounded font-bold uppercase tracking-wider ${
                    data.seoPerformance.legalPagesAvailable ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {data.seoPerformance.legalPagesAvailable ? 'Correcto' : 'Incompletas'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Imágenes Optimizadas (next/image):</span>
                  <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] rounded font-bold uppercase tracking-wider">
                    Sí (next/image)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Estado de Indexación:</span>
                  <span className={`px-2 py-0.5 border text-[8px] rounded font-bold uppercase tracking-wider ${
                    data.seoPerformance.indexingStatus === 'preparado' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {data.seoPerformance.indexingStatus}
                  </span>
                </div>

                {data.seoPerformance.warnings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <span className="text-[9px] tracking-wider text-amber-400 uppercase font-bold block">Advertencias Pendientes:</span>
                    <ul className="list-disc pl-4 space-y-1.5 text-[9px] text-[var(--muted)] leading-relaxed font-sans">
                      {data.seoPerformance.warnings.map((w, idx) => (
                        <li key={idx} className="hover:text-[#f5f5f0]/80 transition-colors">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Métricas de Soporte y Tickets */}
          {data.support && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5 flex items-center justify-between">
                <span>Canal de Soporte e Incidencias</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider ${
                  data.support.urgentTickets > 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {data.support.urgentTickets > 0 ? '⚠ Atención' : '🟢 Al día'}
                </span>
              </h2>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Tickets Activos/Abiertos:</span>
                  <span className="text-[#f5f5f0] font-bold">{data.support.openTickets} tickets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Tickets Urgentes:</span>
                  <span className={data.support.urgentTickets > 0 ? 'text-red-500 font-bold' : 'text-white/40'}>
                    {data.support.urgentTickets} urgentes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Sin responder (Nuevos):</span>
                  <span className={data.support.unrepliedTickets > 0 ? 'text-amber-400 font-bold' : 'text-white/40'}>
                    {data.support.unrepliedTickets} sin responder
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-2.5 border-t border-white/5">
                  <span className="text-[8px] uppercase tracking-wider text-white/40">Último Ticket Recibido:</span>
                  <span className="text-[#f5f5f0] text-[9px] truncate" title={data.support.lastTicketReceived}>
                    {data.support.lastTicketReceived}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Métricas de Portal de Clientes */}
          {data.portal && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5 flex items-center justify-between">
                <span>Portal de Clientes (OTP / Tokens)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Activo
                </span>
              </h2>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Accesos Totales Registrados:</span>
                  <span className="text-[#f5f5f0] font-bold">{data.portal.totalCustomerAccesses} accesos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Errores OTP (Intentos Fallidos):</span>
                  <span className={data.portal.otpErrors > 0 ? 'text-amber-400 font-bold' : 'text-white/40'}>
                    {data.portal.otpErrors} errores
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Enlaces Seguros Activos (30d):</span>
                  <span className="text-indigo-400 font-bold">{data.portal.activeSecureTokens} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Tiempo Medio Auth OTP:</span>
                  <span className="text-[#f5f5f0] font-bold">
                    {data.portal.avgAuthTimeSeconds > 0 ? `${data.portal.avgAuthTimeSeconds} seg` : '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-2.5 border-t border-white/5">
                  <span className="text-[8px] uppercase tracking-wider text-white/40">Último Acceso Registrado:</span>
                  <span className="text-[#f5f5f0] text-[9px] truncate" title={data.portal.lastCustomerAccess}>
                    {data.portal.lastCustomerAccess}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tarjeta de Estado de Configuración Global */}
          {data.configuration && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
              <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5 flex items-center justify-between">
                <span>Configuración Global</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider ${
                  data.configuration.isReadyForProduction ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {data.configuration.isReadyForProduction ? '🟢 Apto Prod' : '🟡 Configurando'}
                </span>
              </h2>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Completado de Configuración:</span>
                  <span className="text-[#f5f5f0] font-bold">{data.configuration.completionPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Requisitos Pendientes:</span>
                  <span className={data.configuration.pendingCount > 0 ? 'text-amber-400 font-bold' : 'text-white/40'}>
                    {data.configuration.pendingCount} elementos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Listo para Producción:</span>
                  <span className={data.configuration.isReadyForProduction ? 'text-green-400 font-bold' : 'text-red-500 font-bold'}>
                    {data.configuration.isReadyForProduction ? 'SÍ' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel de Copias de Seguridad (Backups) */}
      <div className="bg-[#121212] border border-white/5 p-6 shadow-sm font-mono">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-3 border-b border-white/5">
          <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--primary)]" /> Sistema de Copias de Seguridad (Neon Backups)
          </h2>
          <button
            onClick={triggerBackup}
            disabled={backupRunning || !data.backups?.configured}
            className={`px-4 py-2 border text-[10px] uppercase font-bold tracking-wider transition-all duration-300 ${
              backupRunning 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-not-allowed animate-pulse'
                : !data.backups?.configured
                  ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-[var(--primary)]/10 border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 text-[var(--primary)] active:scale-95'
            }`}
          >
            {backupRunning ? 'Ejecutando Backup...' : 'Ejecutar Backup Manual'}
          </button>
        </div>

        {backupResult && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] space-y-1.5 leading-normal">
            <span className="font-bold block">✔ Copia de seguridad completada con éxito:</span>
            <pre className="font-mono text-[9px] text-[#f5f5f0] whitespace-pre-wrap">{backupResult}</pre>
          </div>
        )}

        {backupError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] space-y-1.5 leading-normal">
            <span className="font-bold block">❌ Error ejecutando copia de seguridad:</span>
            <span className="block">{backupError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[10px] text-[var(--muted)] font-mono">
          <div>
            <span className="text-[9px] tracking-wider text-[#f5f5f0] uppercase font-bold block mb-3">
              Información de Configuración
            </span>
            <div className="space-y-2 leading-relaxed">
              <div className="flex justify-between">
                <span>Variables cargadas:</span>
                <span className={data.backups?.configured ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {data.backups?.configured ? '✔ Sí (Neon / PostgreSQL)' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cifrado AES-256-CBC:</span>
                <span className={data.backups?.encryptionActive ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'}>
                  {data.backups?.encryptionActive ? '✔ Activado' : '⚠️ Inactivo (Sin cifrado)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Servidor Serverless (Vercel):</span>
                <span className={data.system.environment === 'production' ? 'text-amber-400' : 'text-white/40'}>
                  {data.system.environment === 'production' ? 'Sí (Backup Manual Local Obligatorio)' : 'No (Desarrollo Local)'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[9px] tracking-wider text-[#f5f5f0] uppercase font-bold block mb-3">
              Documentación y Restauración de Emergencia
            </span>
            <div className="space-y-2 leading-normal font-sans text-xs">
              <p>
                1. Las copias de seguridad locales se almacenan comprimidas y cifradas bajo el directorio <code className="bg-white/5 px-1 py-0.5 font-mono text-[9px]">backups/</code> del proyecto.
              </p>
              <p>
                2. Para realizar un volcado de forma manual, ejecuta en la terminal local:
                <code className="block bg-white/5 px-2 py-1 font-mono text-[8px] mt-1 text-white">npm run backup:db</code>
              </p>
              <p>
                3. Para verificar el último backup local generado sin restaurar:
                <code className="block bg-white/5 px-2 py-1 font-mono text-[8px] mt-1 text-white">npm run backup:verify</code>
              </p>
              <p className="text-amber-400/90 text-[10px]">
                ⚠️ <strong className="font-bold">Restauración:</strong> En caso de emergencia, descifra la copia y restaura manualmente usando psql/pg_restore. Consulta el archivo de guías para el procedimiento paso a paso.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs de Auditoría Recientes */}
      <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
        <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[var(--primary)]" /> Historial de Accesos y Auditoría
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-[9px] tracking-wider text-[var(--muted)] uppercase font-bold">
                <th className="py-2.5">Acción</th>
                <th className="py-2.5">Detalles</th>
                <th className="py-2.5">IP Cliente</th>
                <th className="py-2.5 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--muted)]">
                    No se han registrado logs de auditoría todavía.
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-2.5 font-bold text-[#f5f5f0]">{log.action}</td>
                    <td className="py-2.5 text-[var(--muted)]">{log.details || '—'}</td>
                    <td className="py-2.5 text-[#f5f5f0]/80">{log.ipAddress || '—'}</td>
                    <td className="py-2.5 text-right text-[var(--muted)] text-[10px]">
                      {new Date(log.createdAt).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
