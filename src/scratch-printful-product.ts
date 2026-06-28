import { getPrintfulProductVariants } from './lib/printful';

async function main() {
  const productId = 443083427;
  console.log(`🔍 Consultando variantes de Printful para el producto ${productId}...`);
  try {
    const variants = await getPrintfulProductVariants(productId);
    console.log('📋 Variantes encontradas:');
    variants.forEach((v: any) => {
      console.log(`- Nombre: "${v.name}", Size: "${v.size}", Color: "${v.color}", SKU: "${v.sku}", Variant ID: ${v.variant_id}`);
      if (v.files && v.files.length > 0) {
        console.log(`  Preview File: ${v.files.find((f: any) => f.type === 'preview')?.preview_url || 'None'}`);
      }
    });
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

main();
