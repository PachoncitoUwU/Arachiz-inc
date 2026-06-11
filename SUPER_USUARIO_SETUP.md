# 🔧 Configuración del Super Usuario

## ⚠️ Problema Actual
Ejecutaste el SQL sin cambiar los datos y sin encriptar la contraseña.

---

## ✅ Solución

### **Paso 1: Ir a Supabase**
1. Ve a https://supabase.com
2. Entra a tu proyecto de Arachiz
3. Ve a **SQL Editor** (en el menú lateral)

### **Paso 2: Ejecutar el SQL de corrección**

Tienes dos opciones (elige la que prefieras):

#### **OPCIÓN A: Eliminar y crear de nuevo (RECOMENDADO)**
```sql
-- 1. Eliminar el registro mal creado
DELETE FROM "User" WHERE id = 'superuser_001';

-- 2. Crear correctamente el Super Usuario
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

-- 3. Verificar que quedó bien
SELECT id, "userType", "fullName", email, document, "createdAt" 
FROM "User" 
WHERE id = 'superuser_001';
```

#### **OPCIÓN B: Solo actualizar el registro existente**
```sql
-- Actualizar los datos del Super Usuario
UPDATE "User"
SET 
  "fullName" = 'Super Administrador',
  document = '9999999999',
  email = 'superadmin@arachiz.com',
  password = '$2b$10$Hxo2FFRQc9ijl4/7FkmoXOZVxE39E9/IlgOLxE8HnQb9KyQiAaktK'
WHERE id = 'superuser_001';

-- Verificar que quedó bien
SELECT id, "userType", "fullName", email, document, "createdAt" 
FROM "User" 
WHERE id = 'superuser_001';
```

---

## 🔑 Credenciales del Super Usuario

Después de ejecutar el SQL, podrás hacer login con:

- **Email:** `superadmin@arachiz.com`
- **Contraseña:** `Admin123!`

⚠️ **IMPORTANTE:** Cambia esta contraseña inmediatamente después del primer login.

---

## 📋 ¿Qué contraseña se encriptó?

La contraseña encriptada es: `Admin123!`

El hash generado es:
```
$2b$10$Hxo2FFRQc9ijl4/7FkmoXOZVxE39E9/IlgOLxE8HnQb9KyQiAaktK
```

---

## 🔄 Si quieres usar una contraseña diferente

1. Ve a la carpeta `backend` de tu proyecto
2. Ejecuta este comando (cambia `TU_CONTRASEÑA` por la que quieras):

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('TU_CONTRASEÑA', 10));"
```

3. Copia el hash que te da
4. Reemplázalo en el SQL arriba donde dice `$2b$10$...`

---

## ✅ Verificación Final

Después de ejecutar el SQL en Supabase, deberías ver algo así:

| id | userType | fullName | email | document | createdAt |
|---|---|---|---|---|---|
| superuser_001 | super_usuario | Super Administrador | superadmin@arachiz.com | 9999999999 | 2026-06-03... |

---

## 🚀 Próximos Pasos

Una vez corregido el Super Usuario, necesitas:

1. **Crear la tabla de logs de auditoría** (ejecutar en Supabase):

```sql
CREATE TABLE "SuperUserAuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "superUserId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  "entidadId" TEXT,
  descripcion TEXT NOT NULL,
  "datosAnteriores" JSONB,
  "datosNuevos" JSONB,
  "ipAddress" TEXT,
  "fechaHora" TIMESTAMP NOT NULL DEFAULT NOW(),
  navegador TEXT
);

CREATE INDEX idx_superuser_logs_fecha ON "SuperUserAuditLog"("fechaHora" DESC);
CREATE INDEX idx_superuser_logs_usuario ON "SuperUserAuditLog"("superUserId");
CREATE INDEX idx_superuser_logs_entidad ON "SuperUserAuditLog"(entidad);
```

2. **Implementar el backend y frontend del Super Usuario** (usaremos Antigravity para esto)

---

## 📝 Notas

- El documento `9999999999` es un placeholder, cámbialo si quieres
- El email `superadmin@arachiz.com` puedes cambiarlo por el tuyo
- El `userType` debe ser exactamente `'super_usuario'` (con guion bajo)
- La contraseña está encriptada con bcrypt (10 rondas de salt)

---

**Última actualización:** 2026-06-03
