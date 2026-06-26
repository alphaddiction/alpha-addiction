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
}

/**
 * Catálogo estático de productos locales con placeholders para IDs y SKUs de Printful.
 */
export const products: Product[] = [
    {
        id: 'p1',
        slug: 'essential-tee',
        name: 'Essential Tee',
        priceEUR: 25,
        category: 'Tops',
        colors: ['Black', 'Cream'],
        sizes: ['XS', 'S', 'M', 'L'],
        descriptionShort: 'Camiseta esencial de algodón premium. Corte relajado y minimalista, perfecta para el día a día.',
        status: 'in_stock',
        images: ['/images/essential-tee-1.jpg'],
        printfulProductId: undefined, // TODO: Enlazar con printfulProductId de la tienda de producción en la siguiente fase
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
        id: 'p2',
        slug: 'pure-tee',
        name: 'Pure Tee',
        priceEUR: 25,
        category: 'Tops',
        colors: ['Black', 'Cream'],
        sizes: ['XS', 'S', 'M', 'L'],
        descriptionShort: 'Pureza en el diseño. Tejido suave y transpirable que se siente como una segunda piel.',
        status: 'in_stock',
        images: ['/images/pure-tee-1.jpg'],
        printfulProductId: undefined, // TODO: Enlazar con printfulProductId de la tienda de producción en la siguiente fase
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
