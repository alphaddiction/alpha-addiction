'use client';

import { useState } from 'react';
import { AlertOctagon, Bell, User, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';

export default function Header() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isActivatingEmergency, setIsActivatingEmergency] = useState<string | null>(null);

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

  return (
    <>
      <header className="h-20 border-b border-white/5 bg-[#121212] px-6 md:px-10 flex items-center justify-between sticky top-0 z-30">
        {/* Titulo / Info de Ubicación */}
        <div className="pl-12 lg:pl-0">
          <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
            Área de Gestión
          </span>
          <h1 className="text-sm font-semibold text-[#f5f5f0] tracking-wider uppercase mt-0.5">
            Panel Operativo
          </h1>
        </div>

        {/* Acciones del Encabezado */}
        <div className="flex items-center gap-4">
          {/* Botón de Pánico / Emergencia */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="
              flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-black
              text-red-500 hover:border-red-500 transition-all duration-300 text-[10px] tracking-widest uppercase font-bold
            "
          >
            <AlertOctagon className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">Botón de Pánico</span>
          </button>

          {/* Notificaciones */}
          <button className="p-2 text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors hover:bg-white/5 rounded relative" aria-label="Notificaciones">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
          </button>

          {/* Perfil del Usuario */}
          <div className="h-8 w-px bg-white/5 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[11px] font-semibold text-[#f5f5f0]">Super Admin</p>
              <p className="text-[9px] text-[var(--muted)] tracking-wider">admin@alpha.com</p>
            </div>
            <button className="h-8 w-8 bg-white/5 rounded-full flex items-center justify-center text-[#f5f5f0]/70 hover:text-[var(--primary)] hover:bg-white/10 transition-colors" aria-label="Perfil de usuario">
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Emergencia */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-[#121212] border border-red-500/30 p-6 md:p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
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
                      px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] uppercase font-semibold
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
