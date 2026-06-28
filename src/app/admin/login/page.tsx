'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldAlert, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (requires2FA) {
        // Enviar segundo paso (TOTP / Recovery Code)
        const res = await fetch('/api/admin/login/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: twoFactorCode }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || 'Código incorrecto.');
        }

        router.push('/admin/dashboard');
      } else {
        // Enviar primer paso (Usuario + Contraseña)
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Credenciales inválidas.');
        }

        if (data.requires2FA) {
          setRequires2FA(true);
          setIsSubmitting(false);
        } else {
          router.push('/admin/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al verificar credenciales.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0] flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Elementos visuales de fondo abstractos */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square bg-[#fff]/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Tarjeta de Inicio de Sesión */}
      <div className="w-full max-w-md bg-[#121212] border border-white/5 p-8 shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <span className="bg-[var(--primary)]/10 text-[var(--primary)] p-2.5 rounded mb-4">
            {requires2FA ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </span>
          <h2 className="text-xl font-serif tracking-[0.25em] font-bold text-[#f5f5f0] uppercase">
            ALPHA
          </h2>
          <p className="text-[10px] tracking-[0.15em] text-[var(--muted)] font-medium uppercase mt-1">
            Alpha Control Center
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex gap-3 items-start leading-relaxed font-mono">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!requires2FA ? (
            <>
              {/* Campo Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-[9px] tracking-widest uppercase text-[#f5f5f0]/70 font-semibold">
                  Email del Administrador
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="admin@alpha-addiction.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="
                      w-full bg-transparent border border-white/10 pl-10 pr-4 py-3
                      text-sm focus:outline-none focus:border-[var(--primary)] transition-colors
                      placeholder-[#f5f5f0]/20 text-[#f5f5f0]
                    "
                  />
                  <Mail className="w-4 h-4 text-[#f5f5f0]/30 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-[9px] tracking-widest uppercase text-[#f5f5f0]/70 font-semibold">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="
                      w-full bg-transparent border border-white/10 pl-10 pr-4 py-3
                      text-sm focus:outline-none focus:border-[var(--primary)] transition-colors
                      placeholder-[#f5f5f0]/20 text-[#f5f5f0]
                    "
                  />
                  <Lock className="w-4 h-4 text-[#f5f5f0]/30 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          ) : (
            /* Campo 2FA */
            <div className="space-y-2 font-mono">
              <label htmlFor="2fa-code" className="text-[9px] tracking-widest uppercase text-[var(--primary)] font-semibold">
                Código de Doble Factor (TOTP)
              </label>
              <div className="relative">
                <input
                  id="2fa-code"
                  type="text"
                  required
                  placeholder="Introduce código de 6 cifras o código de recuperación"
                  value={twoFactorCode}
                  onChange={e => setTwoFactorCode(e.target.value)}
                  className="
                    w-full bg-transparent border border-white/10 pl-10 pr-4 py-3
                    text-sm focus:outline-none focus:border-[var(--primary)] transition-colors
                    placeholder-[#f5f5f0]/20 text-[#f5f5f0]
                  "
                />
                <ShieldCheck className="w-4 h-4 text-[#f5f5f0]/30 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[8px] text-[var(--muted)] leading-relaxed mt-1">
                Escribe el código temporal de tu app autenticadora o uno de tus códigos de recuperación AAAA-BBBB.
              </p>
            </div>
          )}

          {/* Botón Entrar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full py-4 bg-[var(--primary)] text-black uppercase tracking-widest text-xs font-semibold
              flex items-center justify-center gap-2.5 transition-all hover:bg-white disabled:opacity-50 cursor-pointer
            "
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              <>
                <span>{requires2FA ? 'Confirmar Código' : 'Acceder al Panel'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[9px] text-[var(--muted)] tracking-wider">
          <p>ACCESO EXCLUSIVO PARA ADMINISTRADORES AUTORIZADOS</p>
          <p className="mt-1">© 2026 ALPHA ADDICTION</p>
        </div>
      </div>
    </div>
  );
}
