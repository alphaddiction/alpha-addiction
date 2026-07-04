'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  GraduationCap, 
  Check, 
  X, 
  Clock, 
  FileText, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Inbox
} from 'lucide-react';
import Link from 'next/link';

interface SuggestedCourse {
  id: string;
  title: string;
  description: string | null;
  category: string;
  createdAt: string;
  lessons?: Array<{
    id: string;
    content: string;
  }>;
}

function ReviewQueueInner() {
  const [suggestions, setSuggestions] = useState<SuggestedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Importer state
  const [importTitle, setImportTitle] = useState('');
  const [importCat, setImportCat] = useState('Marca');
  const [importContent, setImportContent] = useState('');
  const [importing, setImporting] = useState(false);

  // Edit suggestions state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai/academy?status=suggested');
      const data = await res.json();
      if (data.success) {
        // Cargar lecciones para cada curso sugerido
        const list = data.courses || [];
        const fullList = await Promise.all(list.map(async (c: any) => {
          const detailRes = await fetch(`/api/admin/ai/academy?mode=course-details&courseId=${c.id}`);
          const detailData = await detailRes.json();
          return {
            ...c,
            lessons: detailData.course?.lessons || []
          };
        }));
        setSuggestions(fullList);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleDecision = async (courseId: string, decision: 'approve' | 'reject', textToSave?: string) => {
    try {
      const res = await fetch('/api/admin/ai/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review-action',
          courseId,
          decision,
          editedContent: textToSave
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchSuggestions();
      }
    } catch (err) {
      console.error('Failed to update suggestion decision:', err);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle || !importContent) return;
    setImporting(true);
    try {
      const res = await fetch('/api/admin/ai/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          title: importTitle,
          category: importCat,
          content: importContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setImportTitle('');
        setImportContent('');
        fetchSuggestions();
      }
    } catch (err) {
      console.error('Failed to import documentation:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f0] p-6 sm:p-12 font-mono">
      {/* Back button */}
      <Link 
        href="/admin/academy" 
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white mb-6 uppercase tracking-wider transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a Academy Center
      </Link>

      {/* Header */}
      <div className="border-b border-white/5 pb-8 mb-8">
        <div className="flex items-center gap-2.5 text-[var(--primary)] uppercase text-[10px] tracking-[0.25em] font-bold mb-1">
          <GraduationCap className="w-4 h-4 animate-pulse" /> Cola de Aprobación Semántica
        </div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
          Knowledge Review Queue
        </h1>
        <p className="text-xs text-[var(--muted)] max-w-2xl mt-1 leading-relaxed font-sans">
          Revisa y aprueba el conocimiento sugerido por Alpha o importado desde documentos externos. Ninguna regla o política influirá en el comportamiento conversacional de Alpha sin aprobación previa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cola de sugerencias */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[var(--primary)]" /> Propuestas Pendientes
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
              <p className="text-[10px] text-[var(--muted)] tracking-widest uppercase">Cargando sugerencias...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="border border-dashed border-white/10 p-12 text-center text-[var(--muted)] text-xs uppercase font-mono">
              Sin sugerencias de aprendizaje pendientes de revisión.
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((sug) => {
                const lessonContent = sug.lessons?.[0]?.content || '';
                const isEditing = editingId === sug.id;

                return (
                  <div key={sug.id} className="bg-[#121212] border border-white/5 p-5 flex flex-col justify-between font-sans">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border bg-amber-500/10 text-amber-400 border-amber-500/20 font-mono">
                          {sug.category}
                        </span>
                        <h3 className="text-sm font-bold text-white font-mono mt-2">{sug.title}</h3>
                      </div>
                      <span className="text-[8px] text-[var(--muted)] font-mono">
                        {new Date(sug.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-black/30 border border-white/5 p-4 rounded text-xs text-white/80 leading-relaxed font-sans mb-4">
                      {isEditing ? (
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          rows={4}
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none focus:border-[var(--primary)] font-sans"
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{lessonContent}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/5 pt-3 mt-2">
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleDecision(sug.id, 'approve', editedText)}
                              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Guardar y Aprobar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 bg-white/5 text-[var(--muted)] hover:text-white border border-white/10 font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDecision(sug.id, 'approve')}
                              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Aprobar
                            </button>
                            <button
                              onClick={() => { setEditingId(sug.id); setEditedText(lessonContent); }}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 text-[#f5f5f0] hover:bg-white/[0.08] font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Editar
                            </button>
                          </>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => handleDecision(sug.id, 'reject')}
                          className="px-3 py-1.5 text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Importador Manual */}
        <div className="lg:col-span-4 bg-[#121212] border border-white/5 p-6 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" /> Importar Documentación
          </h3>
          <p className="text-[10px] text-[var(--muted)] font-sans leading-relaxed mb-6">
            Pega extractos de directrices operativas o archivos Markdown. El sistema los analizará y propondrá como lecciones pendientes en la cola.
          </p>

          <form onSubmit={handleImport} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Título / Nombre</label>
              <input
                type="text"
                value={importTitle}
                onChange={(e) => setImportTitle(e.target.value)}
                required
                placeholder="Ej: Directrices de branding 2026"
                className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Categoría</label>
              <select
                value={importCat}
                onChange={(e) => setImportCat(e.target.value)}
                className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
              >
                <option value="Marca">Marca</option>
                <option value="Soporte">Soporte</option>
                <option value="Drops">Drops</option>
                <option value="Printful">Printful</option>
                <option value="PayPal">PayPal</option>
                <option value="Logística">Logística</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Contenido (Texto / Markdown)</label>
              <textarea
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                required
                placeholder="Ej: Nunca dar descuentos mayores al 15% sin autorización..."
                rows={8}
                className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={importing}
              className="w-full py-2.5 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-black hover:text-white border border-[var(--primary)] cursor-pointer flex items-center justify-center gap-1.5"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                </>
              ) : (
                <>Procesar e Importar</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReviewQueuePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-black text-[#f5f5f0] font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">Cargando cola de revisión...</p>
      </div>
    }>
      <ReviewQueueInner />
    </Suspense>
  );
}
