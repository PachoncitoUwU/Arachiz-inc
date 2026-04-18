const dotenv = require('dotenv');
dotenv.config();

console.log('\n🔍 Verificando configuración de Mercado Pago...\n');

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

let hasErrors = false;

// Verificar Access Token
console.log('📋 MERCADOPAGO_ACCESS_TOKEN:');
if (!accessToken) {
  console.log('   ❌ NO CONFIGURADO - Variable no encontrada en .env');
  hasErrors = true;
} else if (accessToken === 'your_mercadopago_access_token_here') {
  console.log('   ❌ VALOR DE EJEMPLO - Debes reemplazarlo con tu token real');
  console.log('   💡 Obtén tu token en: https://www.mercadopago.com.co/developers/panel/credentials');
  hasErrors = true;
} else if (accessToken.startsWith('TEST-')) {
  console.log('   ✅ CONFIGURADO (Modo TEST)');
  console.log(`   📝 Token: ${accessToken.substring(0, 20)}...`);
} else if (accessToken.startsWith('APP_USR-')) {
  console.log('   ✅ CONFIGURADO (Modo PRODUCCIÓN)');
  console.log(`   📝 Token: ${accessToken.substring(0, 20)}...`);
  console.log('   ⚠️  ADVERTENCIA: Estás usando credenciales de producción (pagos reales)');
} else {
  console.log('   ⚠️  FORMATO DESCONOCIDO');
  console.log(`   📝 Token: ${accessToken.substring(0, 20)}...`);
  console.log('   💡 Verifica que sea un token válido de Mercado Pago');
}

console.log('');

// Verificar Public Key
console.log('📋 MERCADOPAGO_PUBLIC_KEY:');
if (!publicKey) {
  console.log('   ❌ NO CONFIGURADO - Variable no encontrada en .env');
  hasErrors = true;
} else if (publicKey === 'your_mercadopago_public_key_here') {
  console.log('   ❌ VALOR DE EJEMPLO - Debes reemplazarlo con tu public key real');
  console.log('   💡 Obtén tu key en: https://www.mercadopago.com.co/developers/panel/credentials');
  hasErrors = true;
} else if (publicKey.startsWith('TEST-')) {
  console.log('   ✅ CONFIGURADO (Modo TEST)');
  console.log(`   📝 Key: ${publicKey.substring(0, 20)}...`);
} else if (publicKey.startsWith('APP_USR-')) {
  console.log('   ✅ CONFIGURADO (Modo PRODUCCIÓN)');
  console.log(`   📝 Key: ${publicKey.substring(0, 20)}...`);
} else {
  console.log('   ⚠️  FORMATO DESCONOCIDO');
  console.log(`   📝 Key: ${publicKey.substring(0, 20)}...`);
}

console.log('');

// Verificar URLs
console.log('📋 URLs:');
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ NO CONFIGURADO'}`);
console.log(`   BACKEND_URL: ${process.env.BACKEND_URL || '❌ NO CONFIGURADO'}`);

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('❌ CONFIGURACIÓN INCOMPLETA');
  console.log('\n📝 Pasos para configurar:');
  console.log('   1. Ve a: https://www.mercadopago.com.co/developers/panel/credentials');
  console.log('   2. Selecciona "Credenciales de prueba"');
  console.log('   3. Copia el Access Token y Public Key');
  console.log('   4. Edita backend/.env y reemplaza los valores');
  console.log('   5. Reinicia el servidor: npm start');
  console.log('\n📖 Guía completa: Ver archivo CONFIGURAR_MERCADOPAGO.md');
} else {
  console.log('✅ CONFIGURACIÓN COMPLETA');
  console.log('\n🎉 Mercado Pago está configurado correctamente!');
  console.log('💳 Puedes procesar pagos ahora.');
  
  if (accessToken.startsWith('TEST-')) {
    console.log('\n🧪 Tarjetas de prueba:');
    console.log('   ✅ Aprobar: 5031 7557 3453 0604, CVV: 123, Nombre: APRO');
    console.log('   ❌ Rechazar: 5031 7557 3453 0604, CVV: 123, Nombre: OTHE');
  }
}

console.log('='.repeat(60) + '\n');
