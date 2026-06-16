const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    const sqlFile = path.join(__dirname, '../migrate_materias_to_competencias.sql');
    let sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Strip comments
    sqlContent = sqlContent.replace(/--.*$/gm, '');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} statements...`);

    for (const statement of statements) {
      if (statement.toUpperCase().startsWith('BEGIN') || statement.toUpperCase().startsWith('COMMIT')) continue;
      
      console.log(`Executing: ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
      await prisma.$executeRawUnsafe(statement);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
