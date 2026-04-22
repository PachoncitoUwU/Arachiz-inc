-- SQL para agregar el campo 'nombre' a la tabla Ficha
-- Ejecutar este comando en tu base de datos PostgreSQL

-- Paso 1: Agregar la columna 'nombre' con valor por defecto para las filas existentes
ALTER TABLE "Ficha" ADD COLUMN "nombre" TEXT NOT NULL DEFAULT 'Programa sin nombre';

-- Paso 2: (Opcional) Si quieres actualizar los nombres de las fichas existentes:
-- UPDATE "Ficha" SET "nombre" = 'Nombre del programa real' WHERE "numero" = '3146013';
-- Repite para cada ficha con su nombre real

-- Nota: El valor por defecto 'Programa sin nombre' es temporal para las fichas existentes.
-- Las nuevas fichas requerirán este campo obligatoriamente desde el formulario.
