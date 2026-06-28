'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  Building2,
  FileText,
  Plug,
  ShoppingBag,
  Mail,
  Calendar,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
} from 'lucide-react';

interface SettingsData {
  [key: string]: string;
}

interface Checklist {
  completionPercentage: number;
  isReadyForProduction: boolean;
  pendingItems: string[];
}

interface Integrations {
  printful: 'configured' | 'sandbox' | 'pending';
  paypal: 'configured' | 'sandbox' | 'pending';
  resend: 'configured' | 'pending';
  google_analytics: 'configured' | 'pending';
  google_search_console: 'configured' | 'pending';
  meta_pixel: 'configured' | 'pending';
  tiktok_pixel: 'configured' | 'pending';
}

function SettingsCenterInner() {
  const [settings, setSettings] = useState<SettingsData>({});
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [integrations, setIntegrations] = useState<Integrations | null>(null);

  const [activeTab, setActiveTab] = useState<string>('empresa');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const tabQuery = searchParams.get('tab');

  useEffect(() => {
    if (tabQuery) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Error al conectar con la API de configuración.');
      const data = await res.json();
      setSettings(data.settings || {});
      setChecklist(data.checklist || null);
      setIntegrations(data.integrations || null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar configuraciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al guardar la configuración.');
      }

      setSuccess('Configuración guardada correctamente.');
      await fetchSettings(); // Refrescar porcentaje y checklist
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Exportar configuración a un archivo JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "alpha-addiction-settings-export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Mensaje provisional para importación
  const handleImportPlaceholder = () => {
    alert('La importación automática de configuraciones en formato JSON se implementará en la próxima sub-fase. La arquitectura del sistema ya está lista y validada.');
  };

  const getIntegrationBadge = (status: 'configured' | 'sandbox' | 'pending') => {
    if (status === 'configured') return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (status === 'sandbox') return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
    return 'bg-red-500/10 border-red-500/20 text-red-500';
  };

  const getIntegrationLabel = (status: 'configured' | 'sandbox' | 'pending') => {
    if (status === 'configured') return '🟢 Configurada';
    if (status === 'sandbox') return '🟡 Sandbox';
    return '🔴 No configurada';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">Cargando Centro de Configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">Centro de Administración</span>
          <h1 className="text-3xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
            Configuración Global
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer text-white"
          >
            <Download className="w-3.5 h-3.5 text-[var(--primary)]" /> Exportar JSON
          </button>
          <button
            onClick={handleImportPlaceholder}
            className="flex items-center gap-1.5 px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer text-white/50"
          >
            <Upload className="w-3.5 h-3.5" /> Importar JSON
          </button>
        </div>
      </div>

      {/* Grid: Lado Izquierdo (Módulos/Tabs) y Lado Derecho (Detalle del Formulario + Barra Progreso) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Listado de Módulos (col-span-3) */}
        <div className="lg:col-span-3 space-y-2 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-white/40 block px-3 mb-2">Módulos del Sistema</span>
          {[
            { id: 'empresa', label: 'Empresa', icon: Building2 },
            { id: 'legal', label: 'Datos Legales', icon: FileText },
            { id: 'integraciones', label: 'Integraciones', icon: Plug },
            { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
            { id: 'emails', label: 'Emails', icon: Mail },
            { id: 'drops', label: 'Drops', icon: Calendar },
            { id: 'seguridad', label: 'Seguridad', icon: ShieldAlert },
            { id: 'sistema', label: 'Sistema', icon: Sliders },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setSuccess(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 border text-xs tracking-wider uppercase font-bold text-left transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white/[0.02] border-[var(--primary)] text-[var(--primary)] font-bold'
                    : 'bg-[#111111]/40 border-white/5 text-[var(--muted)] hover:text-white hover:border-white/10'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Columna Derecha: Formulario y Checklist (col-span-9) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Card de Progreso General */}
          {checklist && (
            <div className="bg-[#121212] border border-white/5 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
              <div className="absolute inset-0 border border-[var(--primary)]/2 pointer-events-none" />
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold font-mono">Completado de Configuración</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-serif font-bold text-[#f5f5f0]">{checklist.completionPercentage}%</span>
                  <div className="w-48 bg-white/5 h-2 rounded overflow-hidden">
                    <div 
                      className="bg-[var(--primary)] h-2 rounded transition-all duration-500" 
                      style={{ width: `${checklist.completionPercentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-[9px] text-[var(--muted)] leading-relaxed">
                  Completa todos los requisitos para poder habilitar el **Modo Producción** de la tienda.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1 font-mono text-[9px]">
                <span className="text-white/40 uppercase">Preparado para producción:</span>
                {checklist.isReadyForProduction ? (
                  <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded">
                    ✓ SÍ (APTO)
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded">
                    ⚠ NO (REQUISITOS PENDIENTES)
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 p-4 text-xs font-mono text-red-400 flex flex-col gap-2">
              <span className="flex items-center gap-1.5 font-bold"><AlertTriangle className="w-4 h-4" /> {error}</span>
              {checklist && checklist.pendingItems.length > 0 && settings['system_mode'] === 'production' && (
                <div className="mt-2 pt-2 border-t border-red-500/10">
                  <span className="text-[10px] font-bold block mb-1">Debes configurar:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[10px]">
                    {checklist.pendingItems.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          {/* Formulario Principal */}
          <form onSubmit={handleSubmit} className="bg-[#111111]/90 border border-white/5 p-6 sm:p-8 space-y-8 relative">
            
            {/* TIPO 1: EMPRESA */}
            {activeTab === 'empresa' && (
              <div className="space-y-6 text-xs">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Información Corporativa de la Empresa
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Nombre Comercial</label>
                    <input
                      type="text"
                      value={settings['company_name'] || ''}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="Ej. Alpha Addiction"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Razón Social</label>
                    <input
                      type="text"
                      value={settings['company_social'] || ''}
                      onChange={(e) => handleInputChange('company_social', e.target.value)}
                      placeholder="Ej. Alpha Addiction S.L."
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">NIF / CIF Fiscal</label>
                    <input
                      type="text"
                      value={settings['company_nif'] || ''}
                      onChange={(e) => handleInputChange('company_nif', e.target.value)}
                      placeholder="Ej. B-12345678"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Dominio del Sitio</label>
                    <input
                      type="text"
                      value={settings['company_domain'] || ''}
                      onChange={(e) => handleInputChange('company_domain', e.target.value)}
                      placeholder="Ej. https://alphaddiction.com"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Dirección Fiscal</label>
                  <input
                    type="text"
                    value={settings['company_address'] || ''}
                    onChange={(e) => handleInputChange('company_address', e.target.value)}
                    placeholder="Ej. Calle de la Moda 12, Planta 4"
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Código Postal</label>
                    <input
                      type="text"
                      value={settings['company_postcode'] || ''}
                      onChange={(e) => handleInputChange('company_postcode', e.target.value)}
                      placeholder="Ej. 11001"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Ciudad</label>
                    <input
                      type="text"
                      value={settings['company_city'] || ''}
                      onChange={(e) => handleInputChange('company_city', e.target.value)}
                      placeholder="Ej. Cádiz"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Provincia / País</label>
                    <input
                      type="text"
                      value={settings['company_state'] || ''}
                      onChange={(e) => handleInputChange('company_state', e.target.value)}
                      placeholder="Ej. Cádiz, España"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={settings['company_phone'] || ''}
                      onChange={(e) => handleInputChange('company_phone', e.target.value)}
                      placeholder="Ej. +34 600 000 000"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Email Principal</label>
                    <input
                      type="email"
                      value={settings['company_email'] || ''}
                      onChange={(e) => handleInputChange('company_email', e.target.value)}
                      placeholder="Ej. hola@alphaddiction.com"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Email Legal / Privacidad</label>
                    <input
                      type="email"
                      value={settings['company_email_legal'] || ''}
                      onChange={(e) => handleInputChange('company_email_legal', e.target.value)}
                      placeholder="Ej. privacy@alphaddiction.com"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">URL Logotipo Marca</label>
                    <input
                      type="text"
                      value={settings['company_logo'] || ''}
                      onChange={(e) => handleInputChange('company_logo', e.target.value)}
                      placeholder="Ej. /images/logo.png"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">URL Favicon del Sitio</label>
                    <input
                      type="text"
                      value={settings['company_favicon'] || ''}
                      onChange={(e) => handleInputChange('company_favicon', e.target.value)}
                      placeholder="Ej. /favicon.ico"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Enlaces a Redes Sociales</label>
                  <input
                    type="text"
                    value={settings['company_social_links'] || ''}
                    onChange={(e) => handleInputChange('company_social_links', e.target.value)}
                    placeholder="Ej. instagram:alpha,twitter:alpha"
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* TIPO 2: DATOS LEGALES */}
            {activeTab === 'legal' && (
              <div className="space-y-6 text-xs">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Parámetros RGPD y Textos Legales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Responsable RGPD</label>
                    <input
                      type="text"
                      value={settings['legal_rgpd_responsible'] || ''}
                      onChange={(e) => handleInputChange('legal_rgpd_responsible', e.target.value)}
                      placeholder="Ej. Delegado Protección Datos"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Responsable Tratamiento</label>
                    <input
                      type="text"
                      value={settings['legal_treatment_responsible'] || ''}
                      onChange={(e) => handleInputChange('legal_treatment_responsible', e.target.value)}
                      placeholder="Ej. Alpha Addiction Management"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Texto Aviso Legal *</label>
                  <textarea
                    rows={4}
                    value={settings['legal_aviso_legal'] || ''}
                    onChange={(e) => handleInputChange('legal_aviso_legal', e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Texto Política de Privacidad *</label>
                  <textarea
                    rows={4}
                    value={settings['legal_policy_privacy'] || ''}
                    onChange={(e) => handleInputChange('legal_policy_privacy', e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Texto Política de Cookies *</label>
                  <textarea
                    rows={4}
                    value={settings['legal_policy_cookies'] || ''}
                    onChange={(e) => handleInputChange('legal_policy_cookies', e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Condiciones Generales de Compra *</label>
                  <textarea
                    rows={4}
                    value={settings['legal_conditions_purchase'] || ''}
                    onChange={(e) => handleInputChange('legal_conditions_purchase', e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Políticas de Devolución</label>
                    <textarea
                      rows={3}
                      value={settings['legal_returns'] || ''}
                      onChange={(e) => handleInputChange('legal_returns', e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Políticas de Desistimiento</label>
                    <textarea
                      rows={3}
                      value={settings['legal_withdrawal'] || ''}
                      onChange={(e) => handleInputChange('legal_withdrawal', e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TIPO 3: INTEGRACIONES */}
            {activeTab === 'integraciones' && integrations && (
              <div className="space-y-6 text-xs">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Estado de las Integraciones Externas
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: 'Printful API', key: 'printful' as const, desc: 'Gestión y sincronización de stock y pedidos físicas con Printful.' },
                    { label: 'PayPal Gateway', key: 'paypal' as const, desc: 'Procesador de pagos de clientes y captura de transacciones.' },
                    { label: 'Resend SMTP', key: 'resend' as const, desc: 'Plataforma para el envío de correos transaccionales.' },
                    { label: 'Google Analytics', key: 'google_analytics' as const, desc: 'Seguimiento y telemetría de eventos de marketing y compras.' },
                    { label: 'Google Search Console', key: 'google_search_console' as const, desc: 'Herramienta de indexación e indexabilidad en Google.' },
                    { label: 'Meta Pixel', key: 'meta_pixel' as const, desc: 'Seguimiento de compras y campañas en Facebook e Instagram.' },
                    { label: 'TikTok Pixel', key: 'tiktok_pixel' as const, desc: 'Analíticas de compras desde la plataforma TikTok.' }
                  ].map(item => {
                    const status = integrations[item.key];
                    return (
                      <div key={item.key} className="bg-white/[0.01] border border-white/5 p-4 flex flex-col justify-between gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#f5f5f0]">{item.label}</span>
                          <span className={`px-2 py-0.5 border text-[8px] rounded font-bold font-mono uppercase tracking-wider ${getIntegrationBadge(status)}`}>
                            {getIntegrationLabel(status)}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--muted)] leading-relaxed">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Identificadores de Tracking de Marketing</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Google Analytics ID</label>
                      <input
                        type="text"
                        value={settings['ga_measurement_id'] || ''}
                        onChange={(e) => handleInputChange('ga_measurement_id', e.target.value)}
                        placeholder="Ej. G-XXXXXXXXXX"
                        className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Meta Pixel ID</label>
                      <input
                        type="text"
                        value={settings['meta_pixel_id'] || ''}
                        onChange={(e) => handleInputChange('meta_pixel_id', e.target.value)}
                        placeholder="Ej. XXXXXXXXXXXXXXX"
                        className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">TikTok Pixel ID</label>
                      <input
                        type="text"
                        value={settings['tiktok_pixel_id'] || ''}
                        onChange={(e) => handleInputChange('tiktok_pixel_id', e.target.value)}
                        placeholder="Ej. XXXXXXXXXXXXXXXXXXX"
                        className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">GSC Verification ID</label>
                      <input
                        type="text"
                        value={settings['gsc_verification_id'] || ''}
                        onChange={(e) => handleInputChange('gsc_verification_id', e.target.value)}
                        placeholder="Ej. google-site-verification=XXXXXXX"
                        className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TIPO 4: PEDIDOS */}
            {activeTab === 'pedidos' && (
              <div className="space-y-6 text-xs">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Configuración de la Numeración de Pedidos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Prefijo de Pedido</label>
                    <input
                      type="text"
                      value={settings['order_prefix'] || ''}
                      onChange={(e) => handleInputChange('order_prefix', e.target.value)}
                      placeholder="Ej. AA-"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Número Inicial (Secuencial)</label>
                    <input
                      type="text"
                      value={settings['order_start_num'] || ''}
                      onChange={(e) => handleInputChange('order_start_num', e.target.value)}
                      placeholder="Ej. 10001"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Formato de Numeración</label>
                    <input
                      type="text"
                      value={settings['order_format'] || ''}
                      onChange={(e) => handleInputChange('order_format', e.target.value)}
                      placeholder="Ej. {PREFIX}{NUMBER}"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Estado Inicial de Pedidos</label>
                    <select
                      value={settings['order_initial_status'] || 'draft'}
                      onChange={(e) => handleInputChange('order_initial_status', e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white cursor-pointer"
                    >
                      <option value="draft">Borrador (draft)</option>
                      <option value="paid">Confirmado (paid)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TIPO 5: EMAILS */}
            {activeTab === 'emails' && (
              <div className="space-y-6 text-xs">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Configuración de Envío y Estilos de Emails
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Remitente (Sender)</label>
                    <input
                      type="text"
                      value={settings['email_sender'] || ''}
                      onChange={(e) => handleInputChange('email_sender', e.target.value)}
                      placeholder="Ej. Alpha Addiction <noreply@alphaddiction.com>"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Responder a (Reply-To)</label>
                    <input
                      type="text"
                      value={settings['email_reply_to'] || ''}
                      onChange={(e) => handleInputChange('email_reply_to', e.target.value)}
                      placeholder="Ej. soporte@alphaddiction.com"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">URL Logo en Correos</label>
                    <input
                      type="text"
                      value={settings['email_logo'] || ''}
                      onChange={(e) => handleInputChange('email_logo', e.target.value)}
                      placeholder="Ej. https://alphaddiction.com/images/email-logo.png"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Color Primario (Hex)</label>
                    <input
                      type="text"
                      value={settings['email_colors'] || ''}
                      onChange={(e) => handleInputChange('email_colors', e.target.value)}
                      placeholder="Ej. #d4af37"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Firma del Correo</label>
                  <input
                    type="text"
                    value={settings['email_signature'] || ''}
                    onChange={(e) => handleInputChange('email_signature', e.target.value)}
                    placeholder="Ej. El Equipo de Soporte de Alpha Addiction"
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Pie de Página (Footer de Email)</label>
                  <textarea
                    rows={3}
                    value={settings['email_footer'] || ''}
                    onChange={(e) => handleInputChange('email_footer', e.target.value)}
                    placeholder="Ej. Este correo es confidencial y para uso exclusivo del destinatario."
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* TIPO 6: DROPS */}
            {activeTab === 'drops' && (
              <div className="space-y-6 text-xs">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Configuración de Visualización de Drops
                </h3>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">ID Drop Destacado (Dashboard)</label>
                  <input
                    type="text"
                    value={settings['drops_featured_id'] || ''}
                    onChange={(e) => handleInputChange('drops_featured_id', e.target.value)}
                    placeholder="Ej. d1"
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#f5f5f0]">Mostrar Stock Restante</span>
                      <p className="text-[9px] text-[var(--muted)] leading-relaxed">Muestra stock real a los compradores en la tienda.</p>
                    </div>
                    <select
                      value={settings['drops_show_stock'] || 'false'}
                      onChange={(e) => handleInputChange('drops_show_stock', e.target.value)}
                      className="bg-[#0d0d0d] border border-white/10 p-2 text-white font-bold cursor-pointer"
                    >
                      <option value="true">Sí (Activo)</option>
                      <option value="false">No (Oculto)</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#f5f5f0]">Mostrar Unidades Lanzamiento</span>
                      <p className="text-[9px] text-[var(--muted)] leading-relaxed">Expone las unidades máximas totales de este drop.</p>
                    </div>
                    <select
                      value={settings['drops_show_units'] || 'false'}
                      onChange={(e) => handleInputChange('drops_show_units', e.target.value)}
                      className="bg-[#0d0d0d] border border-white/10 p-2 text-white font-bold cursor-pointer"
                    >
                      <option value="true">Sí (Activo)</option>
                      <option value="false">No (Oculto)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#f5f5f0]">Mostrar Cuenta Atrás</span>
                      <p className="text-[9px] text-[var(--muted)] leading-relaxed">Renderiza un temporizador antes de la apertura del drop.</p>
                    </div>
                    <select
                      value={settings['drops_show_countdown'] || 'false'}
                      onChange={(e) => handleInputChange('drops_show_countdown', e.target.value)}
                      className="bg-[#0d0d0d] border border-white/10 p-2 text-white font-bold cursor-pointer"
                    >
                      <option value="true">Sí (Activo)</option>
                      <option value="false">No (Oculto)</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#f5f5f0]">Activar Formulario Waitlist</span>
                      <p className="text-[9px] text-[var(--muted)] leading-relaxed">Permite registros a lista de espera para el drop.</p>
                    </div>
                    <select
                      value={settings['drops_enable_waitlist'] || 'false'}
                      onChange={(e) => handleInputChange('drops_enable_waitlist', e.target.value)}
                      className="bg-[#0d0d0d] border border-white/10 p-2 text-white font-bold cursor-pointer"
                    >
                      <option value="true">Sí (Activo)</option>
                      <option value="false">No (Oculto)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TIPO 7: SEGURIDAD */}
            {activeTab === 'seguridad' && (
              <div className="space-y-6 text-xs">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Configuraciones de Seguridad y Límites del Sistema
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Tiempo de Sesión de Admin (Minutos)</label>
                    <input
                      type="text"
                      value={settings['security_session_time'] || ''}
                      onChange={(e) => handleInputChange('security_session_time', e.target.value)}
                      placeholder="Ej. 120"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Rate Limit de Solicitudes (Por IP / 10 Min)</label>
                    <input
                      type="text"
                      value={settings['security_rate_limit'] || ''}
                      onChange={(e) => handleInputChange('security_rate_limit', e.target.value)}
                      placeholder="Ej. 100"
                      className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Direcciones IP Permitidas (Admin - Separadas por comas)</label>
                  <input
                    type="text"
                    value={settings['security_allowed_ips'] || ''}
                    onChange={(e) => handleInputChange('security_allowed_ips', e.target.value)}
                    placeholder="Ej. 127.0.0.1, 192.168.1.50 (Vacío = Cualquiera)"
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none font-mono"
                  />
                </div>

                <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#f5f5f0]">Doble Factor Obligatorio (2FA)</span>
                    <p className="text-[9px] text-[var(--muted)] leading-relaxed">Exige inicio de sesión MFA mediante autenticador a todo el staff.</p>
                  </div>
                  <select
                    value={settings['security_2fa_enabled'] || 'false'}
                    onChange={(e) => handleInputChange('security_2fa_enabled', e.target.value)}
                    className="bg-[#0d0d0d] border border-white/10 p-2 text-white font-bold cursor-pointer"
                  >
                    <option value="true">Exigir 2FA</option>
                    <option value="false">Opcional</option>
                  </select>
                </div>
              </div>
            )}

            {/* TIPO 8: SISTEMA / MODOS */}
            {activeTab === 'sistema' && (
              <div className="space-y-6 text-xs font-mono">
                <h3 className="text-sm uppercase tracking-widest text-[#f5f5f0] font-bold font-mono border-b border-white/5 pb-3">
                  Modo de Operación y Mantenimiento del Proyecto
                </h3>

                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold block mb-1">
                    Modo del Proyecto:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'development', label: '🛠 Desarrollo', desc: 'Permite operar sin validaciones estrictas de datos ni credenciales completas de pasarelas.' },
                      { id: 'sandbox', label: '🧪 Sandbox', desc: 'Preparado para simulaciones de compras en pruebas de PayPal, Printful y Resend en sandbox.' },
                      { id: 'production', label: '🟢 Producción', desc: 'Operación real con pasarelas productivas y control de integridad absoluto.' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleInputChange('system_mode', mode.id)}
                        className={`p-4 border text-left flex flex-col gap-2.5 transition-all cursor-pointer ${
                          settings['system_mode'] === mode.id
                            ? 'bg-white/[0.02] border-[var(--primary)] text-[var(--primary)] font-bold'
                            : 'bg-[#111111]/40 border-white/5 text-[var(--muted)] hover:text-[#f5f5f0]'
                        }`}
                      >
                        <span className="text-xs uppercase font-bold">{mode.label}</span>
                        <p className="text-[8px] font-sans leading-relaxed text-[var(--muted)]">{mode.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 mt-6">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#f5f5f0] uppercase text-xs">Modo Mantenimiento Global</span>
                    <p className="text-[9px] font-sans text-[var(--muted)] leading-relaxed">Bloquea el acceso público a la tienda mostrando una página de aviso.</p>
                  </div>
                  <select
                    value={settings['system_maintenance'] || 'false'}
                    onChange={(e) => handleInputChange('system_maintenance', e.target.value)}
                    className="bg-[#0d0d0d] border border-white/10 p-2 text-white font-bold cursor-pointer"
                  >
                    <option value="true">🔴 Mantenimiento Activo</option>
                    <option value="false">🟢 Tienda en Línea</option>
                  </select>
                </div>
              </div>
            )}

            {/* Fila de Botón de Guardado */}
            <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[var(--primary)] hover:bg-black hover:text-white border border-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                  </>
                ) : (
                  'Guardar Configuración'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SettingsCenterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">
          Cargando Configuración...
        </p>
      </div>
    }>
      <SettingsCenterInner />
    </Suspense>
  );
}
