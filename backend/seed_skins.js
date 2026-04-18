const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SKINS = [
  // ── GRATIS ──────────────────────────────────────────────────────────────────
  {
    name: 'Clásica',
    description: 'La serpiente de toda la vida. Simple, limpia, efectiva.',
    price: 0, rarity: 'common',
    headColor: '#00ff88', bodyColor: '#00cc6a',
    pattern: 'solid', trailEffect: 'none', eyeStyle: 'normal', isDefault: true,
  },

  // ── COMUNES ($1.500 – $2.500) ────────────────────────────────────────────────
  {
    name: 'Océano',
    description: 'Azul profundo como el mar. Fresca y elegante.',
    price: 1500, rarity: 'common',
    headColor: '#0ea5e9', bodyColor: '#0284c7',
    pattern: 'solid', trailEffect: 'none', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Lava',
    description: 'Rojo ardiente. Peligrosa y apasionada.',
    price: 1500, rarity: 'common',
    headColor: '#ef4444', bodyColor: '#dc2626',
    pattern: 'solid', trailEffect: 'none', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Amatista',
    description: 'Morado profundo con brillo cristalino.',
    price: 2000, rarity: 'common',
    headColor: '#a855f7', bodyColor: '#7c3aed',
    pattern: 'solid', trailEffect: 'none', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Naranja Neón',
    description: 'Vibrante y llamativa. Imposible de ignorar.',
    price: 2000, rarity: 'common',
    headColor: '#fb923c', bodyColor: '#ea580c',
    pattern: 'solid', trailEffect: 'none', eyeStyle: 'normal', isDefault: false,
  },

  // ── RARAS ($3.500 – $5.000) ──────────────────────────────────────────────────
  {
    name: 'Hielo Ártico',
    description: 'Cristales de hielo que dejan un rastro helado a su paso.',
    price: 3500, rarity: 'rare',
    headColor: '#e0f7ff', bodyColor: '#7dd3fc',
    pattern: 'ice', trailEffect: 'ice', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Degradado Solar',
    description: 'Transición de colores cálidos del amanecer al atardecer.',
    price: 4000, rarity: 'rare',
    headColor: '#fbbf24', bodyColor: '#f97316',
    pattern: 'gradient', trailEffect: 'sparkles', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Neón Verde',
    description: 'Brilla en la oscuridad. Efecto neón puro.',
    price: 4500, rarity: 'rare',
    headColor: '#00ff88', bodyColor: '#00cc6a',
    pattern: 'neon', trailEffect: 'sparkles', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Neón Rosa',
    description: 'Rosa eléctrico con aura brillante. Estilo cyberpunk.',
    price: 4500, rarity: 'rare',
    headColor: '#f472b6', bodyColor: '#ec4899',
    pattern: 'neon', trailEffect: 'hearts', eyeStyle: 'cute', isDefault: false,
  },
  {
    name: 'Estrellas',
    description: 'Deja un rastro de estrellas doradas a su paso.',
    price: 5000, rarity: 'rare',
    headColor: '#fbbf24', bodyColor: '#d97706',
    pattern: 'solid', trailEffect: 'stars', eyeStyle: 'normal', isDefault: false,
  },

  // ── ÉPICAS ($7.000 – $12.000) ────────────────────────────────────────────────
  {
    name: 'Dragón de Fuego',
    description: 'Llamas que consumen todo a su paso. Poder puro.',
    price: 7000, rarity: 'epic',
    headColor: '#ffd700', bodyColor: '#ff4500',
    pattern: 'fire', trailEffect: 'fire', eyeStyle: 'angry', isDefault: false,
  },
  {
    name: 'Arcoíris',
    description: 'Todos los colores del espectro en una sola serpiente.',
    price: 8000, rarity: 'epic',
    headColor: '#ff0080', bodyColor: '#0080ff',
    pattern: 'rainbow', trailEffect: 'sparkles', eyeStyle: 'cute', isDefault: false,
  },
  {
    name: 'Galaxia',
    description: 'El cosmos en tu serpiente. Morado profundo con estrellas.',
    price: 9000, rarity: 'epic',
    headColor: '#c084fc', bodyColor: '#4a148c',
    pattern: 'galaxy', trailEffect: 'stars', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Rayo',
    description: 'Velocidad eléctrica. Deja rayos a su paso.',
    price: 10000, rarity: 'epic',
    headColor: '#fde047', bodyColor: '#ca8a04',
    pattern: 'neon', trailEffect: 'lightning', eyeStyle: 'laser', isDefault: false,
  },
  {
    name: 'Neón Azul Eléctrico',
    description: 'Azul eléctrico que ilumina la oscuridad.',
    price: 10000, rarity: 'epic',
    headColor: '#60a5fa', bodyColor: '#2563eb',
    pattern: 'neon', trailEffect: 'lightning', eyeStyle: 'laser', isDefault: false,
  },

  // ── LEGENDARIAS ($15.000 – $25.000) ─────────────────────────────────────────
  {
    name: 'Serpiente Dorada',
    description: 'Oro puro. Solo los mejores merecen esta skin.',
    price: 15000, rarity: 'legendary',
    headColor: '#ffd700', bodyColor: '#ffb300',
    pattern: 'gold', trailEffect: 'sparkles', eyeStyle: 'normal', isDefault: false,
  },
  {
    name: 'Fénix',
    description: 'Renace de las llamas. Degradado épico de fuego y oro.',
    price: 20000, rarity: 'legendary',
    headColor: '#ffd700', bodyColor: '#ff4500',
    pattern: 'fire', trailEffect: 'fire', eyeStyle: 'laser', isDefault: false,
  },
  {
    name: 'Cosmos Infinito',
    description: 'Galaxia + arcoíris. La skin más hermosa del universo.',
    price: 22000, rarity: 'legendary',
    headColor: '#c084fc', bodyColor: '#1a0030',
    pattern: 'galaxy', trailEffect: 'void', eyeStyle: 'laser', isDefault: false,
  },

  // ── MÍTICAS ($35.000+) ───────────────────────────────────────────────────────
  {
    name: '☠️ El Vacío',
    description: 'Oscuridad absoluta. Solo los más valientes se atreven.',
    price: 35000, rarity: 'mythic',
    headColor: '#c084fc', bodyColor: '#0d0020',
    pattern: 'void', trailEffect: 'void', eyeStyle: 'laser', isDefault: false,
  },
  {
    name: '👑 Serpiente Suprema',
    description: 'La skin definitiva. Arcoíris + fuego + rayos. Eres una leyenda.',
    price: 50000, rarity: 'mythic',
    headColor: '#ffd700', bodyColor: '#ff0080',
    pattern: 'rainbow', trailEffect: 'lightning', eyeStyle: 'laser', isDefault: false,
  },
];

async function main() {
  console.log('🌱 Seeding skins...');

  // Limpiar skins existentes (opcional — comenta si no quieres borrar)
  await prisma.userSkin.deleteMany({});
  await prisma.snakeSkin.deleteMany({});

  for (const skin of SKINS) {
    await prisma.snakeSkin.create({ data: skin });
    console.log(`  ✅ ${skin.name} (${skin.rarity}) — $${skin.price}`);
  }

  console.log(`\n✨ ${SKINS.length} skins creadas exitosamente`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
