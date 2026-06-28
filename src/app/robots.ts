import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const domainSetting = await db.systemSetting.findUnique({
    where: { key: 'company_domain' }
  });
  const baseUrl = domainSetting?.value || process.env.NEXT_PUBLIC_APP_URL || 'https://alpha-addiction.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/checkout/',
        '/cart/',
        '/account/',
        '/pedido/*',
        '/waitlist/gracias'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
