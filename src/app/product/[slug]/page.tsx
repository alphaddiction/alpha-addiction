import { notFound } from 'next/navigation';
import { products } from '@/lib/products';
import { getDynamicProduct } from '@/lib/products-server';
import ProductDetailClient from '@/components/product/product-detail-client';

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const rawProduct = products.find((p) => p.slug === slug);

    if (!rawProduct) notFound();

    // Fetch dynamic variants and mockups from Printful on the server-side
    const product = await getDynamicProduct(rawProduct);

    return <ProductDetailClient product={product} />;
}
