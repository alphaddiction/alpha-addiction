export type ProductStatus = 'in_stock' | 'sold_out';

/**
 * Representa una variante física de un producto sincronizada en el catálogo.
 */
export interface ProductVariant {
    printfulVariantId?: number; // TODO: Asignar el ID de variante en Printful una vez creado el catálogo remoto
    sku?: string;               // TODO: Registrar código de SKU único (ej. ESS-TEE-BLK-XS)
    size: string;               // Talla (ej. XS, S, M, L, XL)
    color: string;              // Color (ej. Black, Cream, Gray)
}

export interface ProductImage {
    src: string;
    alt: string;
    enabled: boolean;
    order: number;
}

export interface ProductMockup {
    id: string;
    url: string;
    alt: string;
    source: 'printful';
    enabled: boolean;
    order: number;
}

export interface SizeVariant {
    size: string;
    printfulVariantId: number;
    sku: string;
    available: boolean;
    retailPrice?: string;
    virtualStock?: number;
}

export interface ColorVariant {
    id: string;
    name: string;
    hex: string;
    mockups: ProductMockup[];
    sizes: SizeVariant[];
}

/**
 * Representa un producto en el e-commerce local.
 */
export interface Product {
    id: string;
    slug: string;
    name: string;
    priceEUR: number;
    category: string;
    colors: string[];
    sizes: string[];
    descriptionShort: string;
    status: ProductStatus;
    images: string[] | ProductImage[];
    printfulProductId?: number;  // TODO: ID asignado por la base de datos de Printful
    variants?: ProductVariant[];  // TODO: Listado de variantes físicas enlazadas
    mockups?: ProductMockup[];
    colorVariants?: ColorVariant[];
}

/**
 * Catálogo estático de productos locales con placeholders para IDs y SKUs de Printful.
 */
export const products: Product[] = [
    {
        id: 'p1',
        slug: 'core-tee',
        name: 'Core Tee',
        priceEUR: 25,
        category: 'Tops',
        colors: ['Black', 'Navy', 'Forest Green', 'Dark Chocolate', 'Cardinal', 'Charcoal', 'Sand'],
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        descriptionShort: 'Camiseta esencial de algodón premium. Corte relajado y minimalista, perfecta para el día a día.',
        status: 'in_stock',
        images: ['/images/essential-tee-1.jpg'],
        printfulProductId: 443035762,
        variants: [
            { color: 'Black', size: 'S', printfulVariantId: 11546, sku: '6A400952DC1B9_Black-S' },
            { color: 'Black', size: 'M', printfulVariantId: 11547, sku: '6A400952DC1B9_Black-M' },
            { color: 'Black', size: 'L', printfulVariantId: 11548, sku: '6A400952DC1B9_Black-L' },
            { color: 'Black', size: 'XL', printfulVariantId: 11549, sku: '6A400952DC1B9_Black-XL' },
            { color: 'Black', size: '2XL', printfulVariantId: 11550, sku: '6A400952DC1B9_Black-2XL' },
            { color: 'Navy', size: 'S', printfulVariantId: 11561, sku: '6A400952DC1B9_Navy-S' },
            { color: 'Navy', size: 'M', printfulVariantId: 11562, sku: '6A400952DC1B9_Navy-M' },
            { color: 'Navy', size: 'L', printfulVariantId: 11563, sku: '6A400952DC1B9_Navy-L' },
            { color: 'Navy', size: 'XL', printfulVariantId: 11564, sku: '6A400952DC1B9_Navy-XL' },
            { color: 'Navy', size: '2XL', printfulVariantId: 11565, sku: '6A400952DC1B9_Navy-2XL' },
            { color: 'Forest Green', size: 'S', printfulVariantId: 20453, sku: '6A400952DC1B9_Forest-Green-S' },
            { color: 'Forest Green', size: 'M', printfulVariantId: 20454, sku: '6A400952DC1B9_Forest-Green-M' },
            { color: 'Forest Green', size: 'L', printfulVariantId: 20455, sku: '6A400952DC1B9_Forest-Green-L' },
            { color: 'Forest Green', size: 'XL', printfulVariantId: 20456, sku: '6A400952DC1B9_Forest-Green-XL' },
            { color: 'Forest Green', size: '2XL', printfulVariantId: 20457, sku: '6A400952DC1B9_Forest-Green-2XL' },
            { color: 'Dark Chocolate', size: 'S', printfulVariantId: 15837, sku: '6A400952DC1B9_Dark-Chocolate-S' },
            { color: 'Dark Chocolate', size: 'M', printfulVariantId: 15838, sku: '6A400952DC1B9_Dark-Chocolate-M' },
            { color: 'Dark Chocolate', size: 'L', printfulVariantId: 15839, sku: '6A400952DC1B9_Dark-Chocolate-L' },
            { color: 'Dark Chocolate', size: 'XL', printfulVariantId: 15840, sku: '6A400952DC1B9_Dark-Chocolate-XL' },
            { color: 'Dark Chocolate', size: '2XL', printfulVariantId: 15841, sku: '6A400952DC1B9_Dark-Chocolate-2XL' },
            { color: 'Cardinal', size: 'S', printfulVariantId: 15819, sku: '6A400952DC1B9_Cardinal-S' },
            { color: 'Cardinal', size: 'M', printfulVariantId: 15820, sku: '6A400952DC1B9_Cardinal-M' },
            { color: 'Cardinal', size: 'L', printfulVariantId: 15821, sku: '6A400952DC1B9_Cardinal-L' },
            { color: 'Cardinal', size: 'XL', printfulVariantId: 15822, sku: '6A400952DC1B9_Cardinal-XL' },
            { color: 'Cardinal', size: '2XL', printfulVariantId: 15823, sku: '6A400952DC1B9_Cardinal-2XL' },
            { color: 'Charcoal', size: 'S', printfulVariantId: 15831, sku: '6A400952DC1B9_Charcoal-S' },
            { color: 'Charcoal', size: 'M', printfulVariantId: 15832, sku: '6A400952DC1B9_Charcoal-M' },
            { color: 'Charcoal', size: 'L', printfulVariantId: 15833, sku: '6A400952DC1B9_Charcoal-L' },
            { color: 'Charcoal', size: 'XL', printfulVariantId: 15834, sku: '6A400952DC1B9_Charcoal-XL' },
            { color: 'Charcoal', size: '2XL', printfulVariantId: 15835, sku: '6A400952DC1B9_Charcoal-2XL' },
            { color: 'Sand', size: 'S', printfulVariantId: 12639, sku: '6A400952DC1B9_Sand-S' },
            { color: 'Sand', size: 'M', printfulVariantId: 12640, sku: '6A400952DC1B9_Sand-M' },
            { color: 'Sand', size: 'L', printfulVariantId: 12641, sku: '6A400952DC1B9_Sand-L' },
            { color: 'Sand', size: 'XL', printfulVariantId: 12642, sku: '6A400952DC1B9_Sand-XL' },
            { color: 'Sand', size: '2XL', printfulVariantId: 12643, sku: '6A400952DC1B9_Sand-2XL' }
        ]
    },
    {
        id: 'p2',
        slug: 'discipline-tank',
        name: 'Discipline Tank',
        priceEUR: 25,
        category: 'Tops',
        colors: ['Black', 'Cream'],
        sizes: ['XS', 'S', 'M', 'L'],
        descriptionShort: 'Camiseta de tirantes Discipline. Máxima comodidad, transpirabilidad y libertad de movimiento para tus entrenamientos más exigentes.',
        status: 'in_stock',
        images: ['/images/discipline-tank-1.jpg'],
        printfulProductId: 443083427, // Enlazado con printfulProductId de la tienda de producción
        variants: [
            { color: 'Black', size: 'XS', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'S', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'M', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'L', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'XS', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'S', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'M', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'L', printfulVariantId: undefined, sku: undefined },
        ]
    },
    {
        id: 'p3',
        slug: 'core-hoodie',
        name: 'Core Hoodie',
        priceEUR: 45,
        category: 'Hoodies',
        colors: ['Navy', 'Maroon', 'Forest Green', 'Dark Heather', 'Indigo Blue', 'Light Blue', 'Sand', 'Light Pink'],
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        descriptionShort: 'La sudadera definitiva. Peso medio, interior suave y sin capucha para que puedas utilizarla en cualquier momento.',
        status: 'in_stock',
        images: [
          {
            src: "/images/products/core-hoodie/imagen-1.png",
            alt: "Alpha Addiction Core Hoodie - imagen 1",
            enabled: true,
            order: 1,
          },
          {
            src: "/images/products/core-hoodie/imagen-2.png",
            alt: "Alpha Addiction Core Hoodie - imagen 2",
            enabled: false,
            order: 2,
          },
          {
            src: "/images/products/core-hoodie/imagen-3.png",
            alt: "Alpha Addiction Core Hoodie - imagen 3",
            enabled: false,
            order: 3,
          },
          {
            src: "/images/products/core-hoodie/imagen-4.png",
            alt: "Alpha Addiction Core Hoodie - imagen 4",
            enabled: false,
            order: 4,
          },
          {
            src: "/images/products/core-hoodie/imagen-5.png",
            alt: "Alpha Addiction Core Hoodie - imagen 5",
            enabled: false,
            order: 5,
          },
          {
            src: "/images/products/core-hoodie/imagen-6.png",
            alt: "Alpha Addiction Core Hoodie - imagen 6",
            enabled: false,
            order: 6,
          },
          {
            src: "/images/products/core-hoodie/imagen-7.png",
            alt: "Alpha Addiction Core Hoodie - imagen 7",
            enabled: false,
            order: 7,
          },
        ],
        printfulProductId: 442791728,
        mockups: [
          {
            id: "core-hoodie-mockup-1",
            url: "https://files.cdn.printful.com/files/b05/b0568f1f49d88fb265c7f9bd8c3bfafe_preview.png",
            alt: "Alpha Addiction Core Hoodie - mockup frontal",
            source: "printful",
            enabled: true,
            order: 1,
          },
          {
            id: "core-hoodie-mockup-2",
            url: "https://files.cdn.printful.com/files/4b2/4b2874093708d36c1bfdcb61cb11c06e_preview.png",
            alt: "Alpha Addiction Core Hoodie - mockup trasero",
            source: "printful",
            enabled: false,
            order: 2,
          }
        ],
        variants: [
            { color: 'Navy', size: 'S', printfulVariantId: 5498, sku: '6A3EB1CD7C6E1_Navy-S' },
            { color: 'Navy', size: 'M', printfulVariantId: 5499, sku: '6A3EB1CD7C6E1_Navy-M' },
            { color: 'Navy', size: 'L', printfulVariantId: 5500, sku: '6A3EB1CD7C6E1_Navy-L' },
            { color: 'Navy', size: 'XL', printfulVariantId: 5501, sku: '6A3EB1CD7C6E1_Navy-XL' },
            { color: 'Navy', size: '2XL', printfulVariantId: 5502, sku: '6A3EB1CD7C6E1_Navy-2XL' },
            { color: 'Maroon', size: 'S', printfulVariantId: 5490, sku: '6A3EB1CD7C6E1_Maroon-S' },
            { color: 'Maroon', size: 'M', printfulVariantId: 5491, sku: '6A3EB1CD7C6E1_Maroon-M' },
            { color: 'Maroon', size: 'L', printfulVariantId: 5492, sku: '6A3EB1CD7C6E1_Maroon-L' },
            { color: 'Maroon', size: 'XL', printfulVariantId: 5493, sku: '6A3EB1CD7C6E1_Maroon-XL' },
            { color: 'Maroon', size: '2XL', printfulVariantId: 5494, sku: '6A3EB1CD7C6E1_Maroon-2XL' },
            { color: 'Forest Green', size: 'S', printfulVariantId: 18763, sku: '6A3EB1CD7C6E1_Forest-Green-S' },
            { color: 'Forest Green', size: 'M', printfulVariantId: 18764, sku: '6A3EB1CD7C6E1_Forest-Green-M' },
            { color: 'Forest Green', size: 'L', printfulVariantId: 18765, sku: '6A3EB1CD7C6E1_Forest-Green-L' },
            { color: 'Forest Green', size: 'XL', printfulVariantId: 18766, sku: '6A3EB1CD7C6E1_Forest-Green-XL' },
            { color: 'Forest Green', size: '2XL', printfulVariantId: 18767, sku: '6A3EB1CD7C6E1_Forest-Green-2XL' },
            { color: 'Dark Heather', size: 'S', printfulVariantId: 10833, sku: '6A3EB1CD7C6E1_Dark-Heather-S' },
            { color: 'Dark Heather', size: 'M', printfulVariantId: 10834, sku: '6A3EB1CD7C6E1_Dark-Heather-M' },
            { color: 'Dark Heather', size: 'L', printfulVariantId: 10835, sku: '6A3EB1CD7C6E1_Dark-Heather-L' },
            { color: 'Dark Heather', size: 'XL', printfulVariantId: 10836, sku: '6A3EB1CD7C6E1_Dark-Heather-XL' },
            { color: 'Dark Heather', size: '2XL', printfulVariantId: 10837, sku: '6A3EB1CD7C6E1_Dark-Heather-2XL' },
            { color: 'Indigo Blue', size: 'S', printfulVariantId: 5466, sku: '6A3EB1CD7C6E1_Indigo-Blue-S' },
            { color: 'Indigo Blue', size: 'M', printfulVariantId: 5467, sku: '6A3EB1CD7C6E1_Indigo-Blue-M' },
            { color: 'Indigo Blue', size: 'L', printfulVariantId: 5468, sku: '6A3EB1CD7C6E1_Indigo-Blue-L' },
            { color: 'Indigo Blue', size: 'XL', printfulVariantId: 5469, sku: '6A3EB1CD7C6E1_Indigo-Blue-XL' },
            { color: 'Indigo Blue', size: '2XL', printfulVariantId: 5470, sku: '6A3EB1CD7C6E1_Indigo-Blue-2XL' },
            { color: 'Light Blue', size: 'S', printfulVariantId: 7860, sku: '6A3EB1CD7C6E1_Light-Blue-S' },
            { color: 'Light Blue', size: 'M', printfulVariantId: 7861, sku: '6A3EB1CD7C6E1_Light-Blue-M' },
            { color: 'Light Blue', size: 'L', printfulVariantId: 7862, sku: '6A3EB1CD7C6E1_Light-Blue-L' },
            { color: 'Light Blue', size: 'XL', printfulVariantId: 7863, sku: '6A3EB1CD7C6E1_Light-Blue-XL' },
            { color: 'Light Blue', size: '2XL', printfulVariantId: 7864, sku: '6A3EB1CD7C6E1_Light-Blue-2XL' },
            { color: 'Sand', size: 'S', printfulVariantId: 16876, sku: '6A3EB1CD7C6E1_Sand-S' },
            { color: 'Sand', size: 'M', printfulVariantId: 16877, sku: '6A3EB1CD7C6E1_Sand-M' },
            { color: 'Sand', size: 'L', printfulVariantId: 16878, sku: '6A3EB1CD7C6E1_Sand-L' },
            { color: 'Sand', size: 'XL', printfulVariantId: 16879, sku: '6A3EB1CD7C6E1_Sand-XL' },
            { color: 'Sand', size: '2XL', printfulVariantId: 16880, sku: '6A3EB1CD7C6E1_Sand-2XL' },
            { color: 'Light Pink', size: 'S', printfulVariantId: 7868, sku: '6A3EB1CD7C6E1_Light-Pink-S' },
            { color: 'Light Pink', size: 'M', printfulVariantId: 7869, sku: '6A3EB1CD7C6E1_Light-Pink-M' },
            { color: 'Light Pink', size: 'L', printfulVariantId: 7870, sku: '6A3EB1CD7C6E1_Light-Pink-L' },
            { color: 'Light Pink', size: 'XL', printfulVariantId: 7871, sku: '6A3EB1CD7C6E1_Light-Pink-XL' },
            { color: 'Light Pink', size: '2XL', printfulVariantId: 7872, sku: '6A3EB1CD7C6E1_Light-Pink-2XL' },
        ]
    },
    {
        id: 'p4',
        slug: 'balance-hoodie',
        name: 'Balance Hoodie',
        priceEUR: 45,
        category: 'Hoodies',
        colors: ['Cream', 'Gray'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        descriptionShort: 'Equilibrio entre confort y estilo. Corte oversize sutil en tonos neutros para cualquier ocasión.',
        status: 'in_stock',
        images: ['/images/balance-hoodie-1.jpg'],
        printfulProductId: undefined, // TODO: Enlazar con printfulProductId de la tienda de producción en la siguiente fase
        variants: [
            { color: 'Cream', size: 'XS', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'S', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'M', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'L', printfulVariantId: undefined, sku: undefined },
            { color: 'Cream', size: 'XL', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'XS', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'S', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'M', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'L', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'XL', printfulVariantId: undefined, sku: undefined },
        ]
    },
    {
        id: 'p5',
        slug: 'form-legging',
        name: 'Form Legging',
        priceEUR: 30,
        category: 'Bottoms',
        colors: ['Black'],
        sizes: ['XS', 'S', 'M', 'L'],
        descriptionShort: 'Soporte y flexibilidad. Cintura alta que esculpe sin oprimir, ideal para movimiento o descanso.',
        status: 'in_stock',
        images: ['/images/form-legging-1.jpg'],
        printfulProductId: undefined, // TODO: Enlazar con printfulProductId de la tienda de producción en la siguiente fase
        variants: [
            { color: 'Black', size: 'XS', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'S', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'M', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'L', printfulVariantId: undefined, sku: undefined },
        ]
    },
];

/**
 * Obtiene un producto por su ID local único.
 */
export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

/**
 * Obtiene un producto y la variante correspondiente a partir de un código de SKU.
 */
export function getProductBySku(sku: string): { product: Product; variant: ProductVariant } | undefined {
  for (const product of products) {
    if (product.variants) {
      const variant = product.variants.find(v => v.sku === sku);
      if (variant) {
        return { product, variant };
      }
    }
  }
  return undefined;
}

/**
 * Obtiene un producto y la variante correspondiente a partir del ID de variante física de Printful.
 */
export function getProductByPrintfulVariantId(variantId: number): { product: Product; variant: ProductVariant } | undefined {
  for (const product of products) {
    if (product.variants) {
      const variant = product.variants.find(v => v.printfulVariantId === variantId);
      if (variant) {
        return { product, variant };
      }
    }
  }
  return undefined;
}

/**
 * --- CONSULTAS DE BASE DE DATOS DILIGENTES (NEON POSTGRESQL) ---
 */
import { db } from './db';
import { ensureInitialDropsSeeded } from './drops';

/**
 * Retorna todos los productos de la base de datos Neon (ejecuta autoseed si está vacío).
 */
export async function getDbProducts(): Promise<any[]> {
  await ensureInitialDropsSeeded();
  return db.product.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Busca un producto por su Slug en Neon.
 */
export async function getDbProductBySlug(slug: string): Promise<any | null> {
  await ensureInitialDropsSeeded();
  return db.product.findUnique({
    where: { slug },
    include: { drop: true },
  });
}

/**
 * Busca un producto por su ID en Neon.
 */
export async function getDbProductById(id: string): Promise<any | null> {
  await ensureInitialDropsSeeded();
  return db.product.findUnique({
    where: { id },
    include: { drop: true },
  });
}

/**
 * Busca un producto y su variante por el código SKU en la base de datos.
 */
export async function getDbProductBySku(sku: string): Promise<{ product: any; colorVariant: ColorVariant; sizeVariant: SizeVariant } | null> {
  await ensureInitialDropsSeeded();
  const dbProducts = await db.product.findMany();
  
  for (const p of dbProducts) {
    const colorVariants = (p.colorVariants as any as ColorVariant[]) || [];
    for (const cv of colorVariants) {
      const sizeVariant = cv.sizes.find(sz => sz.sku === sku);
      if (sizeVariant) {
        return { product: p, colorVariant: cv, sizeVariant };
      }
    }
  }
  return null;
}

/**
 * Busca un producto y su variante por el ID de variante de Printful.
 */
export async function getDbProductByPrintfulVariantId(variantId: number): Promise<{ product: any; colorVariant: ColorVariant; sizeVariant: SizeVariant } | null> {
  await ensureInitialDropsSeeded();
  const dbProducts = await db.product.findMany();
  
  for (const p of dbProducts) {
    const colorVariants = (p.colorVariants as any as ColorVariant[]) || [];
    for (const cv of colorVariants) {
      const sizeVariant = cv.sizes.find(sz => sz.printfulVariantId === variantId);
      if (sizeVariant) {
        return { product: p, colorVariant: cv, sizeVariant };
      }
    }
  }
  return null;
}

/**
 * Reduce el stock virtual de una variante tras una venta confirmada.
 */
export async function decrementVirtualStock(productId: string, sku: string, quantity: number): Promise<void> {
  const p = await db.product.findUnique({ where: { id: productId } });
  if (!p) return;

  const colorVariants = (p.colorVariants as any as ColorVariant[]) || [];
  let updated = false;

  const newColorVariants = colorVariants.map(cv => {
    return {
      ...cv,
      sizes: cv.sizes.map(sz => {
        if (sz.sku === sku) {
          updated = true;
          const currentStock = sz.virtualStock ?? 50;
          const newStock = Math.max(0, currentStock - quantity);
          return {
            ...sz,
            virtualStock: newStock,
            available: newStock > 0,
          };
        }
        return sz;
      })
    };
  });

  if (updated) {
    await db.product.update({
      where: { id: productId },
      data: {
        colorVariants: newColorVariants as any
      }
    });
    console.log(`📉 [Stock Virtual] Reducido stock virtual para producto ${productId} SKU ${sku} en ${quantity} uds.`);
  }
}

