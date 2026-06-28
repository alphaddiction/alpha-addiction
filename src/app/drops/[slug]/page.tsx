import { db } from '@/lib/db';
import { transitionDropStatuses } from '@/lib/drops';
import { redirect } from 'next/navigation';
import { getDynamicProduct } from '@/lib/products-server';
import DropDetailClient from '@/components/drops/drop-detail-client';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function DropDetailPage({ params }: Props) {
  const { slug } = await params;
  const cleanSlug = slug.trim().toLowerCase();

  // 1. Ejecutar las transiciones de estado automáticas basadas en fecha/hora
  await transitionDropStatuses();

  // 2. Cargar el Drop con sus productos asignados
  const drop = await db.drop.findUnique({
    where: { slug: cleanSlug },
    include: {
      products: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!drop || (!drop.visible && drop.status !== 'DRAFT')) {
    console.error(`❌ [Drops Collection] Drop con slug "${cleanSlug}" no encontrado o invisible.`);
    redirect('/pedido?error=drop_not_found');
  }

  // 3. Serializar objetos y enriquecer con Printful en paralelo
  const enrichedProducts = await Promise.all(
    drop.products.map(async (p) => {
      const enriched = await getDynamicProduct(p as any);
      return {
        id: enriched.id,
        slug: enriched.slug,
        name: enriched.name,
        priceEUR: enriched.priceEUR,
        category: enriched.category,
        descriptionShort: enriched.descriptionShort,
        status: enriched.status,
        images: enriched.images,
        printfulProductId: enriched.printfulProductId,
        colors: enriched.colors,
        sizes: enriched.sizes,
        colorVariants: enriched.colorVariants,
      };
    })
  );

  const serializedDrop = {
    id: drop.id,
    name: drop.name,
    slug: drop.slug,
    description: drop.description,
    mainImage: drop.mainImage,
    banner: drop.banner,
    videoUrl: drop.videoUrl,
    status: drop.status,
    openingAt: drop.openingAt.toISOString(),
    closingAt: drop.closingAt.toISOString(),
    primaryColor: drop.primaryColor,
    metaTitle: drop.metaTitle,
    metaDescription: drop.metaDescription,
    products: enrichedProducts,
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';

  const dropJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': drop.metaTitle || `${drop.name} | Alpha Addiction`,
    'description': drop.metaDescription || drop.description || '',
    'url': `${baseUrl}/drops/${drop.slug}`,
    'mainEntity': {
      '@type': 'ItemList',
      'itemListElement': enrichedProducts.map((p, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'url': `${baseUrl}/product/${p.slug}`,
        'name': p.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dropJsonLd) }}
      />
      <DropDetailClient drop={serializedDrop} />
    </>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const drop = await db.drop.findUnique({ where: { slug } });
  
  if (!drop) return { title: 'Alpha Addiction' };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';
  const url = `${baseUrl}/drops/${drop.slug}`;
  const title = drop.metaTitle || `${drop.name} | Alpha Addiction`;
  const description = drop.metaDescription || drop.description || '';
  const imageUrl = drop.mainImage ? `${baseUrl}${drop.mainImage}` : `${baseUrl}/images/logos/logo.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/drops/${drop.slug}`,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: drop.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}
