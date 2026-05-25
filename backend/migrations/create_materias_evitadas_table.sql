-- Crear tabla MateriaEvitada
CREATE TABLE IF NOT EXISTS "MateriaEvitada" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "aprendizId" TEXT NOT NULL,
  "materiaId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "MateriaEvitada_aprendizId_fkey" 
    FOREIGN KEY ("aprendizId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT "MateriaEvitada_materiaId_fkey" 
    FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT "MateriaEvitada_aprendizId_materiaId_key" 
    UNIQUE ("aprendizId", "materiaId")
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "MateriaEvitada_aprendizId_idx" ON "MateriaEvitada"("aprendizId");
CREATE INDEX IF NOT EXISTS "MateriaEvitada_materiaId_idx" ON "MateriaEvitada"("materiaId");
