-- Script para actualizar el schema de excusas en Supabase
-- Ejecutado: Pendiente
-- Fecha: 2026-04-26

-- 1. Eliminar la tabla actual de excusas
DROP TABLE IF EXISTS "Excusa" CASCADE;

-- 2. Crear la nueva tabla de excusas
CREATE TABLE "Excusa" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "motivo" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "respuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "aprendizId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "registroAsistenciaId" TEXT,

    CONSTRAINT "Excusa_pkey" PRIMARY KEY ("id")
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX "Excusa_aprendizId_idx" ON "Excusa"("aprendizId");
CREATE INDEX "Excusa_materiaId_idx" ON "Excusa"("materiaId");
CREATE INDEX "Excusa_estado_idx" ON "Excusa"("estado");
CREATE INDEX "Excusa_fecha_idx" ON "Excusa"("fecha");

-- 4. Agregar las relaciones de clave foránea
ALTER TABLE "Excusa" ADD CONSTRAINT "Excusa_aprendizId_fkey" 
    FOREIGN KEY ("aprendizId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Excusa" ADD CONSTRAINT "Excusa_materiaId_fkey" 
    FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Excusa" ADD CONSTRAINT "Excusa_registroAsistenciaId_fkey" 
    FOREIGN KEY ("registroAsistenciaId") REFERENCES "RegistroAsistencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Agregar constraint para evitar excusas duplicadas
ALTER TABLE "Excusa" ADD CONSTRAINT "Excusa_aprendizId_materiaId_fecha_key" 
    UNIQUE ("aprendizId", "materiaId", "fecha");

-- 6. Agregar campo justificado a RegistroAsistencia
ALTER TABLE "RegistroAsistencia" ADD COLUMN IF NOT EXISTS "justificado" BOOLEAN NOT NULL DEFAULT false;

-- 7. Verificar que todo esté correcto
SELECT 
    'Excusa' as tabla,
    COUNT(*) as registros
FROM "Excusa"
UNION ALL
SELECT 
    'RegistroAsistencia con campo justificado' as tabla,
    COUNT(*) as registros
FROM "RegistroAsistencia"
WHERE "justificado" IS NOT NULL;
