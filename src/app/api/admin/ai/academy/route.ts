import { NextResponse } from 'next/server';
import { db } from '@/backend/database/db';
import { AcademyManager } from '@/core/knowledge/academy-manager';

/**
 * GET /api/admin/ai/academy
 * Recupera cursos (por categoría, búsqueda o estado particular), detalles o métricas.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'courses'; // courses, course-details, coverage
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const courseId = searchParams.get('courseId') || '';
    const status = searchParams.get('status') || ''; // suggested, approved, rejected, draft, archived
    const project = searchParams.get('project') || 'alpha-addiction';

    // Sembrar datos por defecto si la academia está vacía
    await AcademyManager.seedInitialAcademy();

    if (mode === 'coverage') {
      const stats = await AcademyManager.calculateCoverage(project);
      return NextResponse.json({ success: true, coverage: stats });
    }

    if (mode === 'course-details' && courseId) {
      const course = await db.aiCourse.findUnique({
        where: { id: courseId },
        include: { lessons: true }
      });
      return NextResponse.json({ success: true, course });
    }

    // Listar cursos con filtros
    const whereClause: any = { project };
    
    if (status) {
      whereClause.status = status;
    } else {
      // Por defecto en la vista del catálogo excluir sugeridos y rechazados de la vista estándar si no se pide explícitamente
      whereClause.status = { in: ['approved', 'published', 'draft'] };
    }

    if (category) {
      whereClause.category = category;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const records = await db.aiCourse.findMany({
      where: whereClause,
      include: {
        _count: { select: { lessons: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, courses: records });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error loading academy' }, { status: 500 });
  }
}

/**
 * POST /api/admin/ai/academy
 * Guarda, edita, duplica o ejecuta acciones en la cola de revisión de la Knowledge Base Viva.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Importer
    if (action === 'import') {
      const { title, category, content } = body;
      if (!title || !category || !content) {
        return NextResponse.json({ success: false, error: 'Title, category, and markdown content are required to import' }, { status: 400 });
      }
      const suggested = await AcademyManager.importDocumentation('alpha-addiction', title, category, content);
      return NextResponse.json({ success: true, course: suggested });
    }

    // Acciones de revisión
    if (action === 'review-action') {
      const { courseId, decision, editedContent } = body; // approve, reject, later
      if (!courseId || !decision) {
        return NextResponse.json({ success: false, error: 'courseId and decision are required' }, { status: 400 });
      }

      if (decision === 'approve') {
        if (editedContent) {
          // Si editó la lección, actualizamos la lección correspondiente del curso
          const firstLesson = await db.aiLesson.findFirst({ where: { courseId } });
          if (firstLesson) {
            await db.aiLesson.update({
              where: { id: firstLesson.id },
              data: { content: editedContent }
            });
          }
        }
        await db.aiCourse.update({
          where: { id: courseId },
          data: { status: 'approved' }
        });
        console.log(`🎓 [Academy API] Approved suggested course ID: ${courseId}`);
      } else if (decision === 'reject') {
        await db.aiCourse.update({
          where: { id: courseId },
          data: { status: 'rejected' }
        });
        console.log(`🎓 [Academy API] Rejected suggested course ID: ${courseId}`);
      }

      return NextResponse.json({ success: true });
    }

    const { type, id, courseId, title, description, category, status, priority, author, level, tags, content, objective, examples, rules, cases, notes } = body;

    if (type === 'lesson') {
      if (!courseId || !title || !content) {
        return NextResponse.json({ success: false, error: 'CourseId, title, and content are required for a lesson' }, { status: 400 });
      }
      const savedLesson = await AcademyManager.upsertLesson({
        id,
        courseId,
        title,
        content,
        objective,
        examples,
        rules,
        cases,
        notes
      });
      return NextResponse.json({ success: true, lesson: savedLesson });
    }

    // Por defecto upsertCourse
    if (!title || !category) {
      return NextResponse.json({ success: false, error: 'Title and category are required for a course' }, { status: 400 });
    }

    const savedCourse = await AcademyManager.upsertCourse({
      id,
      project: 'alpha-addiction',
      title,
      description,
      category,
      status: status || 'draft',
      priority: priority || 'normal',
      author: author || 'admin',
      level: level || 'basic',
      tags
    });

    return NextResponse.json({ success: true, course: savedCourse });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error processing request' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ai/academy
 * Elimina un curso o lección.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    if (courseId) {
      await AcademyManager.deleteCourse(courseId);
      return NextResponse.json({ success: true, message: 'Course deleted successfully' });
    }

    if (lessonId) {
      await AcademyManager.deleteLesson(lessonId);
      return NextResponse.json({ success: true, message: 'Lesson deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Either courseId or lessonId is required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error deleting item' }, { status: 500 });
  }
}
