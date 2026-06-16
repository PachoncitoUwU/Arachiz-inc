require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NO DEFINIDA');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    console.log('\n--- Verificando conexión con Gmail...');
    await transporter.verify();
    console.log('✅ Conexión exitosa! El correo está listo para enviar.');

    console.log('\n--- Enviando correo de prueba...');
    const info = await transporter.sendMail({
      from: `"Arachiz Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Enviamos al mismo correo como prueba
      subject: 'Test de correo Arachiz - ' + new Date().toISOString(),
      text: 'Si recibes este correo, el sistema funciona correctamente.',
    });
    console.log('✅ Correo enviado! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    console.error('   Código:', err.code);
    console.error('   Response:', err.response);
    console.error('   ResponseCode:', err.responseCode);
  }
}

testEmail();
