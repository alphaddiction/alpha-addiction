import { notFound } from 'next/navigation';
import { getDbProductBySlug } from '@/lib/products';
import { getDynamicProduct } from '@/lib/products-server';
import ProductDetailClient from '@/components/product/product-detail-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const dbProduct = await getDbProductBySlug(slug);

    if (!dbProduct) {
        return {
            title: 'Producto no encontrado | Alpha Addiction',
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';
    const title = `${dbProduct.name} | Alpha Addiction`;
    const description = dbProduct.descriptionShort || `Compra ${dbProduct.name} en Alpha Addiction. Edición limitada de alta calidad con diseño minimalista.`;
    const url = `${baseUrl}/product/${dbProduct.slug}`;

    let imageSrc = `${baseUrl}/images/logos/logo.png`;
    if (dbProduct.colorVariants) {
        const colorVariants = (dbProduct.colorVariants as any[]) || [];
        const firstColor = colorVariants[0];
        if (firstColor && firstColor.mockups && firstColor.mockups.length > 0) {
            const activeMockup = firstColor.mockups.find((m: any) => m.enabled) || firstColor.mockups[0];
            if (activeMockup) imageSrc = activeMockup.url;
        }
    }

    return {
        title,
        description,
        alternates: {
            canonical: `/product/${dbProduct.slug}`,
        },
        openGraph: {
            title,
            description,
            url,
            images: [
                {
                    url: imageSrc,
                    alt: dbProduct.name,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageSrc],
        },
    };
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const dbProduct = await getDbProductBySlug(slug);

    if (!dbProduct) notFound();

    // Sincronizar variantes y mockups de Printful en tiempo de servidor
    const enrichedProduct = await getDynamicProduct(dbProduct as any);

    // Preservar stock virtual de Neon tras el mapeo de Printful
    if (dbProduct.colorVariants) {
        const dbColors = dbProduct.colorVariants as any[];
        if (enrichedProduct.colorVariants) {
            enrichedProduct.colorVariants = enrichedProduct.colorVariants.map((cv: any) => {
                const dbColor = dbColors.find(dbc => dbc.id === cv.id);
                return {
                    ...cv,
                    sizes: cv.sizes.map((sz: any) => {
                        const dbSize = dbColor?.sizes?.find((dbs: any) => dbs.size === sz.size);
                        return {
                            ...sz,
                            virtualStock: dbSize ? dbSize.virtualStock : undefined,
                        };
                    })
                };
            });
        }
    }

    const dropStatus = dbProduct.drop?.status || 'LIVE';
    const dropSlug = dbProduct.drop?.slug || null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';
    let imageSrc = `${baseUrl}/images/logos/logo.png`;
    if (dbProduct.colorVariants) {
        const colorVariants = (dbProduct.colorVariants as any[]) || [];
        const firstColor = colorVariants[0];
        if (firstColor && firstColor.mockups && firstColor.mockups.length > 0) {
            const activeMockup = firstColor.mockups.find((m: any) => m.enabled) || firstColor.mockups[0];
            if (activeMockup) imageSrc = activeMockup.url;
        }
    }

    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': enrichedProduct.name,
        'description': dbProduct.descriptionShort || `Edición limitada de ${enrichedProduct.name}`,
        'image': imageSrc,
        'sku': enrichedProduct.id,
        'brand': {
            '@type': 'Brand',
            'name': 'Alpha Addiction',
        },
        'offers': {
            '@type': 'Offer',
            'url': `${baseUrl}/product/${enrichedProduct.slug}`,
            'priceCurrency': 'EUR',
            'price': enrichedProduct.priceEUR,
            'availability': dbProduct.status === 'sold_out' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            'itemCondition': 'https://schema.org/NewCondition',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <ProductDetailClient product={enrichedProduct} dropStatus={dropStatus} dropSlug={dropSlug} />
        </>
    );
}

