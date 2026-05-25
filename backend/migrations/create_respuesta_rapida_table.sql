-- Crear tabla RespuestaRapida para respuestas rápidas por instructor
CREATE TABLE "RespuestaRapida" (
  "id" TEXT PRIMARY KEY,
  "instructorId" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "orden" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RespuestaRapida_instructorId_fkey" 
    FOREIGN KEY ("instructorId") 
    REFERENCES "User"("id") 
    ON DELETE CASCADE
);

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX "RespuestaRapida_instructorId_idx" ON "RespuestaRapida"("instructorId");

-- Comentarios para documentación
COMMENT ON TABLE "RespuestaRapida" IS 'Respuestas rápidas personalizadas por instructor para excusas';
COMMENT ON COLUMN "RespuestaRapida"."instructorId" IS 'ID del instructor dueño de la respuesta';
COMMENT ON COLUMN "RespuestaRapida"."texto" IS 'Texto de la respuesta rápida';
COMMENT ON COLUMN "RespuestaRapida"."orden" IS 'Orden de visualización de la respuesta';
