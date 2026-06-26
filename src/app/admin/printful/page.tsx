'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shirt,
  Layers,
  Terminal,
} from 'lucide-react';

interface SyncStats {
  totalLocalProducts: number;
  totalRemoteProducts: number;
  matchedProducts: number;
  missingProducts: number;
  orphanedProducts: number;
}

interface SyncSummary {
  timestamp: string;
  stats: SyncStats;
  duplicateSkus: string[];
  duplicatePrintfulVariantIds: number[];
  comparison: Array<{
    slug: string;
    name: string;
    status: 'vinculado' | 'no_vinculado_en_printful';
    printfulProductId: number | null;
    totalLocalVariants: number;
    totalRemoteVariants: number;
    matchedVariants: number;
    missingVariants: number;
    orphanedRemoteVariantsCount: number;
    variants: any[];
  }>;
}

/**
 * Página interactiva /admin/printful
 * 
 * Presenta una interfaz de diagnóstico detallada de la conexión con Printful,
 * listando variables operativas, estados de conectividad, mapeos y alertas de consistencia.
 */
export default function PrintfulDiagnosticPage() {
  const [connection, setConnection] = useState<{ success: boolean; message: string; code: number } | null>(null);
  const [syncData, setSyncData] = useState<SyncSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [envExists, setEnvExists] = useState<boolean>(false);

  const checkConnectionAndSync = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Consultar estado del test de conectividad
      const connRes = await fetch('/api/printful/test');
      const connResult = await connRes.json();
      setConnection(connResult);

      // 2. Realizar sincronización y contraste lógico de catálogos
      const syncRes = await fetch('/api/printful/sync-products', { method: 'POST' });
      if (!syncRes.ok) {
        throw new Error('Fallo al consultar el servidor de sincronización.');
      }
      const syncResult = await syncRes.json();
      if (syncResult.success) {
        setSyncData(syncResult.summary);
      } else {
        throw new Error(syncResult.error || 'Respuesta de sincronización no exitosa.');
      }

      // 3. Comprobar existencia de PRINTFUL_API_KEY
      const statusRes = await fetch('/api/admin/integrations/status');
      if (statusRes.ok) {
        const integrations = await statusRes.json();
        const printfulInt = integrations.find((i: any) => i.key === 'printful');
        if (printfulInt && printfulInt.requiredVars) {
          const apiKeyVar = printfulInt.requiredVars.find((v: any) => v.key === 'PRINTFUL_API_KEY');
          setEnvExists(!!apiKeyVar?.exists);
        }
      }
    } catch (err) {
      console.error('❌ Error al cargar diagnósticos de Printful:', err);
      setError('Fallo de comunicación con la API de diagnóstico interna.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionAndSync();
  }, [checkConnectionAndSync]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Cargando panel de diagnóstico...
        </p>
      </div>
    );
  }

  // Recopilar alertas detectadas
  const errorsList: string[] = [];
  if (syncData) {
    if (syncData.duplicateSkus && syncData.duplicateSkus.length > 0) {
      errorsList.push(`Códigos de SKU duplicados encontrados en Printful: ${syncData.duplicateSkus.join(', ')}`);
    }
    if (syncData.duplicatePrintfulVariantIds && syncData.duplicatePrintfulVariantIds.length > 0) {
      errorsList.push(`Variant IDs de Printful duplicados: ${syncData.duplicatePrintfulVariantIds.join(', ')}`);
    }
    if (syncData.stats.missingProducts > 0) {
      errorsList.push(`Se detectaron ${syncData.stats.missingProducts} productos en el catálogo local sin correspondencia en Printful.`);
    }
  }

  const lastCheckDate = syncData?.timestamp
    ? new Date(syncData.timestamp).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'No disponible';

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Alpha Control Center
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Módulo Printful Status
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Bitácora: {lastCheckDate}</span>
          </div>
          <button
            onClick={() => checkConnectionAndSync(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-[#f5f5f0] hover:text-[var(--primary)] transition-all uppercase tracking-widest font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Reevaluar Estado</span>
          </button>
        </div>
      </div>

      {/* Grid de Diagnósticos de Alto Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Conexión */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Servidor Remoto</span>
            <span className={`p-2 rounded ${connection?.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#f5f5f0]">
            {connection?.success ? 'CONECTADO' : 'DESCONECTADO'}
          </h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">
            {connection?.success ? 'Respuesta API exitosa.' : 'Fallo en llamada o credencial errónea.'}
          </p>
        </div>

        {/* Productos Remotos */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Printful Store</span>
            <span className="bg-purple-500/10 text-purple-400 p-2 rounded">
              <Shirt className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">
            {syncData?.stats.totalRemoteProducts || 0} Prod / {syncData?.stats.orphanedProducts || 0} Libres
          </h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">Productos listados en catálogo de Printful</p>
        </div>

        {/* Productos Vinculados */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Mapeo Catálogo</span>
            <span className="bg-blue-500/10 text-blue-400 p-2 rounded">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">
            {syncData?.stats.matchedProducts || 0} Vinculados / {syncData?.stats.missingProducts || 0} Pendientes
          </h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">Coincidencias en base a Slug / External_ID</p>
        </div>

        {/* Alertas */}
        <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Integridad</span>
            <span className={`p-2 rounded ${errorsList.length === 0 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">
            {errorsList.length === 0 ? 'INTEGRO' : `${errorsList.length} Alertas`}
          </h3>
          <p className="text-[9px] text-[var(--muted)] mt-2 tracking-wider">Anomalías detectadas en variables o SKUs</p>
        </div>
      </div>

      {/* Grid central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Estado de Variables */}
        <div className="lg:col-span-5 bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Variables Requeridas
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 font-mono text-[11px]">
                <span className="text-[#f5f5f0]/80">PRINTFUL_API_KEY</span>
                {envExists ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] rounded font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configurada
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] rounded font-bold uppercase tracking-wider animate-pulse">
                    <XCircle className="w-3.5 h-3.5" /> Ausente
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.01] border border-white/5 p-4 rounded mt-6">
            <p className="text-[10px] text-[var(--muted)] leading-relaxed tracking-wide font-mono">
              * Nota: El valor físico del token de la API de Printful permanece oculto para evitar su exposición y robo.
            </p>
          </div>
        </div>

        {/* Listado de Alertas */}
        <div className="lg:col-span-7 bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
              Alertas del Sistema
            </h2>
            {errorsList.length === 0 ? (
              <div className="flex items-center gap-3.5 p-4 bg-green-500/5 border border-green-500/10 rounded">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-xs text-[var(--muted)] tracking-wide">
                  No se han encontrado anomalías. La coherencia de variantes y SKUs es correcta.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {errorsList.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--muted)] tracking-wide leading-relaxed">
                      {err}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seguridad TODO */}
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded mt-6 flex items-start gap-3">
            <div className="text-xs">
              <h4 className="font-semibold text-[#f5f5f0] tracking-wide uppercase text-[9px] text-[var(--primary)]">Seguridad y Acceso (TODO):</h4>
              <p className="text-[10px] text-[var(--muted)] mt-1.5 leading-relaxed font-mono">
                // TODO: Rutas de diagnóstico admin protegidas de forma básica por proxy de autenticación (alpha_session cookie en proxy.ts). Asegurar control de accesos IAM de producción antes del lanzamiento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Comparación */}
      <div className="bg-[#121212] border border-white/5 p-6 md:p-8 shadow-sm">
        <h2 className="text-sm font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mb-6 pb-3 border-b border-white/5">
          Estado de Vinculación de Productos
        </h2>
        {error ? (
          <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-500 text-xs rounded text-center">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] tracking-widest text-[var(--muted)] uppercase font-semibold">
                  <th className="py-4">Nombre / Slug</th>
                  <th className="py-4">Mapeo</th>
                  <th className="py-4 text-center">Tallas / Colores Locales</th>
                  <th className="py-4 text-center">Tallas / Colores Printful</th>
                  <th className="py-4 text-center">Coincidencia</th>
                  <th className="py-4 text-right">ID Printful</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {syncData?.comparison.map((item) => (
                  <tr key={item.slug} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 font-semibold text-[#f5f5f0]">
                      {item.name}
                      <span className="block font-mono text-[10px] text-[var(--muted)] mt-0.5 font-normal">
                        {item.slug}
                      </span>
                    </td>
                    <td className="py-4">
                      {item.status === 'vinculado' ? (
                        <span className="inline-block px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] rounded font-bold uppercase tracking-wider font-mono">
                          Vinculado
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] rounded font-bold uppercase tracking-wider animate-pulse font-mono">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center font-mono">{item.totalLocalVariants}</td>
                    <td className="py-4 text-center font-mono">{item.totalRemoteVariants}</td>
                    <td className="py-4 text-center font-mono">
                      <span className={item.matchedVariants === item.totalLocalVariants ? 'text-green-400' : 'text-yellow-500'}>
                        {item.matchedVariants} / {item.totalLocalVariants}
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono text-[var(--muted)]">
                      {item.printfulProductId || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
