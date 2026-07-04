'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function AnalyticsScripts() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const consent = typeof window !== 'undefined' && (window as any).COOKIE_CONSENT;
    // Si no existe gestor de cookies, asumimos activado por defecto para medir en esta fase
    const hasAnalyticsConsent = consent ? consent.analytics === true : true;
    const hasMarketingConsent = consent ? consent.marketing === true : true;

    if (!hasAnalyticsConsent && !hasMarketingConsent) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 [Analytics] Bloqueado. Esperando consentimiento del usuario.');
      }
      return;
    }

    // 1. Google Analytics & Search Console (Analíticas)
    if (hasAnalyticsConsent) {
      const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';
      console.log(`⚡ [Analytics] Cargando Google Analytics (${gaId})...`);
      
      // Inyectar script gtag.js
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}', { page_path: '${pathname}' });
      `;
      document.head.appendChild(inlineScript);
    }

    // 2. Meta Pixel (Marketing)
    if (hasMarketingConsent) {
      const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || 'XXXXXXXXXXXXXXX';
      console.log(`⚡ [Analytics] Cargando Meta Pixel (${metaPixelId})...`);

      const inlineMetaScript = document.createElement('script');
      inlineMetaScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(inlineMetaScript);
    }

    // 3. TikTok Pixel (Marketing)
    if (hasMarketingConsent) {
      const tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'XXXXXXXXXXXXXXX';
      console.log(`⚡ [Analytics] Cargando TikTok Pixel (${tiktokPixelId})...`);
      // Lógica de carga para TikTok Pixel
    }

  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsScripts />
    </Suspense>
  );
}
