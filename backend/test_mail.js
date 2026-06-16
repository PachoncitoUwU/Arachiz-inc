require('dotenv').config();
const nodemailer = require('nodemailer');
const templates = require('./utils/emailTemplates');

async function testMail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Arachiz" <${process.env.EMAIL_USER}>`,
      to: 'test@arachiz.com', // fake email, we just want to see if it authenticates
      subject: 'Test',
      html: '<h1>Test</h1>'
    });
    console.log('Success:', info);
  } catch (err) {
    console.error('Error:', err);
  }
}

testMail();
