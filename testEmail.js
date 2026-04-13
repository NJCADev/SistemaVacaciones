require('dotenv').config();
const { sendEmail } = require('./emailService');

sendEmail(
  'xevacav679@mypethealh.com', // da igual, Mailtrap atrapa todo
  'Prueba directa',
  '<h1>Hola</h1><p>Esto es una prueba.</p>'
).then(() => console.log('Listo')).catch(console.error);