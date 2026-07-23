import { loadEnvConfig } from '@next/env';
// Cargar variables de entorno estilo Next.js (soporta .env.local, .env, etc.)
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

import { printfulFetch } from '@/backend/api/printful';

async function main() {
  const webhookUrl = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL;

  if (!webhookUrl) {
    console.error('❌ Error: Por favor especifica la URL de tu webhook.');
    console.error('   Uso: npx tsx src/lib/register_webhook.ts https://tu-dominio.com/api/webhooks/printful');
    process.exit(1);
  }

  // Asegurar que termina en /api/webhooks/printful
  let cleanUrl = webhookUrl;
  if (!cleanUrl.endsWith('/api/webhooks/printful')) {
    cleanUrl = cleanUrl.replace(/\/$/, '') + '/api/webhooks/printful';
  }

  console.log(`📡 Registrando Webhook en Printful...`);
  console.log(`   URL Destino: ${cleanUrl}`);

  try {
    const payload = {
      url: cleanUrl,
      types: [
        'order_created',
        'package_shipped',
        'order_canceled',
        'order_failed',
        'order_put_hold',
        'order_remove_hold',
      ],
    };

    const res: any = await printfulFetch('webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log('\n🎉 ¡Webhook registrado con éxito en Printful!');
    console.log(`   ID del Webhook: ${res.result.id}`);
    console.log(`   URL Registrada: ${res.result.url}`);
    
    if (res.result.secret) {
      console.log(`\n🔑 Secreto de firma (Copia este secreto en tu PRINTFUL_WEBHOOK_SECRET):`);
      console.log(`   👉 ${res.result.secret}`);
    } else {
      console.log('\nℹ️ No se devolvió ningún secreto de firma. (El webhook usará validación por defecto o sin firma en local).');
    }
  } catch (error: any) {
    console.error('\n❌ Error al registrar el webhook en Printful:', error.message);
  }
}

main();
