import { MetadataRoute } from 'next';
import { db } from '@/backend/database/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domainSetting = await db.systemSetting.findUnique({
    where: { key: 'company_domain' }
  });
  const baseUrl = domainSetting?.value || process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';
  
  // 1. Páginas públicas estáticas principales
  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/genesis`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/legal/aviso-legal`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/legal/cookies`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${baseUrl}/legal/privacidad`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ];

  // 2. Drops dinámicos de la base de datos de Neon
  let dropPages: MetadataRoute.Sitemap = [];
  try {
    const drops = await db.drop.findMany({
      where: { visible: true }
    });
    dropPages = drops.map(d => ({
      url: `${baseUrl}/drops/${d.slug}`,
      lastModified: d.updatedAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8
    }));
  } catch (err) {
    console.error('⚠️ [Sitemap Generation] Error consultando drops:', err);
  }

  // 3. Productos dinámicos de la base de datos de Neon
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await db.product.findMany({});
    productPages = products.map(p => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7
    }));
  } catch (err) {
    console.error('⚠️ [Sitemap Generation] Error consultando productos:', err);
  }

  return [...staticPages, ...dropPages, ...productPages];
}
