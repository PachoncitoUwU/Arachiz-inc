-- Tablas para los nuevos juegos (sin DROP ni TRUNCATE)
CREATE TABLE IF NOT EXISTS "TowerScore" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  score INTEGER NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "userId" TEXT NOT NULL UNIQUE,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReactionScore" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  score INTEGER NOT NULL, -- milisegundos (menor = mejor)
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "userId" TEXT NOT NULL UNIQUE,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "MemoryScore" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  score INTEGER NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "userId" TEXT NOT NULL UNIQUE,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "WordleScore" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  score INTEGER NOT NULL, -- intentos usados (menor = mejor)
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "userId" TEXT NOT NULL UNIQUE,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);
