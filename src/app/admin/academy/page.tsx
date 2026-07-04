'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Search, 
  Trash2, 
  Plus, 
  Download, 
  BookOpen, 
  Award, 
  Sparkles, 
  AlertTriangle,
  Loader2,
  X,
  FileText,
  CheckCircle,
  Eye,
  Send,
  HelpCircle,
  Clock
} from 'lucide-react';

interface CourseItem {
  id: string;
  project: string;
  title: string;
  description: string | null;
  category: string;
  version: number;
  status: string;
  priority: string;
  author: string;
  level: string;
  _count?: {
    lessons: number;
  };
}

interface LessonItem {
  id: string;
  title: string;
  content: string;
  objective: string | null;
  notes: string | null;
}

interface CoverageItem {
  category: string;
  lessonsCount: number;
  target: number;
  percentage: number;
}

function AcademyCenterInner() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coverage, setCoverage] = useState<CoverageItem[]>([]);
  const [totalCoverage, setTotalCoverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Modales
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);

  // Course Form
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('Marca');
  const [formPriority, setFormPriority] = useState('normal');
  const [formLevel, setFormLevel] = useState('basic');

  // Lesson Form
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonObj, setLessonObj] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const coursesRes = await fetch(`/api/admin/ai/academy?search=${encodeURIComponent(search)}&category=${selectedCategory}`);
      const coursesData = await coursesRes.json();
      if (coursesData.success) setCourses(coursesData.courses || []);

      const covRes = await fetch(`/api/admin/ai/academy?mode=coverage`);
      const covData = await covRes.json();
      if (covData.success) {
        setCoverage(covData.coverage?.details || []);
        setTotalCoverage(covData.coverage?.totalPercentage || 0);
      }
    } catch (err) {
      console.error('Failed to load academy training:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ai/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          category: formCat,
          priority: formPriority,
          level: formLevel,
          status: 'published'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCourseModal(false);
        resetCourseForm();
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add course:', err);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const res = await fetch('/api/admin/ai/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson',
          courseId: selectedCourse.id,
          title: lessonTitle,
          content: lessonContent,
          objective: lessonObj,
          notes: lessonNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddLessonModal(false);
        resetLessonForm();
        // Recargar detalles
        viewCourseDetails(selectedCourse);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add lesson:', err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('¿Eliminar este curso de entrenamiento y todas sus lecciones de forma permanente?')) return;
    try {
      const res = await fetch(`/api/admin/ai/academy?courseId=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('¿Eliminar esta lección del curso?')) return;
    try {
      const res = await fetch(`/api/admin/ai/academy?lessonId=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (selectedCourse) viewCourseDetails(selectedCourse);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete lesson:', err);
    }
  };

  const viewCourseDetails = async (course: CourseItem) => {
    setSelectedCourse(course);
    try {
      const res = await fetch(`/api/admin/ai/academy?mode=course-details&courseId=${course.id}`);
      const data = await res.json();
      if (data.success) {
        setLessons(data.course?.lessons || []);
        setShowDetailsModal(true);
      }
    } catch (_) {}
  };

  const resetCourseForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormCat('Marca');
    setFormPriority('normal');
    setFormLevel('basic');
  };

  const resetLessonForm = () => {
    setLessonTitle('');
    setLessonContent('');
    setLessonObj('');
    setLessonNotes('');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(courses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `alpha_academy_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f0] p-6 sm:p-12 font-mono">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-2.5 text-[var(--primary)] uppercase text-[10px] tracking-[0.25em] font-bold mb-1">
            <GraduationCap className="w-4 h-4 animate-pulse" /> Entrenamiento Corporativo Alpha
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
            Alpha Academy
          </h1>
          <p className="text-xs text-[var(--muted)] max-w-xl mt-1 leading-relaxed font-sans">
            Define la voz de la marca, las políticas de reembolso y los flujos de lanzamiento del ecommerce. Alpha aprende estas lecciones de forma relacional y estructurada.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/academy/review"
            className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500 text-amber-400 hover:text-black font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 font-mono"
          >
            <Clock className="w-3.5 h-3.5" /> Cola de Revisión
          </Link>
          <button
            onClick={() => { resetCourseForm(); setShowAddCourseModal(true); }}
            className="px-5 py-2.5 bg-[var(--primary)] text-black hover:bg-black hover:text-white border border-[var(--primary)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Curso
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-[#f5f5f0] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {/* Coverage Widget */}
      <div className="bg-[#121212] border border-white/5 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--primary)] animate-pulse" /> Cobertura de Entrenamiento
            </h3>
            <p className="text-[10px] text-[var(--muted)] font-sans mt-0.5">Nivel de lecciones y procedimientos documentados en la academia.</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-serif font-bold text-white">{totalCoverage}%</span>
            <span className="text-[8px] uppercase tracking-widest text-[var(--muted)] block">Índice Global</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-[9px]">
          {coverage.map((cov, idx) => (
            <div key={idx} className="bg-black/40 border border-white/5 p-3 flex flex-col justify-between min-h-[70px]">
              <span className="text-[var(--muted)] uppercase font-mono tracking-wider truncate" title={cov.category}>{cov.category}</span>
              <div className="mt-2.5">
                <div className="flex justify-between text-white font-bold mb-1">
                  <span>{cov.lessonsCount} Lecc.</span>
                  <span>{cov.percentage}%</span>
                </div>
                <div className="w-full bg-white/5 h-1">
                  <div className="bg-[var(--primary)] h-1" style={{ width: `${cov.percentage}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111111]/40 border border-white/5 p-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o descripción del curso..."
            className="w-full bg-black border border-white/10 p-2.5 pl-10 text-xs text-white focus:border-[var(--primary)] outline-none"
          />
        </div>

        <div className="flex gap-2">
          {['', 'Marca', 'Soporte', 'Drops', 'Printful', 'PayPal', 'Logística'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 border text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                selectedCategory === c 
                  ? 'bg-white/[0.02] border-[var(--primary)] text-[var(--primary)]' 
                  : 'bg-black border-white/10 text-[var(--muted)] hover:text-white'
              }`}
            >
              {c === '' ? 'Todos' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cursos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--muted)] tracking-widest uppercase">Cargando Academia...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="border border-dashed border-white/10 p-16 text-center text-[var(--muted)] text-xs uppercase">
          No hay cursos configurados en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-[#121212] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-all font-sans relative group">
              <div>
                <div className="flex justify-between items-start mb-3 font-mono">
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border bg-purple-500/10 text-purple-400 border-purple-500/20">
                    {course.category}
                  </span>
                  <span className="text-[8px] text-[var(--muted)]">v{course.version}</span>
                </div>
                <h3 className="text-sm font-bold text-white font-mono mb-2">{course.title}</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">{course.description || 'Sin descripción.'}</p>
              </div>

              <div className="border-t border-white/5 pt-3 mt-4 flex justify-between items-center text-[8px] font-mono">
                <button
                  onClick={() => viewCourseDetails(course)}
                  className="flex items-center gap-1 text-[var(--primary)] hover:underline cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" /> Ver Lecciones ({course._count?.lessons || 0})
                </button>

                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-red-400 hover:text-red-300 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Detalles del Curso / Lecciones */}
      {showDetailsModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-2xl p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <BookOpen className="w-4 h-4 animate-pulse" /> Lecciones del Curso
              </span>
              <button onClick={() => setShowDetailsModal(false)} className="text-white/60 hover:text-white cursor-pointer font-mono">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1 font-mono">{selectedCourse.title}</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-sans">{selectedCourse.description}</p>
            </div>

            {/* Listado de Lecciones */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6 font-mono text-xs">
              {lessons.length === 0 ? (
                <p className="text-white/40 italic py-4">No hay lecciones agregadas a este curso.</p>
              ) : (
                lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-black/30 border border-white/5 p-4 rounded font-sans relative group">
                    <div className="flex justify-between items-center mb-2 font-mono">
                      <span className="font-bold text-white text-[11px]">{lesson.title}</span>
                      <button 
                        onClick={() => handleDeleteLesson(lesson.id)} 
                        className="text-red-400 hover:text-red-300 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer font-mono text-[9px]"
                      >
                        Eliminar Lección
                      </button>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed bg-[#0a0a0a] p-3 border border-white/5 whitespace-pre-wrap">{lesson.content}</p>
                    {lesson.objective && (
                      <div className="mt-2 text-[9px] text-[var(--muted)] font-mono">
                        <strong className="text-[var(--primary)]">Objetivo:</strong> {lesson.objective}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-between gap-2.5">
              <button
                onClick={() => setShowAddLessonModal(true)}
                className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold text-[10px] tracking-wider transition-all cursor-pointer font-mono flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Lección
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer font-mono"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Curso */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <GraduationCap className="w-4 h-4 animate-pulse" /> Crear Curso de Entrenamiento
              </span>
              <button onClick={() => setShowAddCourseModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Categoría del Curso</label>
                <select
                  value={formCat}
                  onChange={(e) => setFormCat(e.target.value)}
                  className="w-full bg-black border border-white/10 p-2.5 text-white font-sans focus:border-[var(--primary)] outline-none"
                >
                  <option value="Marca">Marca (Tono, voz, branding)</option>
                  <option value="Soporte">Soporte (Devoluciones, tickets)</option>
                  <option value="Drops">Drops (Lanzamientos, waitlist)</option>
                  <option value="Printful">Printful (Fulfillment, stock)</option>
                  <option value="PayPal">PayPal (Pagos, disputas)</option>
                  <option value="Logística">Logística (Fletes, tracking)</option>
                  <option value="Marketing">Marketing (Promociones, SEO)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Título del Curso</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder="Ej: Políticas de Devolución por Desperfectos"
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Descripción</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Añade descripción o metas del curso..."
                  rows={4}
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Prioridad</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
                  >
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Nivel</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
                  >
                    <option value="basic">Básico</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-black hover:text-white border border-[var(--primary)] cursor-pointer"
                >
                  Crear Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Lección */}
      {showAddLessonModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md p-6 font-sans">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 font-mono">
              <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-xs flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 animate-pulse" /> Agregar Lección de Aprendizaje
              </span>
              <button onClick={() => setShowAddLessonModal(false)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Título de la Lección</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  required
                  placeholder="Ej: Respuestas ante prendas defectuosas"
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Contenido (Pautas y Procedimientos)</label>
                <textarea
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  required
                  placeholder="Redacta las pautas detalladas o procedimientos obligatorios que Alpha debe acatar..."
                  rows={6}
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Objetivo de Aprendizaje</label>
                <input
                  type="text"
                  value={lessonObj}
                  onChange={(e) => setLessonObj(e.target.value)}
                  placeholder="Ej: Asegurar consistencia en políticas de garantía"
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Notas de Soporte</label>
                <input
                  type="text"
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  placeholder="Ej: Caso aplicable solo a incidencias de menos de 30 días"
                  className="w-full bg-black border border-white/10 p-2 text-white font-sans focus:border-[var(--primary)] outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-[var(--muted)] hover:text-white uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--primary)] text-black font-bold uppercase text-[10px] tracking-wider transition-all hover:bg-black hover:text-white border border-[var(--primary)] cursor-pointer"
                >
                  Guardar Lección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AcademyCenterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-black text-[#f5f5f0] font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--muted)] tracking-[0.25em] uppercase font-semibold">Cargando Academy Center...</p>
      </div>
    }>
      <AcademyCenterInner />
    </Suspense>
  );
}
