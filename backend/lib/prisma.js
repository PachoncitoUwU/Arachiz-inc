const { PrismaClient } = require('@prisma/client');

// Singleton para evitar múltiples instancias de Prisma Client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
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
          url: process.env.DATABASE_URL
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
