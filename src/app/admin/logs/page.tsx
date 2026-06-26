import { FileText } from 'lucide-react';

export default function LogsPage() {
  return (
    <div className="space-y-6">
      {/* Header del Módulo */}
      <div>
        <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
          Alpha Control Center
        </span>
        <h1 className="text-2xl font-serif font-bold text-[#f5f5f0] tracking-wider uppercase mt-1">
          Registro de Auditoría
        </h1>
      </div>

      {/* Contenido principal */}
      <div className="bg-[#121212] border border-white/5 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-[var(--primary)]/10 text-[var(--primary)] p-4 rounded-full mb-4 animate-pulse">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-serif font-semibold text-[#f5f5f0] uppercase tracking-wider mb-2">
          Módulo en Desarrollo
        </h2>
        <p className="text-xs text-[var(--muted)] max-w-md tracking-wider leading-relaxed">
          Historial completo e inmutable de acciones realizadas por el equipo de administración y estados del sistema.
        </p>
        <span className="mt-6 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded text-[9px] uppercase tracking-widest font-bold">
          Estado: Planificado / En Desarrollo
        </span>
      </div>
    </div>
  );
}
