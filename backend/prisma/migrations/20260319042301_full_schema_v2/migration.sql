-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userType" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ficha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "centro" TEXT NOT NULL,
    "jornada" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT '',
    "duracion" INTEGER NOT NULL DEFAULT 0,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instructorAdminId" TEXT NOT NULL,
    CONSTRAINT "Ficha_instructorAdminId_fkey" FOREIGN KEY ("instructorAdminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FichaInstructor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'invitado',
    "fichaId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    CONSTRAINT "FichaInstructor_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "Ficha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FichaInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Materia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fichaId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    CONSTRAINT "Materia_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "Ficha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Materia_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Horario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dia" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "fichaId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    CONSTRAINT "Horario_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "Ficha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Horario_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materiaId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    CONSTRAINT "Asistencia_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asistencia_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroAsistencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "metodo" TEXT NOT NULL DEFAULT 'manual',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asistenciaId" TEXT NOT NULL,
    "aprendizId" TEXT NOT NULL,
    CONSTRAINT "RegistroAsistencia_asistenciaId_fkey" FOREIGN KEY ("asistenciaId") REFERENCES "Asistencia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RegistroAsistencia_aprendizId_fkey" FOREIGN KEY ("aprendizId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Excusa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motivo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechas" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "respuesta" TEXT,
    "archivoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "aprendizId" TEXT NOT NULL,
    CONSTRAINT "Excusa_aprendizId_fkey" FOREIGN KEY ("aprendizId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_Aprendices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_Aprendices_A_fkey" FOREIGN KEY ("A") REFERENCES "Ficha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Aprendices_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_document_key" ON "User"("document");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ficha_numero_key" ON "Ficha"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Ficha_code_key" ON "Ficha"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FichaInstructor_fichaId_instructorId_key" ON "FichaInstructor"("fichaId", "instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroAsistencia_asistenciaId_aprendizId_key" ON "RegistroAsistencia"("asistenciaId", "aprendizId");

-- CreateIndex
CREATE UNIQUE INDEX "_Aprendices_AB_unique" ON "_Aprendices"("A", "B");

-- CreateIndex
CREATE INDEX "_Aprendices_B_index" ON "_Aprendices"("B");
