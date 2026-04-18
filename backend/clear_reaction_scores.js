require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } }
});

async function main() {
  const deleted = await prisma.reactionScore.deleteMany({});
  console.log(`✅ Borrados ${deleted.count} scores viejos de Reaction`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
