const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    const defaultDocument = '1234567890';
    const defaultEmail = 'admin@arachiz.com';
    const defaultPassword = await bcrypt.hash('123456', 10);
    
    // Check if exists
    const existing = await prisma.user.findUnique({ where: { document: defaultDocument }});
    if (existing) {
      console.log('El administrador por defecto ya existe.', existing.email);
      return;
    }

    const admin = await prisma.user.create({
      data: {
        document: defaultDocument,
        email: defaultEmail,
        password: defaultPassword,
        fullName: 'Administrador Principal',
        userType: 'instructor',
      }
    });
    console.log('✅ Usuario Administrador creado exitosamente!');
    console.log('Documento:', admin.document);
    console.log('Password: 123456');
  } catch (error) {
    console.error('Error al insertar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
