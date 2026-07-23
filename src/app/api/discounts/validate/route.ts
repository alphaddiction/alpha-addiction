import { NextResponse } from 'next/server';
import { validateDiscountCode } from '@/shared/models/discounts';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, email, items } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'El código de descuento es obligatorio.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La cesta de la compra está vacía.' },
        { status: 400 }
      );
    }

    const validation = await validateDiscountCode(code, email, items);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    return NextResponse.json(validation);
  } catch (error) {
    console.error('❌ [API Validate Discount] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor al validar el cupón.' },
      { status: 500 }
    );
  }
}
