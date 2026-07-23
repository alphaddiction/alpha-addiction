import { getPrintfulProducts } from '@/backend/api/printful';

async function main() {
  console.log('🔍 Buscando productos en la cuenta de Printful...');
  try {
    const products = await getPrintfulProducts();
    console.log('📋 Productos encontrados en Printful:');
    products.forEach((p: any) => {
      console.log(`- Nombre: "${p.name}", ID: ${p.id}, External ID: "${p.external_id}", Variants Count: ${p.variants}`);
    });
  } catch (err: any) {
    console.error('❌ Error recuperando catálogo de Printful:', err.message);
  }
}

main();
