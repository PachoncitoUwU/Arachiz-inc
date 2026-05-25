-- Migración para hacer instructorAdminId nullable
-- Esto permite que las fichas puedan quedar sin líder designado

ALTER TABLE "Ficha" ALTER COLUMN "instructorAdminId" DROP NOT NULL;
