-- Tabla para registrar conflictos de horario
CREATE TABLE IF NOT EXISTS "ConflictoHorario" (
  id TEXT PRIMARY KEY,
  "instructorId" TEXT NOT NULL,
  dia TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  "horarioIds" TEXT NOT NULL, -- JSON array de IDs de horarios en conflicto
  resuelto BOOLEAN DEFAULT FALSE,
  "creadoPor" TEXT, -- ID del admin que causó el conflicto
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  FOREIGN KEY ("instructorId") REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY ("creadoPor") REFERENCES "User"(id) ON DELETE SET NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_conflicto_instructor ON "ConflictoHorario"("instructorId");
CREATE INDEX IF NOT EXISTS idx_conflicto_resuelto ON "ConflictoHorario"(resuelto);
