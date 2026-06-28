'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  QrCode,
  Lock,
  Copy,
  RefreshCw,
  Download,
  AlertTriangle,
} from 'lucide-react';

interface TwoFactorStatus {
  twoFactorEnabled: boolean;
  twoFactorConfirmedAt: string | null;
  twoFactorLastUsedAt: string | null;
  lastSecurityEventAt: string | null;
  email: string;
  role: string;
  recoveryCodesCount: number;
}

export default function SecurityPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados del asistente de activación (Setup Wizard)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [setupData, setSetupData] = useState<{ manualKey: string; qrCodeUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // Estados del asistente de desactivación (Disable Wizard)
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableRecoveryCode, setDisableRecoveryCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/security/2fa/status');
      if (!res.ok) throw new Error('Error al consultar el estado de seguridad.');
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Iniciar el Asistente de Activación 2FA
  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setRecoveryCodes([]);
    try {
      const res = await fetch('/api/admin/security/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al iniciar 2FA.');
      setSetupData(data);
      setWizardOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar y Activar 2FA
  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/security/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Código incorrecto.');
      
      setRecoveryCodes(data.recoveryCodes || []);
      setSuccess('¡Autenticación de doble factor (2FA) activada con éxito!');
      setWizardOpen(false);
      setSetupData(null);
      setVerificationCode('');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActivationLoading(false);
    }
  };

  // Regenerar códigos de recuperación
  const handleRegenerateCodes = async () => {
    if (!confirm('¿Estás seguro de que deseas regenerar tus códigos de recuperación? Los códigos anteriores dejarán de ser válidos inmediatamente.')) {
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    setRecoveryCodes([]);
    try {
      const res = await fetch('/api/admin/security/2fa/recovery-codes/regenerate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al regenerar códigos.');
      setRecoveryCodes(data.recoveryCodes || []);
      setSuccess('Nuevos códigos de recuperación generados correctamente.');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Desactivar 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabling(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/security/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: disablePassword || undefined,
          code: disableCode || undefined,
          recoveryCode: disableRecoveryCode || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al desactivar.');
      
      setSuccess('2FA desactivado correctamente.');
      setDisableOpen(false);
      setDisablePassword('');
      setDisableCode('');
      setDisableRecoveryCode('');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDisabling(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    alert('Códigos copiados al portapapeles.');
  };

  const handleDownloadCodes = () => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(
      "ALPHA ADDICTION - CÓDIGOS DE RECUPERACIÓN 2FA\n" +
      "Guarda estos códigos en un lugar seguro. Cada uno es de un solo uso.\n\n" +
      recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "alpha-addiction-recovery-codes.txt");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading && !wizardOpen && !disableOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">Cargando Módulo de Seguridad...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Cabecera del Módulo */}
      <div>
        <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
          Alpha Control Center
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
          Seguridad y Doble Factor (2FA)
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 p-4 text-xs font-mono text-red-400 flex items-center gap-1.5 leading-relaxed">
          <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> {success}
        </div>
      )}

      {/* RENDERIZADO DE NUEVOS CÓDIGOS DE RECUPERACIÓN (Mostrar solo una vez tras activar/regenerar) */}
      {recoveryCodes.length > 0 && (
        <div className="bg-indigo-950/20 border border-indigo-500/30 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 rounded">
              <Download className="w-5 h-5 text-indigo-400 animate-bounce" />
            </span>
            <div>
              <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Códigos de Recuperación Generados</h3>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">Guarda estos códigos en un lugar seguro. Solo se mostrarán una vez. Sirven para desactivar 2FA o loguearte si pierdes tu autenticador.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 font-mono text-xs text-center">
            {recoveryCodes.map((code, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/5 py-2.5 px-3 rounded text-[var(--primary)] font-bold tracking-widest">
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              onClick={handleCopyCodes}
              className="flex items-center gap-1.5 px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer text-white"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar al Portapapeles
            </button>
            <button
              onClick={handleDownloadCodes}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Descargar (.txt)
            </button>
          </div>
        </div>
      )}

      {/* Bloque de Estado 2FA */}
      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Información de Estado (col-span-8) */}
          <div className="lg:col-span-8 bg-[#111111]/90 border border-white/5 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-5">
              <div className="flex items-center gap-4">
                <span className={`p-3 rounded-full flex items-center justify-center ${
                  status.twoFactorEnabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'
                }`}>
                  <Shield className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Doble Factor de Autenticación (TOTP)</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 border ${
                      status.twoFactorEnabled ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {status.twoFactorEnabled ? '🟢 Activado' : '🔴 Desactivado'}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">({status.email})</span>
                  </div>
                </div>
              </div>

              <div>
                {!status.twoFactorEnabled ? (
                  <button
                    onClick={handleStartSetup}
                    className="px-6 py-2.5 bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors cursor-pointer"
                  >
                    Activar 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDisableOpen(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Desactivar 2FA
                  </button>
                )}
              </div>
            </div>

            {/* Metadatos detallados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono text-[var(--muted)]">
              <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded">
                <span className="text-[8px] uppercase tracking-wider text-white/40 block">Historial de Doble Factor</span>
                <div className="flex justify-between">
                  <span>Activación:</span>
                  <span className="text-white">{status.twoFactorConfirmedAt ? new Date(status.twoFactorConfirmedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Último uso:</span>
                  <span className="text-white">{status.twoFactorLastUsedAt ? new Date(status.twoFactorLastUsedAt).toLocaleDateString() + ' ' + new Date(status.twoFactorLastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuentas activas:</span>
                  <span className="text-white">1 (Staff Principal)</span>
                </div>
              </div>

              <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded">
                <span className="text-[8px] uppercase tracking-wider text-white/40 block">Seguridad del Panel</span>
                <div className="flex justify-between">
                  <span>Códigos de recuperación:</span>
                  <span className="text-white">{status.twoFactorEnabled ? `${status.recoveryCodesCount} códigos restantes` : 'Desactivado'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Criptografía de secretos:</span>
                  <span className="text-green-400 font-bold">AES-256-CBC</span>
                </div>
                {status.twoFactorEnabled && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleRegenerateCodes}
                      className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-[var(--primary)] hover:underline cursor-pointer font-bold"
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerar Códigos
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Recomendaciones y logs (col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111111]/90 border border-white/5 p-6 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold font-mono border-b border-white/5 pb-3">Recomendaciones OWASP</h3>
              <ul className="text-[10px] space-y-2 text-[var(--muted)] list-disc pl-4 leading-relaxed font-sans">
                <li>Utiliza apps locales seguras (Google Authenticator, Authy, Bitwarden) para escanear el código QR.</li>
                <li><strong>No guardes los códigos de recuperación en el mismo dispositivo</strong> que utilizas para el TOTP.</li>
                <li>Habilitar 2FA es obligatorio en el control de producción.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* WIZARD: ASISTENTE DE CONFIGURACIÓN Y ACTIVACIÓN (SETUP) */}
      {wizardOpen && setupData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <QrCode className="w-5 h-5 text-[var(--primary)]" /> Configurar Autenticador (TOTP)
            </h3>

            <div className="space-y-4 text-xs">
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                Escanea el código QR inferior con tu aplicación autenticadora (Google Authenticator, Authy, Bitwarden, etc.) o introduce la clave manual si tu aplicación no soporta QR.
              </p>

              {/* Imagen del Código QR */}
              <div className="flex justify-center bg-white p-4 max-w-[200px] mx-auto border border-white/10 rounded">
                <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-[180px] h-[180px] object-contain" />
              </div>

              {/* Clave Manual */}
              <div className="space-y-1.5 bg-white/[0.01] border border-white/5 p-3 rounded">
                <span className="text-[8px] uppercase tracking-wider text-[var(--muted)] font-bold font-mono block">Clave Manual / Secreto</span>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-[var(--primary)] font-bold tracking-wider">{setupData.manualKey}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.manualKey);
                      alert('Clave manual copiada.');
                    }}
                    className="p-1 text-white hover:text-[var(--primary)] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Formulario de Confirmación */}
              <form onSubmit={handleVerifyAndActivate} className="pt-2 border-t border-white/5 space-y-4 font-mono">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--primary)] font-bold block">Introduce el código generado:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-3 text-white focus:border-[var(--primary)] outline-none text-center font-bold text-lg tracking-[0.25em]"
                  />
                  <span className="text-[8px] text-[var(--muted)] leading-relaxed block mt-1">Escribe las 6 cifras temporales de tu autenticador para validar el emparejamiento.</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardOpen(false)}
                    className="px-4 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 text-[10px] uppercase tracking-widest font-bold transition-all text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={activationLoading || verificationCode.length !== 6}
                    className="px-6 py-2.5 bg-[var(--primary)] text-black font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {activationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar y Activar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: DESACTIVAR 2FA (DISABLE WIZARD) */}
      {disableOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Desactivar Autenticación 2FA
            </h3>

            <form onSubmit={handleDisable2FA} className="space-y-4 text-xs font-mono">
              <p className="text-[9px] text-[var(--muted)] leading-relaxed font-sans">
                Para desactivar la autenticación de doble factor, introduce tu contraseña actual junto al código TOTP de 6 dígitos. Alternativamente, puedes usar un código de recuperación.
              </p>

              {/* Campos Estándar */}
              <div className="space-y-3 pt-1 border-b border-white/5 pb-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase tracking-wider text-[var(--muted)] font-bold block">Contraseña del Administrador</label>
                  <input
                    type="password"
                    placeholder="Contraseña actual"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-2.5 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase tracking-wider text-[var(--muted)] font-bold block">Código TOTP (6 dígitos)</label>
                  <input
                    type="text"
                    placeholder="Código de tu app"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#0d0d0d] border border-white/10 p-2.5 text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              {/* Campos de Recuperación Alternativos */}
              <div className="space-y-1.5">
                <label className="text-[8px] uppercase tracking-wider text-amber-500 font-bold block">O usar Código de Recuperación (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. AAAA-BBBB"
                  value={disableRecoveryCode}
                  onChange={(e) => setDisableRecoveryCode(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 p-2.5 text-white focus:border-[var(--primary)] outline-none text-center font-bold tracking-widest text-[var(--primary)]"
                />
                <span className="text-[8px] text-white/30 block leading-relaxed">
                  Si pierdes tu dispositivo autenticador, escribe aquí un código de un solo uso para desactivar la protección.
                </span>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDisableOpen(false)}
                  className="px-4 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 text-[10px] uppercase tracking-widest font-bold transition-all text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={disabling}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {disabling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Desactivación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
