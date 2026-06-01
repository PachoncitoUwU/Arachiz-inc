-- ============================================================
-- SCRIPT DE DATOS DE PRUEBA — ARACHIZ
-- Ficha 3146013 | SENA
-- 
-- INSTRUCCIONES DE USO:
-- 1. Abre Prisma Studio: cd backend && npx prisma studio
-- 2. O usa el endpoint de seed si existe
-- 3. Este script es REFERENCIAL — los IDs reales los genera Prisma
--
-- DATOS INCLUIDOS:
--   - 1 Administrador
--   - 3 Instructores
--   - 10 Aprendices
--   - 2 Fichas
--   - 4 Materias
--   - Horarios
--   - Sesiones de asistencia de ejemplo
-- ============================================================

-- NOTA: Este script es para PostgreSQL (Supabase)
-- Las contraseñas están con hash bcrypt de "Password123"
-- Hash bcrypt de "Password123": $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- ============================================================
-- USUARIOS DE PRUEBA
-- ============================================================

-- Administrador
INSERT INTO "User" (id, "userType", "fullName", document, email, password, "createdAt")
VALUES 
  ('admin-001', 'admin', 'Administrador SENA', '10000001', 'admin@arachiz.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW());

-- Instructores
INSERT INTO "User" (id, "userType", "fullName", document, email, password, "createdAt")
VALUES 
  ('inst-001', 'instructor', 'Carlos García López', '20000001', 'carlos.garcia@sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW()),
  ('inst-002', 'instructor', 'María Rodríguez Torres', '20000002', 'maria.rodriguez@sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW()),
  ('inst-003', 'instructor', 'Andrés Martínez Silva', '20000003', 'andres.martinez@sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW());

-- Aprendices de la Ficha 3146013
INSERT INTO "User" (id, "userType", "fullName", document, email, password, "nfcUid", "createdAt")
VALUES 
  ('apr-001', 'aprendiz', 'Juan Pablo Pérez Gómez', '30000001', 'juan.perez@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'A1B2C3D4', NOW()),
  ('apr-002', 'aprendiz', 'Ana Sofía López Vargas', '30000002', 'ana.lopez@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'E5F6G7H8', NOW()),
  ('apr-003', 'aprendiz', 'Luis Fernando Martínez', '30000003', 'luis.martinez@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, NOW()),
  ('apr-004', 'aprendiz', 'Valentina Ruiz Castro', '30000004', 'valentina.ruiz@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'I9J0K1L2', NOW()),
  ('apr-005', 'aprendiz', 'Santiago Gómez Herrera', '30000005', 'santiago.gomez@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, NOW()),
  ('apr-006', 'aprendiz', 'Daniela Torres Mejía', '30000006', 'daniela.torres@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'M3N4O5P6', NOW()),
  ('apr-007', 'aprendiz', 'Sebastián Vargas Ríos', '30000007', 'sebastian.vargas@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, NOW()),
  ('apr-008', 'aprendiz', 'Isabella Morales Cruz', '30000008', 'isabella.morales@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, NOW()),
  ('apr-009', 'aprendiz', 'Mateo Jiménez Salazar', '30000009', 'mateo.jimenez@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Q7R8S9T0', NOW()),
  ('apr-010', 'aprendiz', 'Camila Díaz Suárez', '30000010', 'camila.diaz@aprendiz.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, NOW());

-- ============================================================
-- FICHAS
-- ============================================================

INSERT INTO "Ficha" (id, numero, nombre, nivel, centro, jornada, region, duracion, code, "instructorAdminId", "administradorId", "createdAt")
VALUES
  ('ficha-001', '3146013', 'Análisis y Desarrollo de Software', 'Tecnólogo', 'Centro de Teleinformática y Producción Industrial', 'Diurna', 'Valle del Cauca', 24, 'ARC-3146', 'inst-001', 'admin-001', NOW()),
  ('ficha-002', '2589401', 'Diseño Gráfico', 'Técnico', 'Centro de Teleinformática y Producción Industrial', 'Nocturna', 'Valle del Cauca', 12, 'ARC-2589', 'inst-002', 'admin-001', NOW());

-- ============================================================
-- RELACIÓN INSTRUCTOR-FICHA
-- ============================================================

INSERT INTO "FichaInstructor" (id, role, "fichaId", "instructorId")
VALUES
  ('fi-001', 'admin', 'ficha-001', 'inst-001'),
  ('fi-002', 'invitado', 'ficha-001', 'inst-003'),
  ('fi-003', 'admin', 'ficha-002', 'inst-002');

-- ============================================================
-- RELACIÓN APRENDIZ-FICHA (tabla many-to-many)
-- ============================================================

-- Todos los aprendices en ficha-001
INSERT INTO "_Aprendices" ("A", "B")
VALUES
  ('ficha-001', 'apr-001'),
  ('ficha-001', 'apr-002'),
  ('ficha-001', 'apr-003'),
  ('ficha-001', 'apr-004'),
  ('ficha-001', 'apr-005'),
  ('ficha-001', 'apr-006'),
  ('ficha-001', 'apr-007'),
  ('ficha-001', 'apr-008'),
  ('ficha-001', 'apr-009'),
  ('ficha-001', 'apr-010');

-- ============================================================
-- MATERIAS
-- ============================================================

INSERT INTO "Materia" (id, nombre, tipo, "fichaId", "instructorId")
VALUES
  ('mat-001', 'Programación Orientada a Objetos', 'Técnica', 'ficha-001', 'inst-001'),
  ('mat-002', 'Bases de Datos', 'Técnica', 'ficha-001', 'inst-003'),
  ('mat-003', 'Inglés Técnico', 'Transversal', 'ficha-001', 'inst-002'),
  ('mat-004', 'Ética y Valores', 'Transversal', 'ficha-001', NULL);

-- ============================================================
-- HORARIOS
-- ============================================================

INSERT INTO "Horario" (id, dia, "horaInicio", "horaFin", "fichaId", "materiaId")
VALUES
  ('hor-001', 'Lunes', '07:00', '10:00', 'ficha-001', 'mat-001'),
  ('hor-002', 'Martes', '07:00', '10:00', 'ficha-001', 'mat-002'),
  ('hor-003', 'Miercoles', '07:00', '09:00', 'ficha-001', 'mat-003'),
  ('hor-004', 'Jueves', '07:00', '10:00', 'ficha-001', 'mat-001'),
  ('hor-005', 'Viernes', '07:00', '09:00', 'ficha-001', 'mat-004'),
  ('hor-006', 'Lunes', '10:00', '12:00', 'ficha-001', 'mat-002');

-- ============================================================
-- SESIONES DE ASISTENCIA (ejemplos)
-- ============================================================

INSERT INTO "Asistencia" (id, fecha, activa, timestamp, "materiaId", "instructorId", "llegadaTarde", duracion, aula)
VALUES
  ('asis-001', '2026-05-20', false, '2026-05-20 07:00:00', 'mat-001', 'inst-001', 15, 180, 'Aula 301'),
  ('asis-002', '2026-05-22', false, '2026-05-22 07:00:00', 'mat-002', 'inst-003', 15, 180, 'Laboratorio 2'),
  ('asis-003', '2026-05-27', false, '2026-05-27 07:00:00', 'mat-001', 'inst-001', 15, 180, 'Aula 301');

-- ============================================================
-- REGISTROS DE ASISTENCIA (ejemplos)
-- ============================================================

-- Sesión 1: 2026-05-20 - Programación OO
INSERT INTO "RegistroAsistencia" (id, presente, metodo, timestamp, justificado, tarde, "asistenciaId", "aprendizId")
VALUES
  ('reg-001', true, 'qr', '2026-05-20 07:05:00', false, false, 'asis-001', 'apr-001'),
  ('reg-002', true, 'nfc', '2026-05-20 07:02:00', false, false, 'asis-001', 'apr-002'),
  ('reg-003', true, 'huella', '2026-05-20 07:18:00', false, true, 'asis-001', 'apr-003'),
  ('reg-004', true, 'facial', '2026-05-20 07:07:00', false, false, 'asis-001', 'apr-004'),
  ('reg-005', false, 'manual', '2026-05-20 10:00:00', false, false, 'asis-001', 'apr-005'),
  ('reg-006', true, 'qr', '2026-05-20 07:04:00', false, false, 'asis-001', 'apr-006'),
  ('reg-007', false, 'manual', '2026-05-20 10:00:00', false, false, 'asis-001', 'apr-007'),
  ('reg-008', true, 'qr', '2026-05-20 07:10:00', false, false, 'asis-001', 'apr-008'),
  ('reg-009', true, 'nfc', '2026-05-20 07:01:00', false, false, 'asis-001', 'apr-009'),
  ('reg-010', true, 'qr', '2026-05-20 07:14:00', false, false, 'asis-001', 'apr-010');

-- ============================================================
-- EXCUSA DE PRUEBA
-- ============================================================

INSERT INTO "Excusa" (id, fechas, motivo, estado, "aprendizId", "materiaId", "registroAsistenciaId", "createdAt")
VALUES
  ('exc-001', '2026-05-20', 'Cita médica urgente en el Hospital Universitario', 'Pendiente', 'apr-005', 'mat-001', 'reg-005', NOW()),
  ('exc-002', '2026-05-22', 'Calamidad doméstica - inundación en mi vivienda', 'Aprobada', 'apr-007', 'mat-001', 'reg-007', NOW());

-- ============================================================
-- PUNTUACIONES DE JUEGOS (ejemplos)
-- ============================================================

INSERT INTO "SnakeScore" (id, score, "userId", "updatedAt")
VALUES
  ('ss-001', 1240, 'apr-001', NOW()),
  ('ss-002', 980, 'apr-002', NOW()),
  ('ss-003', 2100, 'apr-003', NOW());

INSERT INTO "FlappyScore" (id, score, "userId", "updatedAt")
VALUES
  ('fs-001', 45, 'apr-001', NOW()),
  ('fs-002', 72, 'apr-004', NOW());

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Contar registros insertados:
SELECT 'Usuarios' as tabla, COUNT(*) as total FROM "User"
UNION ALL
SELECT 'Fichas', COUNT(*) FROM "Ficha"
UNION ALL
SELECT 'Materias', COUNT(*) FROM "Materia"
UNION ALL
SELECT 'Horarios', COUNT(*) FROM "Horario"
UNION ALL
SELECT 'Sesiones Asistencia', COUNT(*) FROM "Asistencia"
UNION ALL
SELECT 'Registros Asistencia', COUNT(*) FROM "RegistroAsistencia"
UNION ALL
SELECT 'Excusas', COUNT(*) FROM "Excusa";

-- ============================================================
-- CREDENCIALES DE ACCESO (para pruebas)
-- ============================================================
/*
ADMINISTRADOR:
  Email: admin@arachiz.com
  Contraseña: Password123

INSTRUCTORES:
  carlos.garcia@sena.edu.co / Password123
  maria.rodriguez@sena.edu.co / Password123
  andres.martinez@sena.edu.co / Password123

APRENDICES:
  juan.perez@aprendiz.sena.edu.co / Password123  (tiene NFC: A1B2C3D4)
  ana.lopez@aprendiz.sena.edu.co / Password123   (tiene NFC: E5F6G7H8)
  ... (los demás también con Password123)

CÓDIGO DE FICHA 3146013: ARC-3146
CÓDIGO DE FICHA 2589401: ARC-2589
*/
