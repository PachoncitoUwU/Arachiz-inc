const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const fichaId = 'cmqfpce0l0001ydjwzutnn4vo';
    await prisma.ficha.delete({
      where: { id: fichaId }
    });
    console.log('Ficha deleted successfully!');
  } catch (err) {
    console.error('Error deleting ficha:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
