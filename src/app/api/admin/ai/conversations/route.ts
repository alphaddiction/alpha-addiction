import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/backend/auth/auth-tokens';
import { DbMemoryManager } from '@/core/memory/db-memory';
import { AlphaIntelligenceOrchestrator } from '@/core/orchestrator';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function GET(req: Request) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const memory = new DbMemoryManager();

    if (id) {
      const conversation = await memory.getConversation(id);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversación no encontrada.' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    const list = await memory.listConversations();
    return NextResponse.json(list);
  } catch (err: any) {
    console.error('❌ [Conversations API GET] Error:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title || 'Nueva conversación';
    const project = body.project || 'alpha-addiction';

    const memory = new DbMemoryManager();
    const orchestrator = new AlphaIntelligenceOrchestrator();

    // 1. Crear conversación
    const conversation = await memory.createConversation(project, title);

    // 2. Generar saludo inicial dinámico
    const adminName = (verified as any).name || 'Alberto';
    const greeting = await orchestrator.generateSmartGreeting(adminName);

    // 3. Registrar el saludo inicial en base de datos
    await memory.addMessage(conversation.id, 'assistant', greeting, {
      model: 'system-initialization'
    });

    // 4. Devolver la conversación con el mensaje de saludo
    const fullConversation = await memory.getConversation(conversation.id);
    return NextResponse.json(fullConversation);
  } catch (err: any) {
    console.error('❌ [Conversations API POST] Error:', err);
    return NextResponse.json({ error: 'Error al crear la conversación.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const verified = await checkAdminAuth();
    if (!verified) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de conversación requerido.' }, { status: 400 });
    }

    const memory = new DbMemoryManager();
    const success = await memory.deleteConversation(id);

    if (!success) {
      return NextResponse.json({ error: 'No se pudo eliminar la conversación.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ [Conversations API DELETE] Error:', err);
    return NextResponse.json({ error: 'Error al eliminar la conversación.' }, { status: 500 });
  }
}
