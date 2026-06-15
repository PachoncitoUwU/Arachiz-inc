-- Iniciar transacción para asegurar consistencia
BEGIN;

-- =========================================================================
-- COMENTARIO IMPORTANTE Y EXPLICACIÓN DE REGISTROS HUÉRFANOS:
-- Las tablas "Horario", "Asistencia", "Excusa" y "MateriaEvitada" tienen
-- relaciones obligatorias (no nulas) con la antigua entidad "Materia"
-- (ahora migrada a "ResultadoAprendizaje"). Debido a que la tabla 
-- "ResultadoAprendizaje" se crea completamente vacía en esta fase de la 
-- migración (ninguna materia genera resultados automáticamente), no hay 
-- registros de Resultado de Aprendizaje a los cuales apuntar estas entidades.
--
-- Como el esquema de Prisma exige que "resultadoId" sea un campo no nulo,
-- NO es posible asignarles NULL. Por lo tanto, para mantener la integridad
-- referencial de la base de datos y evitar violaciones de clave foránea 
-- al aplicar los nuevos constraints, se proceden a eliminar los registros 
-- existentes en estas tablas dependientes.
-- =========================================================================

-- 1. Eliminar registros de tablas dependientes que quedarían huérfanos
DELETE FROM "Horario";
DELETE FROM "RegistroAsistencia"; -- Se limpia ya que tiene clave foránea ON DELETE CASCADE con Asistencia
DELETE FROM "Asistencia";
DELETE FROM "Excusa";
DELETE FROM "MateriaEvitada";

-- 2. Renombrar la tabla "Materia" a "Competencia"
ALTER TABLE "Materia" RENAME TO "Competencia";

-- 3. Eliminar el campo "instructorId" de la nueva tabla "Competencia"
-- Primero eliminamos la restricción de clave foránea si existe
ALTER TABLE "Competencia" DROP CONSTRAINT IF EXISTS "Materia_instructorId_fkey";
ALTER TABLE "Competencia" DROP COLUMN IF EXISTS "instructorId";

-- 4. Crear la tabla "ResultadoAprendizaje" vacía
CREATE TABLE "ResultadoAprendizaje" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "instructorId" TEXT,

    CONSTRAINT "ResultadoAprendizaje_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ResultadoAprendizaje_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "Competencia"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResultadoAprendizaje_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Renombrar la tabla "MateriaEvitada" a "ResultadoEvitado"
ALTER TABLE "MateriaEvitada" RENAME TO "ResultadoEvitado";

-- 6. Modificar las columnas y restricciones de las tablas dependientes
-- para apuntar a "ResultadoAprendizaje" en lugar de "Materia"

-- Modificaciones en "Horario"
ALTER TABLE "Horario" DROP CONSTRAINT IF EXISTS "Horario_materiaId_fkey";
ALTER TABLE "Horario" RENAME COLUMN "materiaId" TO "resultadoId";
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "ResultadoAprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Modificaciones en "Asistencia"
ALTER TABLE "Asistencia" DROP CONSTRAINT IF EXISTS "Asistencia_materiaId_fkey";
ALTER TABLE "Asistencia" RENAME COLUMN "materiaId" TO "resultadoId";
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "ResultadoAprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Modificaciones en "Excusa"
ALTER TABLE "Excusa" DROP CONSTRAINT IF EXISTS "Excusa_materiaId_fkey";
DROP INDEX IF EXISTS "Excusa_materiaId_idx";
ALTER TABLE "Excusa" RENAME COLUMN "materiaId" TO "resultadoId";
ALTER TABLE "Excusa" ADD CONSTRAINT "Excusa_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "ResultadoAprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Excusa_resultadoId_idx" ON "Excusa"("resultadoId");

-- Modificaciones en "ResultadoEvitado" (antes MateriaEvitada)
ALTER TABLE "ResultadoEvitado" DROP CONSTRAINT IF EXISTS "MateriaEvitada_materiaId_fkey";
ALTER TABLE "ResultadoEvitado" DROP CONSTRAINT IF EXISTS "MateriaEvitada_aprendizId_materiaId_key";
ALTER TABLE "ResultadoEvitado" RENAME COLUMN "materiaId" TO "resultadoId";
ALTER TABLE "ResultadoEvitado" ADD CONSTRAINT "ResultadoEvitado_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "ResultadoAprendizaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResultadoEvitado" ADD CONSTRAINT "ResultadoEvitado_aprendizId_resultadoId_key" UNIQUE ("aprendizId", "resultadoId");

-- Finalizar la transacción
COMMIT;
