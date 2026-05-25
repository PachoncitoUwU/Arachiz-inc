-- =====================================================
-- SQL para implementar Rol de Administrador
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar campo administradorId a tabla Ficha
-- Este campo vincula un administrador a una ficha
ALTER TABLE "Ficha" 
ADD COLUMN "administradorId" TEXT;

-- Agregar foreign key constraint
ALTER TABLE "Ficha"
ADD CONSTRAINT "Ficha_administradorId_fkey" 
FOREIGN KEY ("administradorId") 
REFERENCES "User"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Crear índice para mejorar performance
CREATE INDEX "Ficha_administradorId_idx" ON "Ficha"("administradorId");

-- =====================================================
-- 2. Crear tabla Papelera
-- Almacena elementos eliminados (soft delete)
-- =====================================================
CREATE TABLE "Papelera" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tipoElemento" TEXT NOT NULL, -- 'ficha', 'materia', 'instructor', 'aprendiz'
  "elementoId" TEXT NOT NULL, -- ID del elemento eliminado
  "fichaId" TEXT NOT NULL, -- Ficha a la que pertenece
  "eliminadoPor" TEXT NOT NULL, -- Usuario que lo eliminó
  "rolEliminador" TEXT NOT NULL, -- 'administrador', 'lider', 'instructor'
  "fechaEliminacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "datosOriginales" JSONB NOT NULL, -- Backup completo del elemento
  "razonEliminacion" TEXT, -- Opcional: razón de la eliminación
  
  CONSTRAINT "Papelera_fichaId_fkey" 
    FOREIGN KEY ("fichaId") 
    REFERENCES "Ficha"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "Papelera_eliminadoPor_fkey" 
    FOREIGN KEY ("eliminadoPor") 
    REFERENCES "User"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Índices para Papelera
CREATE INDEX "Papelera_fichaId_idx" ON "Papelera"("fichaId");
CREATE INDEX "Papelera_eliminadoPor_idx" ON "Papelera"("eliminadoPor");
CREATE INDEX "Papelera_tipoElemento_idx" ON "Papelera"("tipoElemento");
CREATE INDEX "Papelera_fechaEliminacion_idx" ON "Papelera"("fechaEliminacion");

-- =====================================================
-- 3. Crear tabla HistorialCambios
-- Registra todos los cambios importantes (auditoría)
-- =====================================================
CREATE TABLE "HistorialCambios" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "fichaId" TEXT NOT NULL, -- Ficha donde ocurrió el cambio
  "usuarioId" TEXT NOT NULL, -- Usuario que hizo el cambio
  "tipoEvento" TEXT NOT NULL, -- 'crear', 'editar', 'eliminar', 'restaurar', 'cambio_lider', etc.
  "entidad" TEXT NOT NULL, -- 'ficha', 'materia', 'aprendiz', 'instructor', 'horario', 'excusa'
  "entidadId" TEXT NOT NULL, -- ID del elemento modificado
  "descripcion" TEXT NOT NULL, -- Descripción legible del cambio
  "datosAnteriores" JSONB, -- Estado anterior (para ediciones)
  "datosNuevos" JSONB, -- Estado nuevo (para ediciones)
  "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT, -- Opcional: IP del usuario
  
  CONSTRAINT "HistorialCambios_fichaId_fkey" 
    FOREIGN KEY ("fichaId") 
    REFERENCES "Ficha"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  CONSTRAINT "HistorialCambios_usuarioId_fkey" 
    FOREIGN KEY ("usuarioId") 
    REFERENCES "User"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Índices para HistorialCambios
CREATE INDEX "HistorialCambios_fichaId_idx" ON "HistorialCambios"("fichaId");
CREATE INDEX "HistorialCambios_usuarioId_idx" ON "HistorialCambios"("usuarioId");
CREATE INDEX "HistorialCambios_tipoEvento_idx" ON "HistorialCambios"("tipoEvento");
CREATE INDEX "HistorialCambios_entidad_idx" ON "HistorialCambios"("entidad");
CREATE INDEX "HistorialCambios_fechaHora_idx" ON "HistorialCambios"("fechaHora");

-- =====================================================
-- 4. Comentarios en las tablas (documentación)
-- =====================================================
COMMENT ON TABLE "Papelera" IS 'Almacena elementos eliminados (soft delete) que pueden ser recuperados o eliminados permanentemente';
COMMENT ON TABLE "HistorialCambios" IS 'Registro de auditoría de todos los cambios importantes en el sistema';

COMMENT ON COLUMN "Papelera"."tipoElemento" IS 'Tipo de elemento: ficha, materia, instructor, aprendiz';
COMMENT ON COLUMN "Papelera"."rolEliminador" IS 'Rol del usuario que eliminó: administrador, lider, instructor';
COMMENT ON COLUMN "Papelera"."datosOriginales" IS 'Backup completo del elemento en formato JSON para poder restaurarlo';

COMMENT ON COLUMN "HistorialCambios"."tipoEvento" IS 'Tipo de evento: crear, editar, eliminar, restaurar, cambio_lider, cambio_instructor, aprobar_excusa, etc.';
COMMENT ON COLUMN "HistorialCambios"."entidad" IS 'Entidad modificada: ficha, materia, aprendiz, instructor, horario, excusa';

-- =====================================================
-- 5. Verificación de la migración
-- =====================================================
-- Ejecuta estas queries para verificar que todo se creó correctamente:

-- Verificar que se agregó el campo administradorId
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'Ficha' AND column_name = 'administradorId';

-- Verificar que se creó la tabla Papelera
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'Papelera';

-- Verificar que se creó la tabla HistorialCambios
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'HistorialCambios';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Este script es IDEMPOTENTE parcialmente. Si ya existe alguna tabla/columna, dará error.
-- 2. Después de ejecutar este SQL, debes actualizar el schema.prisma
-- 3. No olvides ejecutar: npx prisma generate
-- 4. El campo userType en User ya existe, solo necesitas agregar 'administrador' en la validación del backend
-- =====================================================
