import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const finalAnnouncements: any[] = [];

    // 1. Obtener todos los anuncios configurados en base de datos
    const dbAnnouncements = await db.announcement.findMany({
      orderBy: [
        { priority: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // 2. Procesar anuncios manuales y configuraciones automáticas
    for (const ann of dbAnnouncements) {
      if (!ann.active) continue;

      // Validar vigencia de fechas si están definidas
      if (ann.startsAt && now < new Date(ann.startsAt)) continue;
      if (ann.endsAt && now > new Date(ann.endsAt)) continue;

      if (ann.type === 'MANUAL') {
        finalAnnouncements.push({
          id: ann.id,
          type: 'MANUAL',
          category: ann.category,
          text: ann.text,
          icon: ann.icon,
          url: ann.url,
          openInNewTab: ann.openInNewTab,
          displayMode: ann.displayMode,
          config: ann.config || {},
        });
      } else if (ann.type === 'AUTOMATIC') {
        // Ejecutar lógica según categoría automática
        if (ann.category === 'LOW_STOCK') {
          try {
            const config = (ann.config as any) || {};
            const threshold = config.threshold !== undefined ? parseInt(config.threshold, 10) : 8;

            // Buscar productos de drops activos con stock virtual bajo
            const lowStockProducts = await db.product.findMany({
              where: {
                status: 'in_stock',
                drop: {
                  status: 'LIVE'
                }
              },
              select: {
                name: true,
                colorVariants: true
              },
              take: 3
            });

            for (const prod of lowStockProducts) {
              const variants = (prod.colorVariants as any[]) || [];
              let totalStock = 0;
              for (const v of variants) {
                const sizes = v.sizes || {};
                for (const sz in sizes) {
                  const virtualStock = parseInt(sizes[sz]?.virtualStock || 0, 10);
                  if (virtualStock > 0) {
                    totalStock += virtualStock;
                  }
                }
              }

              if (totalStock > 0 && totalStock <= threshold) {
                const text = ann.text
                  .replace('{stock}', String(totalStock))
                  .replace('{product}', prod.name);

                finalAnnouncements.push({
                  id: `${ann.id}-${prod.name}`,
                  type: 'AUTOMATIC',
                  category: ann.category,
                  text: text,
                  icon: ann.icon || '🔥',
                  url: ann.url,
                  openInNewTab: ann.openInNewTab,
                  displayMode: ann.displayMode,
                  config: ann.config || {},
                });
              }
            }
          } catch (err) {
            console.error('Error generando anuncio automático LOW_STOCK:', err);
          }
        } else if (ann.category === 'DROP_COUNTDOWN') {
          try {
            // Buscar el drop activo
            const liveDrop = await db.drop.findFirst({
              where: { status: 'LIVE' },
              select: { name: true, closingAt: true }
            });

            if (liveDrop && liveDrop.closingAt) {
              const closingDate = new Date(liveDrop.closingAt);
              const diffMs = closingDate.getTime() - now.getTime();
              const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

              // Mostrar si cierra en menos de 48 horas (o threshold configurable)
              const config = (ann.config as any) || {};
              const thresholdHours = config.thresholdHours !== undefined ? parseInt(config.thresholdHours, 10) : 48;

              if (diffHours > 0 && diffHours <= thresholdHours) {
                const text = ann.text
                  .replace('{drop}', liveDrop.name)
                  .replace('{hours}', String(diffHours));

                finalAnnouncements.push({
                  id: `${ann.id}-${liveDrop.name}`,
                  type: 'AUTOMATIC',
                  category: ann.category,
                  text: text,
                  icon: ann.icon || '⏳',
                  url: ann.url,
                  openInNewTab: ann.openInNewTab,
                  displayMode: ann.displayMode,
                  config: ann.config || {},
                });
              }
            }
          } catch (err) {
            console.error('Error generando anuncio automático DROP_COUNTDOWN:', err);
          }
        } else if (ann.category === 'FREE_SHIPPING') {
          // Anuncio automático genérico de envío gratis
          finalAnnouncements.push({
            id: ann.id,
            type: 'AUTOMATIC',
            category: ann.category,
            text: ann.text,
            icon: ann.icon || '🚚',
            url: ann.url,
            openInNewTab: ann.openInNewTab,
            displayMode: ann.displayMode,
            config: ann.config || {},
          });
        }
      }
    }

    // 3. Obtener cupones globales marcados para mostrarse en la barra superior
    const showableDiscounts = await db.discount.findMany({
      where: {
        status: 'ACTIVE',
        showInPromoBar: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' }
    });

    for (const disc of showableDiscounts) {
      // Omitir si ya alcanzó el número máximo de usos
      if (disc.maxUses !== null && disc.usedCount >= disc.maxUses) continue;

      let promoText = '';
      let promoIcon = '🎁';

      if (disc.type === 'PERCENTAGE') {
        promoText = `¡${disc.value}% DE DESCUENTO EN TODA LA TIENDA! CÓDIGO: ${disc.code}`;
      } else if (disc.type === 'FIXED_AMOUNT') {
        promoText = `¡${disc.value}€ DE DESCUENTO EN TU COMPRA! CÓDIGO: ${disc.code}`;
      } else if (disc.type === 'FREE_SHIPPING') {
        promoText = `ENVÍO GRATUITO EN TU PEDIDO · CÓDIGO: ${disc.code}`;
        promoIcon = '🚚';
      }

      if (promoText) {
        // Enlazar al checkout o tienda por defecto
        finalAnnouncements.push({
          id: `discount-${disc.id}`,
          type: 'DISCOUNT',
          category: 'PROMOTION',
          text: promoText,
          icon: promoIcon,
          url: '/genesis',
          openInNewTab: false,
          displayMode: 'CONTINUOUS',
          config: {
            backgroundColor: '#111111',
            textColor: '#D4AF37'
          }
        });
      }
    }

    return NextResponse.json(finalAnnouncements);
  } catch (error) {
    console.error('❌ [API Announcements GET] Error:', error);
    return NextResponse.json(
      { error: 'Error interno al obtener los anuncios de la barra superior.' },
      { status: 500 }
    );
  }
}
