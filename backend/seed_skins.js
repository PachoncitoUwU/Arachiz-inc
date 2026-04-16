const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EPIC_SKINS = [
  // SKIN POR DEFECTO (GRATIS)
  {
    name: 'Clásica Verde',
    description: 'La serpiente clásica de toda la vida. Simple pero efectiva.',
    price: 0,
    rarity: 'common',
    headColor: '#00ff88',
    bodyColor: '#00ff88',
    pattern: 'solid',
    trailEffect: 'none',
    eyeStyle: 'normal',
    isDefault: true
  },
  
  // SKINS COMUNES (Baratas)
  {
    name: 'Serpiente Azul',
    description: 'Un toque de frescura con este azul vibrante.',
    price: 2000,
    rarity: 'common',
    headColor: '#3742fa',
    bodyColor: '#3742fa',
    pattern: 'solid',
    trailEffect: 'none',
    eyeStyle: 'normal',
    isDefault: false
  },
  {
    name: 'Serpiente Roja',
    description: 'Peligro y pasión en cada movimiento.',
    price: 2000,
    rarity: 'common',
    headColor: '#ff4757',
    bodyColor: '#ff4757',
    pattern: 'solid',
    trailEffect: 'none',
    eyeStyle: 'normal',
    isDefault: false
  },
  {
    name: 'Serpiente Dorada',
    description: 'Brilla como el oro mientras devoras manzanas.',
    price: 3000,
    rarity: 'common',
    headColor: '#ffa502',
    bodyColor: '#ffa502',
    pattern: 'solid',
    trailEffect: 'none',
    eyeStyle: 'normal',
    isDefault: false
  },
  
  // SKINS RARAS (Precio medio)
  {
    name: 'Neón Cibernético',
    description: 'Directa del futuro. Líneas neón que brillan en la oscuridad.',
    price: 5000,
    rarity: 'rare',
    headColor: '#00ffff',
    bodyColor: '#ff00ff',
    pattern: 'neon',
    trailEffect: 'sparkles',
    eyeStyle: 'laser',
    isDefault: false
  },
  {
    name: 'Camuflaje Militar',
    description: 'Sigilosa y táctica. Perfecta para operaciones encubiertas.',
    price: 5500,
    rarity: 'rare',
    headColor: '#4a5568',
    bodyColor: '#2d3748',
    pattern: 'gradient',
    trailEffect: 'none',
    eyeStyle: 'angry',
    isDefault: false
  },
  {
    name: 'Serpiente de Hielo',
    description: 'Fría como el invierno. Deja un rastro congelado a tu paso.',
    price: 6000,
    rarity: 'rare',
    headColor: '#a0d8f1',
    bodyColor: '#e0f4ff',
    pattern: 'ice',
    trailEffect: 'ice',
    eyeStyle: 'cute',
    isDefault: false
  },
  
  // SKINS ÉPICAS (Caras)
  {
    name: 'Dragón de Fuego',
    description: '🔥 No es una serpiente, es un DRAGÓN. Escupe fuego y domina el tablero.',
    price: 10000,
    rarity: 'epic',
    headColor: '#ff6b35',
    bodyColor: '#ff9a3c',
    pattern: 'fire',
    trailEffect: 'fire',
    eyeStyle: 'angry',
    isDefault: false
  },
  {
    name: 'Serpiente Metálica',
    description: '⚙️ Forjada en acero. Indestructible y reluciente.',
    price: 10000,
    rarity: 'epic',
    headColor: '#718096',
    bodyColor: '#a0aec0',
    pattern: 'metallic',
    trailEffect: 'sparkles',
    eyeStyle: 'laser',
    isDefault: false
  },
  {
    name: 'Arcoíris Místico',
    description: '🌈 Todos los colores del universo en una sola serpiente.',
    price: 12000,
    rarity: 'epic',
    headColor: '#ff0080',
    bodyColor: '#00ff80',
    pattern: 'rainbow',
    trailEffect: 'stars',
    eyeStyle: 'cute',
    isDefault: false
  },
  
  // SKINS LEGENDARIAS (Muy caras)
  {
    name: 'Galaxia Infinita',
    description: '🌌 El cosmos entero fluye por tu cuerpo. Estrellas, nebulosas y agujeros negros.',
    price: 20000,
    rarity: 'legendary',
    headColor: '#1a1a2e',
    bodyColor: '#16213e',
    pattern: 'galaxy',
    trailEffect: 'stars',
    eyeStyle: 'laser',
    isDefault: false
  },
  {
    name: 'Relámpago Divino',
    description: '⚡ La velocidad de un rayo. Electricidad pura recorriendo cada segmento.',
    price: 22000,
    rarity: 'legendary',
    headColor: '#ffeb3b',
    bodyColor: '#ffc107',
    pattern: 'neon',
    trailEffect: 'lightning',
    eyeStyle: 'laser',
    isDefault: false
  },
  {
    name: 'Sombra Espectral',
    description: '👻 Ni viva ni muerta. Una entidad de otro plano que devora almas... y manzanas.',
    price: 25000,
    rarity: 'legendary',
    headColor: '#2d3436',
    bodyColor: '#636e72',
    pattern: 'gradient',
    trailEffect: 'sparkles',
    eyeStyle: 'laser',
    isDefault: false
  },
  
  // SKIN MÍTICA (La más cara y épica)
  {
    name: 'Dios Serpiente Azteca',
    description: '🐍👑 QUETZALCÓATL. La serpiente emplumada de las leyendas. Poder absoluto.',
    price: 50000,
    rarity: 'mythic',
    headColor: '#00d2d3',
    bodyColor: '#1e3799',
    pattern: 'rainbow',
    trailEffect: 'stars',
    eyeStyle: 'laser',
    isDefault: false
  }
];

async function seedSkins() {
  console.log('🐍 Seeding epic Snake skins...');
  
  try {
    // Eliminar skins existentes (opcional, comentar si no quieres borrar)
    // await prisma.snakeSkin.deleteMany({});
    
    for (const skinData of EPIC_SKINS) {
      const skin = await prisma.snakeSkin.upsert({
        where: { name: skinData.name },
        update: skinData,
        create: skinData
      });
      console.log(`✅ Created/Updated: ${skin.name} (${skin.rarity}) - $${skin.price} COP`);
    }
    
    console.log('\n🎉 All skins seeded successfully!');
    console.log(`📊 Total skins: ${EPIC_SKINS.length}`);
  } catch (error) {
    console.error('❌ Error seeding skins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSkins();
