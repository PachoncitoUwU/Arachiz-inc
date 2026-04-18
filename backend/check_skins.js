require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.snakeSkin.findMany({ select: { name: true, rarity: true, price: true } })
  .then(skins => {
    console.log(`Total skins en BD: ${skins.length}`);
    skins.forEach(s => console.log(` - ${s.name} (${s.rarity}) $${s.price}`));
  })
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
