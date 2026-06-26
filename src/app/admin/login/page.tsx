'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Flujo simulado de login para la Fase 2
    setTimeout(() => {
      if (email === 'admin@alpha.com' && password === 'alpha123') {
        document.cookie = 'alpha_session=active; path=/admin; max-age=86400; SameSite=Strict';
        router.push('/admin/dashboard');
      } else {
        setError('Las credenciales proporcionadas no son válidas. Revisa e inténtalo de nuevo.');
        setIsSubmitting(false);
      }
    }, 1200);
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
            <Lock className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-serif tracking-[0.25em] font-bold text-[#f5f5f0] uppercase">
            ALPHA
          </h2>
          <p className="text-[10px] tracking-[0.15em] text-[var(--muted)] font-medium uppercase mt-1">
            Alpha Control Center
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex gap-3 items-start leading-relaxed">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="admin@alpha.com"
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

          {/* Botón Entrar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full py-4 bg-[var(--primary)] text-black uppercase tracking-widest text-xs font-semibold
              flex items-center justify-center gap-2.5 transition-all hover:bg-white disabled:opacity-50
            "
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              <>
                <span>Acceder al Panel</span>
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
