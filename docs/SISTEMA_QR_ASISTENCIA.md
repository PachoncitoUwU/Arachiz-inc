# Sistema de Registro por Código QR

## Descripción

Sistema de registro de asistencia mediante códigos QR dinámicos y seguros que solo funcionan dentro de la aplicación Arachiz.

## Características

### Seguridad
- ✅ Códigos únicos y temporales (30 segundos de validez)
- ✅ Regeneración automática cada 30 segundos
- ✅ Un solo uso por código
- ✅ Validación exclusiva dentro de Arachiz
- ✅ Verificación de pertenencia a la ficha

### Flujo de Uso

#### Instructor
1. Inicia una sesión de asistencia
2. Hace clic en el botón "Código QR"
3. Se genera un código QR único
4. Los aprendices escanean el código
5. El código se regenera automáticamente cada 30 segundos

#### Aprendiz
1. Abre Arachiz en su celular
2. Va a "Asistencia"
3. Toca el botón "Escanear QR"
4. Apunta la cámara al código QR del instructor
5. Su asistencia se registra automáticamente

## Implementación Técnica

### Backend

**Endpoints:**
- `POST /api/qr/generate` - Genera código QR (solo instructores)
- `POST /api/qr/validate` - Valida y registra asistencia (solo aprendices)
- `GET /api/qr/status/:code` - Obtiene estado del código

**Controlador:** `backend/controllers/qrController.js`
**Rutas:** `backend/routes/qrRoutes.js`

**Almacenamiento:**
- Códigos activos en memoria (Map)
- En producción: usar Redis para escalabilidad

### Frontend

**Componentes:**
- `QRAttendance.jsx` - Modal para instructor (genera y muestra QR)
- `QRScanner.jsx` - Scanner para aprendiz (escanea QR)
- `ScanQR.jsx` - Página de redirección para QR externos

**Librerías:**
- `jsqr` - Detección de códigos QR
- API externa para generación de imagen QR

## Seguridad

### Validaciones
1. **Temporalidad:** Códigos expiran en 30 segundos
2. **Uso único:** Cada código solo puede usarse una vez
3. **Autenticación:** Solo usuarios autenticados pueden usar el sistema
4. **Autorización:** Solo instructores generan, solo aprendices escanean
5. **Pertenencia:** Verifica que el aprendiz pertenezca a la ficha
6. **Duplicados:** Previene registros duplicados en la misma sesión

### Protección contra Escaneo Externo
- Los códigos QR contienen URLs de Arachiz
- Si se escanean con apps externas, redirigen a la app
- La validación solo funciona dentro de Arachiz
- Requiere autenticación y sesión activa

## Instalación

### Dependencias
```bash
# Frontend
cd frontend
npm install jsqr

# Backend (sin dependencias adicionales)
```

### Configuración
No requiere configuración adicional. El sistema funciona out-of-the-box.

## Uso

### Para Instructores
1. Ir a "Asistencia"
2. Iniciar sesión
3. Clic en "Código QR"
4. Mostrar el código a los aprendices

### Para Aprendices
1. Ir a "Asistencia"
2. Clic en "Escanear QR"
3. Permitir acceso a la cámara
4. Apuntar al código QR

## Ventajas

- ✅ Rápido y eficiente
- ✅ No requiere hardware adicional
- ✅ Funciona en cualquier dispositivo con cámara
- ✅ Seguro y difícil de falsificar
- ✅ Registro en tiempo real
- ✅ Experiencia de usuario fluida

## Limitaciones

- Requiere conexión a internet
- Necesita acceso a la cámara del dispositivo
- Los códigos expiran rápidamente (por seguridad)

## Versión

Implementado en Arachiz v1.3.1
Rama: QryManual
