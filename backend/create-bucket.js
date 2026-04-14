const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBucket() {
  try {
    console.log('Creando bucket foto-aprendices en Supabase Storage vía SQL...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('foto-aprendices', 'foto-aprendices', true, null, null)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Access 1" ON storage.objects FOR SELECT TO public USING (bucket_id = 'foto-aprendices');
    `).catch(e => console.log('Policy SELECT ya existe o no se pudo crear.'));

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Insert 1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'foto-aprendices');
    `).catch(e => console.log('Policy INSERT ya existe o no se pudo crear.'));

    console.log('Bucket foto-aprendices creado con éxito.');
  } catch (error) {
    console.error('Error al crear el bucket:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createBucket();
