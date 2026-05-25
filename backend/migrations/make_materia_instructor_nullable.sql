-- Migración para hacer instructorId nullable en Materia
-- Esto permite que las materias puedan quedar sin instructor asignado

ALTER TABLE "Materia" ALTER COLUMN "instructorId" DROP NOT NULL;
