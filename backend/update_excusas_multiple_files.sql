-- Actualizar tabla Excusa para soportar múltiples archivos y fechas
-- Ejecutar en Supabase

-- 1. Eliminar constraint único de fecha
ALTER TABLE "Excusa" DROP CONSTRAINT IF EXISTS "Excusa_aprendizId_materiaId_fecha_key";

-- 2. Eliminar índice de fecha
DROP INDEX IF EXISTS "Excusa_fecha_idx";

-- 3. Cambiar columna fecha a fechas (JSON string)
ALTER TABLE "Excusa" RENAME COLUMN "fecha" TO "fechas";
ALTER TABLE "Excusa" ALTER COLUMN "fechas" TYPE TEXT;

-- 4. Cambiar columna archivoUrl a archivosUrls (JSON string)
ALTER TABLE "Excusa" RENAME COLUMN "archivoUrl" TO "archivosUrls";

-- Verificar cambios
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'Excusa' 
    AND column_name IN ('fechas', 'archivosUrls');
