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
    images: string[];
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
        colors: ['Black', 'Gray'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        descriptionShort: 'La sudadera definitiva. Peso medio, interior suave y sin capucha para que puedas utilizarla en cualquier momento.',
        status: 'in_stock',
        images: ['/images/hoodies/sudadera.png'],
        printfulProductId: undefined, // TODO: Enlazar con printfulProductId de la tienda de producción en la siguiente fase
        variants: [
            { color: 'Black', size: 'XS', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'S', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'M', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'L', printfulVariantId: undefined, sku: undefined },
            { color: 'Black', size: 'XL', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'XS', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'S', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'M', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'L', printfulVariantId: undefined, sku: undefined },
            { color: 'Gray', size: 'XL', printfulVariantId: undefined, sku: undefined },
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
