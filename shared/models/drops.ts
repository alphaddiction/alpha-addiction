import { db } from '@/backend/database/db';
import { products as staticProducts } from './products';
import { runScheduledTasks } from '@/backend/events/scheduler';

/**
 * 1. Transiciona automáticamente los estados de los Drops según la fecha/hora actual del servidor.
 * Ahora se delega en el motor de eventos centralizado para disparar DROP_LIVE y DROP_ENDED.
 */
export async function transitionDropStatuses(): Promise<void> {
  try {
    await runScheduledTasks();
  } catch (error) {
    console.error('❌ [Drops Library] Error transicionando estados de Drops via Scheduler:', error);
  }
}

/**
 * 2. Recupera todos los drops de la base de datos aplicando previamente las transiciones automáticas.
 */
export async function getDbDrops() {
  await ensureInitialDropsSeeded();
  await transitionDropStatuses();
  return db.drop.findMany({
    orderBy: { order: 'asc' },
    include: {
      products: true,
      _count: {
        select: { waitlist: true }
      }
    }
  });
}

/**
 * 3. Obtiene el Drop "Activo" principal.
 * Prioridad:
 * 1. El primer drop activo ('LIVE')
 * 2. Si no hay ninguno, el primer drop programado ('COMING_SOON')
 * 3. Si tampoco hay, el último drop finalizado ('ENDED')
 */
export async function getActiveDrop() {
  await ensureInitialDropsSeeded();
  await transitionDropStatuses();

  const now = new Date();

  // 1. Intentar obtener el Drop LIVE activo destacado o de menor orden
  let drop = await db.drop.findFirst({
    where: { status: 'LIVE', visible: true },
    orderBy: [
      { featured: 'desc' },
      { order: 'asc' },
      { createdAt: 'desc' }
    ],
    include: { products: true }
  });

  if (drop) return drop;

  // 2. Intentar obtener el próximo drop en COMING_SOON
  drop = await db.drop.findFirst({
    where: { status: 'COMING_SOON', visible: true },
    orderBy: [
      { openingAt: 'asc' },
      { order: 'asc' }
    ],
    include: { products: true }
  });

  if (drop) return drop;

  // 3. Intentar obtener el último drop finalizado ENDED
  drop = await db.drop.findFirst({
    where: { status: 'ENDED', visible: true },
    orderBy: [
      { closingAt: 'desc' },
      { order: 'asc' }
    ],
    include: { products: true }
  });

  return drop;
}

/**
 * 4. Seeder autocurativo / inicializador.
 * Crea el primer Drop ("Genesis Drop 01") y migra los productos estáticos si la base de datos de Neon está vacía.
 */
export async function ensureInitialDropsSeeded(): Promise<void> {
  try {
    const dropsCount = await db.drop.count();
    let mainDropId = '';

    if (dropsCount === 0) {
      console.log('🌱 [Drops Seed] Base de datos vacía. Creando "Genesis Drop 01" de prueba...');
      
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const seededDrop = await db.drop.create({
        data: {
          name: 'Genesis Drop 01',
          slug: 'genesis-drop-01',
          description: 'Nuestra colección fundacional de prendas icónicas en algodón premium y felpa de alto gramaje.',
          mainImage: '/images/essential-tee-1.jpg',
          banner: '/images/essential-tee-1.jpg',
          status: 'LIVE',
          openingAt: threeDaysAgo,
          closingAt: sevenDaysLater,
          primaryColor: '#d4af37',
          order: 0,
          metaTitle: 'Genesis Drop 01 | Alpha Addiction',
          metaDescription: 'Colección de diseño exclusivo y unidades limitadas.',
          visible: true,
          featured: true,
        }
      });

      mainDropId = seededDrop.id;
      console.log(`✅ [Drops Seed] Genesis Drop 01 creado con ID: ${mainDropId}`);
    } else {
      const firstDrop = await db.drop.findFirst({ orderBy: { order: 'asc' } });
      mainDropId = firstDrop?.id || '';
    }

    const productsCount = await db.product.count();
    if (productsCount === 0 && mainDropId) {
      console.log('🌱 [Drops Seed] Inicializando tabla de productos con el catálogo local...');
      
      for (const p of staticProducts) {
        // Enriquecer ColorVariants con stock virtual (ej: 50 unidades por defecto)
        const enrichedColorVariants = p.colorVariants?.map(cv => ({
          ...cv,
          sizes: cv.sizes.map(sz => ({
            ...sz,
            virtualStock: 50, // Límite de stock virtual inicial por defecto
          }))
        })) || [];

        await db.product.create({
          data: {
            id: p.id,
            slug: p.slug,
            name: p.name,
            priceEUR: p.priceEUR,
            category: p.category,
            descriptionShort: p.descriptionShort,
            status: p.status,
            images: p.images as any,
            printfulProductId: p.printfulProductId || null,
            colors: p.colors || [],
            sizes: p.sizes || [],
            colorVariants: enrichedColorVariants as any,
            dropId: mainDropId,
          }
        });
      }
      console.log('✅ [Drops Seed] Catálogo de productos importado correctamente en Neon.');
    }
  } catch (error) {
    console.error('❌ [Drops Seed] Error durante la inicialización de drops/productos:', error);
  }
}
