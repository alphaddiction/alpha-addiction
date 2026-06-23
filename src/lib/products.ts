export type ProductStatus = 'in_stock' | 'sold_out';

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
}

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
        images: ['/images/sudadera.png'],
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
        status: 'in_stock', // Testing Waitlist
        images: ['/images/balance-hoodie-1.jpg'],
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
    },
];
