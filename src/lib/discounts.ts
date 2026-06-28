import crypto from 'crypto';
import { db } from './db';

export interface DiscountValidateResult {
  valid: boolean;
  error?: string;
  discountId?: string;
  code?: string;
  type?: string;
  value?: number;
  discountAmount?: number;
  freeShipping?: boolean;
}

/**
 * Valida un cupón de descuento en base al código, email del cliente y los productos de la cesta.
 */
export async function validateDiscountCode(
  code: string,
  email: string,
  items: { productId?: string; slug?: string; quantity: number; price: number }[]
): Promise<DiscountValidateResult> {
  try {
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanCode) {
      return { valid: false, error: 'El código de descuento no puede estar vacío.' };
    }

    if (!items || items.length === 0) {
      return { valid: false, error: 'No hay artículos en la cesta para validar.' };
    }

    // 1. Obtener cupón de base de datos
    const discount = await db.discount.findUnique({
      where: { code: cleanCode },
    });

    if (!discount || discount.status !== 'ACTIVE') {
      return { valid: false, error: 'El código de descuento no es válido o está inactivo.' };
    }

    // 2. Validar Fechas (vigencia)
    const now = new Date();
    if (now < discount.startsAt) {
      return { valid: false, error: 'Este cupón de descuento aún no está activo.' };
    }
    if (now > discount.endsAt) {
      return { valid: false, error: 'Este cupón de descuento ha expirado.' };
    }

    // 3. Validar usos totales
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return { valid: false, error: 'Este cupón de descuento ha agotado su límite de usos.' };
    }

    // 4. Validar productos contra el catálogo
    let orderSubtotal = 0;
    const itemsWithDropInfo: any[] = [];

    for (const item of items) {
      let dbProduct = await db.product.findUnique({
        where: { id: item.productId || '' },
        select: { id: true, priceEUR: true, dropId: true },
      });

      if (!dbProduct && item.slug) {
        dbProduct = await db.product.findUnique({
          where: { slug: item.slug },
          select: { id: true, priceEUR: true, dropId: true },
        });
      }

      if (!dbProduct) {
        return { valid: false, error: `El producto "${item.productId || item.slug}" no existe en el catálogo.` };
      }

      const qty = Math.max(1, item.quantity);
      const realPrice = dbProduct.priceEUR;
      orderSubtotal += realPrice * qty;

      itemsWithDropInfo.push({
        productId: dbProduct.id,
        dropId: dbProduct.dropId,
        price: realPrice,
        quantity: qty,
      });
    }

    // 5. Validar importe mínimo de compra
    if (orderSubtotal < discount.minimumOrderAmount) {
      return {
        valid: false,
        error: `Este cupón requiere una compra mínima de ${discount.minimumOrderAmount.toFixed(2)}€ (Total actual: ${orderSubtotal.toFixed(2)}€).`,
      };
    }

    // 6. Validar restricción de correo electrónico de cliente
    if (discount.customerEmail && discount.customerEmail.toLowerCase().trim() !== cleanEmail) {
      return { valid: false, error: 'Este cupón de descuento es exclusivo para otro cliente.' };
    }

    // 7. Validar exclusividad de Lista de Espera (Waitlist)
    if (discount.isWaitlistOnly) {
      if (!discount.dropId) {
        return { valid: false, error: 'Configuración incorrecta del cupón (Falta dropId).' };
      }
      if (!cleanEmail) {
        return { valid: false, error: 'Proporciona tu correo electrónico para validar este cupón exclusivo.' };
      }

      const isRegistered = await db.dropWaitlist.findUnique({
        where: {
          dropId_email: {
            dropId: discount.dropId,
            email: cleanEmail,
          },
        },
      });

      if (!isRegistered) {
        return { valid: false, error: 'Este código es exclusivo para miembros de la lista de espera de este lanzamiento.' };
      }
    }

    // 8. Calcular descuento
    let discountAmount = 0;
    const freeShipping = discount.type === 'FREE_SHIPPING';

    const applicableItems = itemsWithDropInfo.filter((item) => {
      if (discount.productId && item.productId !== discount.productId) {
        return false;
      }
      if (discount.dropId && item.dropId !== discount.dropId) {
        return false;
      }
      return true;
    });

    if (applicableItems.length === 0) {
      return { valid: false, error: 'Este cupón no es aplicable a ninguno de los productos en tu cesta.' };
    }

    const applicableSubtotal = applicableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (discount.type === 'PERCENTAGE') {
      discountAmount = applicableSubtotal * (discount.value / 100);
    } else if (discount.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(discount.value, applicableSubtotal);
    } else if (discount.type === 'FREE_SHIPPING') {
      discountAmount = 0;
    }

    discountAmount = Math.max(0, Math.min(discountAmount, orderSubtotal));

    return {
      valid: true,
      discountId: discount.id,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
      freeShipping,
    };
  } catch (error: any) {
    console.error('❌ [validateDiscountCode] Error:', error);
    return { valid: false, error: 'Error interno al validar el código.' };
  }
}

/**
 * Incrementa de forma segura los usos del cupón y registra su redención.
 * Evita duplicados basándose en orderId.
 */
export async function recordDiscountRedemption(
  orderId: string,
  discountId: string | null,
  ipAddress = '127.0.0.1'
): Promise<boolean> {
  if (!discountId) return false;

  try {
    // Comprobar si ya existe una redención para este pedido (evitar duplicados)
    const existing = await db.discountRedemption.findFirst({
      where: { orderId },
    });

    if (existing) {
      console.log(`ℹ️ [Redemption Log] La redención para el pedido ${orderId} ya estaba registrada.`);
      return true;
    }

    const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

    await db.$transaction([
      db.discount.update({
        where: { id: discountId },
        data: { usedCount: { increment: 1 } },
      }),
      db.discountRedemption.create({
        data: {
          discountId,
          orderId,
          ipHash,
        },
      }),
    ]);

    console.log(`✅ [Redemption Log] Redención registrada con éxito para el pedido ${orderId} y cupón ${discountId}`);
    return true;
  } catch (error) {
    console.error('❌ [Redemption Log] Error al guardar redención:', error);
    return false;
  }
}
