-- OPCIÓN 1: Si prefieres ELIMINAR el registro mal creado y empezar de cero
-- Ejecuta solo UNA de las dos opciones (Opción 1 O Opción 2)

-- ========================================
-- OPCIÓN 1: ELIMINAR Y CREAR DE NUEVO
-- ========================================

-- 1.1. Eliminar el Super Usuario mal creado
DELETE FROM "User" WHERE id = 'superuser_001';

-- 1.2. Crear el Super Usuario correctamente
INSERT INTO "User" (
  id,
  "userType",
  "fullName",
  document,
  email,
  password,
  "createdAt"
) VALUES (
  'superuser_001',
  'super_usuario',
  'Super Administrador',
  '9999999999',
  'superadmin@arachiz.com',
  '$2b$10$Hxo2FFRQc9ijl4/7FkmoXOZVxE39E9/IlgOLxE8HnQb9KyQiAaktK',
  NOW()
);


-- ========================================
-- OPCIÓN 2: ACTUALIZAR EL REGISTRO EXISTENTE
-- ========================================
-- Si ya ejecutaste el INSERT y solo quieres actualizar los datos:
-- Descomenta estas líneas:

-- UPDATE "User"
-- SET 
--   "fullName" = 'Super Administrador',
--   document = '9999999999',
--   email = 'superadmin@arachiz.com',
--   password = '$2b$10$Hxo2FFRQc9ijl4/7FkmoXOZVxE39E9/IlgOLxE8HnQb9KyQiAaktK'
-- WHERE id = 'superuser_001';


-- ========================================
-- VERIFICAR QUE QUEDÓ BIEN
-- ========================================
SELECT id, "userType", "fullName", email, document, "createdAt" 
FROM "User" 
WHERE id = 'superuser_001';
