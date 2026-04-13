const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function realizarBackup() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filePath = path.join(BACKUP_DIR, `backup_${process.env.DB_NAME}_${timestamp}.sql`);

  console.log(`[${new Date().toLocaleString()}] Iniciando respaldo...`);

  try {
    await mysqldump({
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
      },
      dumpToFile: filePath,
    });
    console.log(`✅ Respaldo completado: ${filePath}`);
  } catch (error) {
    console.error('❌ Error en respaldo:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  realizarBackup();
}

module.exports = { realizarBackup };