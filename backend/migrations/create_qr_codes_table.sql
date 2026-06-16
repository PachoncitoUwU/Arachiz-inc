-- Tabla para persistir códigos QR en base de datos
-- Evita perder los códigos cuando Render reinicia el servidor (cold start)
CREATE TABLE IF NOT EXISTS "QrCode" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "code"      TEXT NOT NULL UNIQUE,
  "payload"   TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por code
CREATE UNIQUE INDEX IF NOT EXISTS "QrCode_code_key" ON "QrCode"("code");

-- Limpiar códigos expirados automáticamente (ejecutar periódicamente o con cron)
-- DELETE FROM "QrCode" WHERE "expiresAt" < NOW();
