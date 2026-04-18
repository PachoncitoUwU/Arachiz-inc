const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlockAllSkinsForInstructors() {
  console.log('🔓 Desbloqueando todas las skins para TODOS los instructores...\n');
  
  try {
    // Buscar TODOS los instructores
    const instructors = await prisma.user.findMany({
      where: { userType: 'instructor' }
    });
    
    if (instructors.length === 0) {
      console.error('❌ No se encontraron instructores en la base de datos');
      return;
    }
    
    console.log(`👥 Instructores encontrados: ${instructors.length}\n`);
    
    // Obtener todas las skins
    const allSkins = await prisma.snakeSkin.findMany();
    console.log(`🎨 Total de skins disponibles: ${allSkins.length}\n`);
    
    let totalUnlocked = 0;
    let totalAlreadyUnlocked = 0;
    
    // Procesar cada instructor
    for (const instructor of instructors) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 Procesando: ${instructor.fullName} (${instructor.email})`);
      console.log(`${'='.repeat(60)}`);
      
      let unlockedCount = 0;
      let alreadyUnlockedCount = 0;
      
      // Desbloquear todas las skins para este instructor
      for (const skin of allSkins) {
        try {
          // Verificar si ya tiene la skin
          const existing = await prisma.userSkin.findUnique({
            where: {
              userId_skinId: {
                userId: instructor.id,
                skinId: skin.id
              }
            }
          });
          
          if (existing) {
            console.log(`⏭️  Ya tiene: ${skin.name}`);
            alreadyUnlockedCount++;
          } else {
            // Crear la skin para el usuario
            await prisma.userSkin.create({
              data: {
                userId: instructor.id,
                skinId: skin.id,
                equipped: false
              }
            });
            console.log(`✅ Desbloqueada: ${skin.name} (${skin.rarity}) - ${skin.price} COP`);
            unlockedCount++;
          }
        } catch (error) {
          console.error(`❌ Error con ${skin.name}:`, error.message);
        }
      }
      
      console.log(`\n📊 ${instructor.fullName}:`);
      console.log(`   ✅ Desbloqueadas: ${unlockedCount}`);
      console.log(`   ⏭️  Ya tenía: ${alreadyUnlockedCount}`);
      
      totalUnlocked += unlockedCount;
      totalAlreadyUnlocked += alreadyUnlockedCount;
      
      // Equipar la skin por defecto si no tiene ninguna equipada
      const equippedSkin = await prisma.userSkin.findFirst({
        where: {
          userId: instructor.id,
          equipped: true
        }
      });
      
      if (!equippedSkin) {
        const defaultSkin = await prisma.snakeSkin.findFirst({
          where: { isDefault: true }
        });
        
        if (defaultSkin) {
          await prisma.userSkin.updateMany({
            where: {
              userId: instructor.id,
              skinId: defaultSkin.id
            },
            data: { equipped: true }
          });
          console.log(`   🎯 Skin por defecto equipada: ${defaultSkin.name}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎉 PROCESO COMPLETADO!`);
    console.log(`👥 Instructores procesados: ${instructors.length}`);
    console.log(`✅ Total de skins desbloqueadas: ${totalUnlocked}`);
    console.log(`⏭️  Total ya desbloqueadas: ${totalAlreadyUnlocked}`);
    console.log('='.repeat(60));
    
    console.log('\n🐍 ¡Todos los instructores ahora tienen acceso a todas las skins!');
    console.log('🎮 Recarga el juego para ver los cambios.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

unlockAllSkinsForInstructors();
