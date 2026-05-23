const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!databaseUrl) {
  throw new Error('Falta DATABASE_URL o DIRECT_URL en variables de entorno');
}

if (!process.env.DATABASE_URL && process.env.DIRECT_URL) {
  console.warn('⚠️ Usando DIRECT_URL como respaldo. En producción debes configurar DATABASE_URL con el pooler de Supabase.');
}

// Singleton para evitar múltiples instancias de Prisma Client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: ['error', 'warn']
  });
} else {
  // En desarrollo, usar global para evitar hot-reload issues
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: ['error', 'warn']
    });
  }
  prisma = global.prisma;
}

// Manejar desconexiones y reconexiones
prisma.$connect()
  .then(() => console.log('✅ Prisma conectado a la base de datos'))
  .catch((err) => console.error('❌ Error conectando Prisma:', err));

// Cerrar conexión al terminar el proceso
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
