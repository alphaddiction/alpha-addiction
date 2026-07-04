import { db } from '@/lib/db';
import { SecurityLayer } from '../core/security-layer';

export interface CourseData {
  id?: string;
  project: string;
  title: string;
  description?: string | null;
  category: string;
  version?: number;
  status?: string;
  priority?: string;
  author?: string;
  level?: string;
  tags?: string[];
}

export interface LessonData {
  id?: string;
  courseId: string;
  title: string;
  content: string;
  objective?: string | null;
  examples?: any;
  rules?: any;
  cases?: any;
  notes?: string | null;
}

export class AcademyManager {
  /**
   * Crea o actualiza un curso de la academia sanitizando entradas.
   */
  static async upsertCourse(data: CourseData): Promise<any> {
    const cleanTitle = SecurityLayer.sanitizeInput(data.title);
    const cleanDesc = data.description ? SecurityLayer.sanitizeInput(data.description) : null;

    const record = await db.aiCourse.upsert({
      where: { id: data.id || '' },
      create: {
        project: data.project || 'alpha-addiction',
        title: cleanTitle,
        description: cleanDesc,
        category: data.category,
        version: data.version || 1,
        status: data.status || 'draft',
        priority: data.priority || 'normal',
        author: data.author || 'admin',
        level: data.level || 'basic',
        tags: data.tags ? (data.tags as any) : null
      },
      update: {
        title: cleanTitle,
        description: cleanDesc,
        category: data.category,
        version: { increment: 1 },
        status: data.status || 'draft',
        priority: data.priority || 'normal',
        level: data.level || 'basic',
        tags: data.tags ? (data.tags as any) : null
      }
    });

    return record;
  }

  /**
   * Crea o actualiza una lección del curso.
   */
  static async upsertLesson(data: LessonData): Promise<any> {
    const cleanTitle = SecurityLayer.sanitizeInput(data.title);
    const cleanContent = SecurityLayer.sanitizeInput(data.content);

    const record = await db.aiLesson.upsert({
      where: { id: data.id || '' },
      create: {
        courseId: data.courseId,
        title: cleanTitle,
        content: cleanContent,
        objective: data.objective ? SecurityLayer.sanitizeInput(data.objective) : null,
        examples: data.examples ? (data.examples as any) : null,
        rules: data.rules ? (data.rules as any) : null,
        cases: data.cases ? (data.cases as any) : null,
        notes: data.notes ? SecurityLayer.sanitizeInput(data.notes) : null
      },
      update: {
        title: cleanTitle,
        content: cleanContent,
        objective: data.objective ? SecurityLayer.sanitizeInput(data.objective) : null,
        examples: data.examples ? (data.examples as any) : null,
        rules: data.rules ? (data.rules as any) : null,
        cases: data.cases ? (data.cases as any) : null,
        notes: data.notes ? SecurityLayer.sanitizeInput(data.notes) : null
      }
    });

    return record;
  }

  /**
   * Elimina un curso y sus lecciones.
   */
  static async deleteCourse(id: string): Promise<boolean> {
    try {
      await db.aiCourse.delete({ where: { id } });
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Elimina una lección específica.
   */
  static async deleteLesson(id: string): Promise<boolean> {
    try {
      await db.aiLesson.delete({ where: { id } });
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Calcula el porcentaje de cobertura de documentación de la academia por categoría.
   */
  static async calculateCoverage(project = 'alpha-addiction') {
    const categories = [
      { name: 'Empresa', target: 2 },
      { name: 'Marca', target: 3 },
      { name: 'Producto', target: 2 },
      { name: 'Marketing', target: 2 },
      { name: 'Soporte', target: 3 },
      { name: 'Logística', target: 2 },
      { name: 'PayPal', target: 2 },
      { name: 'Printful', target: 2 }
    ];

    const courses = await db.aiCourse.findMany({
      where: { project, OR: [{ status: 'published' }, { status: 'approved' }] },
      include: { _count: { select: { lessons: true } } }
    });

    const coverage = categories.map((cat) => {
      const categoryCourses = courses.filter((c) => c.category === cat.name);
      const totalLessons = categoryCourses.reduce((sum, c) => sum + c._count.lessons, 0);
      const percentage = cat.target > 0 ? Math.min(100, Math.round((totalLessons / cat.target) * 100)) : 0;
      return {
        category: cat.name,
        lessonsCount: totalLessons,
        target: cat.target,
        percentage
      };
    });

    const totalPercentage = Math.round(coverage.reduce((sum, item) => sum + item.percentage, 0) / categories.length);

    return {
      totalPercentage,
      details: coverage
    };
  }

  /**
   * RAG Query Retriever. Recupera las lecciones y procedimientos relacionados
   * con la intención (marca, comunicación, políticas o procedimientos).
   */
  static async retrieveAcademyContext(project: string, query: string): Promise<string> {
    const startTime = performance.now();
    try {
      const cleanQuery = query.toLowerCase().trim();
      const terms = cleanQuery.split(/\s+/).filter((t) => t.length > 3);

      const publishedCourses = await db.aiCourse.findMany({
        where: { project, status: 'approved' },
        include: { lessons: true }
      });

      const matchedLessons: any[] = [];
      for (const course of publishedCourses) {
        for (const lesson of course.lessons) {
          const matchText = `${course.title} ${course.category} ${lesson.title} ${lesson.content}`.toLowerCase();
          
          if (matchText.includes(cleanQuery) || terms.some((t) => matchText.includes(t))) {
            matchedLessons.push({ course, lesson });
          }
        }
      }

      if (matchedLessons.length === 0) return '';

      let contextStr = `\n--- PAUTAS Y PROCEDIMIENTOS DE LA ACADEMIA ALPHA ---\n`;
      const added = new Set<string>();

      for (const item of matchedLessons.slice(0, 3)) {
        const key = `${item.course.id}-${item.lesson.id}`;
        if (!added.has(key)) {
          contextStr += `[CURSO: ${item.course.title}] Lección: ${item.lesson.title}\n`;
          contextStr += `Pautas/Procedimiento:\n${item.lesson.content}\n`;
          if (item.lesson.rules) {
            contextStr += `Reglas obligatorias: ${JSON.stringify(item.lesson.rules)}\n`;
          }
          contextStr += `\n`;
          added.add(key);
        }
      }

      const duration = Math.round(performance.now() - startTime);
      console.log(`🎓 [AcademyManager] Retrieved ${added.size} academy context rules in ${duration}ms.`);

      try {
        await db.auditLog.create({
          data: {
            action: 'AI_ACADEMY_RETRIEVE',
            details: JSON.stringify({
              query,
              rulesCount: added.size,
              durationMs: duration
            })
          }
        });
      } catch (_) {}

      return contextStr;
    } catch (err) {
      console.error('❌ [AcademyManager] Failed to retrieve academy context:', err);
      return '';
    }
  }

  /**
   * Sembrar datos por defecto de la academia si está vacía.
   */
  static async seedInitialAcademy(): Promise<void> {
    const count = await db.aiCourse.count();
    if (count > 0) return;

    try {
      console.log('🎓 [AcademyManager] Seeding default company training courses...');

      // 1. Curso de Filosofía de Marca
      const brandCourse = await this.upsertCourse({
        project: 'alpha-addiction',
        title: 'Filosofía y Tono de Marca Alpha Addiction',
        description: 'Pautas esenciales sobre cómo se comunica Alpha Addiction y los valores de marca.',
        category: 'Marca',
        status: 'approved',
        priority: 'high',
        level: 'basic'
      });

      if (brandCourse.id) {
        await this.upsertLesson({
          courseId: brandCourse.id,
          title: 'Tono, Voz y Mensajería',
          content: 'Alpha Addiction utiliza siempre un tono minimalista, sofisticado, sobrio y exclusivo. Evitar saludos informales exagerados (hola colega, qué tal, etc.). Hablar con elegancia en español. Nunca mostrar agresividad comercial.',
          objective: 'Mantener consistencia estética en toda la interacción conversacional.',
          rules: ['Tono sobrio y elegante', 'Exclusividad en las respuestas', 'Nunca saludar coloquialmente']
        });
      }

      // 2. Curso de Políticas de Soporte
      const supportCourse = await this.upsertCourse({
        project: 'alpha-addiction',
        title: 'Políticas de Soporte y Devoluciones',
        description: 'Cómo responder reclamos de clientes sobre pedidos, envíos o cancelaciones.',
        category: 'Soporte',
        status: 'approved',
        priority: 'high',
        level: 'basic'
      });

      if (supportCourse.id) {
        await this.upsertLesson({
          courseId: supportCourse.id,
          title: 'Política de Reembolsos por Desperfectos',
          content: 'Si un cliente recibe una prenda dañada o con mala impresión de Printful, se le ofrece un reenvío gratuito sin coste o el reembolso total del importe. Solicitar siempre fotografía legible del desperfecto como prueba.',
          objective: 'Resolver incidencias de calidad con el fulfillment de Printful.',
          rules: ['Reenvío gratuito por daños', 'Exigir fotografía legible', 'Opción de reembolso completo']
        });
      }

      // 3. Curso de Procedimiento de Lanzamiento (Drops)
      const dropsCourse = await this.upsertCourse({
        project: 'alpha-addiction',
        title: 'Procedimiento de Lanzamientos de Drops',
        description: 'Paso a paso de cómo configurar y abrir un Drop de forma segura.',
        category: 'Drops',
        status: 'approved',
        priority: 'normal',
        level: 'intermediate'
      });

      if (dropsCourse.id) {
        await this.upsertLesson({
          courseId: dropsCourse.id,
          title: 'Verificaciones Previas a la Apertura',
          content: 'Antes de abrir un Drop: 1. Comprobar que los productos están sincronizados en Printful. 2. Verificar que los precios y mockups cargan bien. 3. Probar cupones de descuento exclusivos. 4. Mandar correo de pre-aviso a los registrados en la waitlist.',
          objective: 'Asegurar que la experiencia de compra en el drop sea perfecta.',
          rules: ['Sincronización Printful completada', 'Email de aviso enviado a waitlist']
        });
      }

      console.log('✓ Company training seeded successfully.');
    } catch (err) {
      console.error('❌ Failed to seed academy:', err);
    }
  }

  /**
   * Crea una propuesta sugerida de aprendizaje para revisión del administrador.
   */
  static async suggestLearningOpportunity(project: string, source: string, title: string, content: string, category = 'Marca'): Promise<any> {
    const cleanTitle = SecurityLayer.sanitizeInput(title);
    
    // Buscar si ya existe la propuesta para evitar duplicar
    const existing = await db.aiCourse.findFirst({
      where: { project, title: `Sugerencia: ${cleanTitle}`, status: 'suggested' }
    });
    if (existing) {
      return existing;
    }

    const course = await this.upsertCourse({
      project,
      title: `Sugerencia: ${cleanTitle}`,
      category,
      status: 'suggested',
      priority: 'normal',
      level: 'basic',
      description: `Propuesta automática de aprendizaje detectada desde ${source}.`
    });

    if (course.id) {
      await this.upsertLesson({
        courseId: course.id,
        title: 'Hecho detectado',
        content,
        objective: 'Aprobación del administrador',
        rules: []
      });
    }

    console.log(`🎓 [AcademyManager] Created suggested training opportunity: "Sugerencia: ${cleanTitle}"`);
    return course;
  }

  /**
   * Importa documentación externa y la guarda como propuesta sugerida.
   */
  static async importDocumentation(project: string, title: string, category: string, content: string): Promise<any> {
    return this.suggestLearningOpportunity(project, 'Importador Markdown', title, content, category);
  }
}
