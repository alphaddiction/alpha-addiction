import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth-tokens';
import { RouteContextDetector } from '@/modules/alpha-intelligence/context/detector';
import { AlphaIntelligenceOrchestrator } from '@/modules/alpha-intelligence/core/orchestrator';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function POST(req: Request) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { conversationId, message, pathname } = body;

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // 1. Detectar contexto dinámico de la página actual
    const detector = new RouteContextDetector();
    const routeContext = pathname ? await detector.detectAndGetContext(pathname) : null;

    // 2. Procesar mensaje del usuario
    const orchestrator = new AlphaIntelligenceOrchestrator();
    const aiResponse = await orchestrator.processUserMessage(
      conversationId,
      message,
      routeContext,
      pathname
    );

    if (aiResponse.error) {
      return NextResponse.json(
        { error: aiResponse.content, details: aiResponse.error },
        { status: 500 }
      );
    }

    return NextResponse.json(aiResponse);
  } catch (err: any) {
    console.error('❌ [Chat API POST] Error:', err);
    return NextResponse.json({ error: 'Error interno al procesar el mensaje.' }, { status: 500 });
  }
}
