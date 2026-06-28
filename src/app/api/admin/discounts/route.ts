import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth-tokens';

// Helper de autenticación administrativa
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alpha_session')?.value;
  if (!token) return false;
  
  const verified = await verifySessionToken(token);
  return !!verified;
}

export async function GET(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const discounts = await db.discount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        drop: { select: { name: true, slug: true } },
        product: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.error('❌ [API Admin Discounts GET] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al obtener cupones.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      type,
      value,
      status,
      maxUses,
      startsAt,
      endsAt,
      dropId,
      productId,
      customerEmail,
      minimumOrderAmount,
      isWaitlistOnly,
      showInPromoBar,
    } = body;

    // Validaciones básicas
    if (!code || !type || value === undefined || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para crear el cupón.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Comprobar si ya existe un código con el mismo nombre
    const existing = await db.discount.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `El código de descuento "${cleanCode}" ya existe.` },
        { status: 400 }
      );
    }

    const newDiscount = await db.discount.create({
      data: {
        code: cleanCode,
        type,
        value: parseFloat(value),
        status: status || 'ACTIVE',
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        dropId: dropId || null,
        productId: productId || null,
        customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : null,
        minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : 0.0,
        isWaitlistOnly: !!isWaitlistOnly,
        showInPromoBar: !!showInPromoBar,
      },
    });

    return NextResponse.json({ success: true, discount: newDiscount }, { status: 201 });
  } catch (error) {
    console.error('❌ [API Admin Discounts POST] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al crear el cupón.', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      code,
      type,
      value,
      status,
      maxUses,
      startsAt,
      endsAt,
      dropId,
      productId,
      customerEmail,
      minimumOrderAmount,
      isWaitlistOnly,
      showInPromoBar,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'El ID del cupón es obligatorio.' }, { status: 400 });
    }

    const discount = await db.discount.findUnique({ where: { id } });
    if (!discount) {
      return NextResponse.json({ error: 'El cupón especificado no existe.' }, { status: 404 });
    }

    const cleanCode = code ? code.trim().toUpperCase() : discount.code;

    // Si cambia el código, validar unicidad
    if (cleanCode !== discount.code) {
      const existing = await db.discount.findUnique({
        where: { code: cleanCode },
      });
      if (existing) {
        return NextResponse.json(
          { error: `El código de descuento "${cleanCode}" ya existe.` },
          { status: 400 }
        );
      }
    }

    const updatedDiscount = await db.discount.update({
      where: { id },
      data: {
        code: cleanCode,
        type: type || discount.type,
        value: value !== undefined ? parseFloat(value) : discount.value,
        status: status || discount.status,
        maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses, 10) : null) : discount.maxUses,
        startsAt: startsAt ? new Date(startsAt) : discount.startsAt,
        endsAt: endsAt ? new Date(endsAt) : discount.endsAt,
        dropId: dropId !== undefined ? (dropId || null) : discount.dropId,
        productId: productId !== undefined ? (productId || null) : discount.productId,
        customerEmail: customerEmail !== undefined ? (customerEmail ? customerEmail.trim().toLowerCase() : null) : discount.customerEmail,
        minimumOrderAmount: minimumOrderAmount !== undefined ? parseFloat(minimumOrderAmount) : discount.minimumOrderAmount,
        isWaitlistOnly: isWaitlistOnly !== undefined ? !!isWaitlistOnly : discount.isWaitlistOnly,
        showInPromoBar: showInPromoBar !== undefined ? !!showInPromoBar : discount.showInPromoBar,
      },
    });

    return NextResponse.json({ success: true, discount: updatedDiscount });
  } catch (error) {
    console.error('❌ [API Admin Discounts PUT] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al modificar el cupón.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID del cupón es obligatorio.' }, { status: 400 });
    }

    await db.discount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Cupón eliminado correctamente.' });
  } catch (error) {
    console.error('❌ [API Admin Discounts DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al eliminar el cupón.' },
      { status: 500 }
    );
  }
}
