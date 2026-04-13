const nodemailer = require('nodemailer');
require('dotenv').config(); // Asegura que las variables de entorno se carguen

// Configuración del transporter usando variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un correo electrónico de forma asíncrona.
 * @param {string} to - Destinatario(s) (separados por coma)
 * @param {string} subject - Asunto
 * @param {string} html - Contenido HTML del correo
 */
async function sendEmail(to, subject, html) {
  console.log(`Intentando enviar correo a ${to}...`);
  console.log(`Host: ${process.env.SMTP_HOST}, User: ${process.env.SMTP_USER}`);
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`✅ Correo enviado a ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error enviando correo a ${to}:`, error.message);
    throw error;
  }
}

/**
 * Envía un correo sin esperar la respuesta (fire-and-forget).
 */
function sendEmailAsync(to, subject, html) {
  sendEmail(to, subject, html).catch(err => console.error('Error asíncrono:', err));
}

module.exports = { sendEmail, sendEmailAsync };