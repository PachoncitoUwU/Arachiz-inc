# MANUAL DE USUARIO — ARACHIZ
## Sistema de Gestión de Asistencia | Ficha 3146013

**URL del sistema:** https://arachiz.vercel.app  
**Versión:** 1.3.1  
**Fecha:** Mayo 2026

---

## ¿QUÉ ES ARACHIZ?

Arachiz es un sistema web para registrar y gestionar la asistencia de los aprendices del SENA. Puedes marcar tu asistencia usando un código QR, una tarjeta NFC, tu huella dactilar o tu cara. También tiene minijuegos para que descanses entre clases.

---

## ACCESO AL SISTEMA

### Cómo entrar
1. Abre tu navegador (Chrome recomendado)
2. Ve a: **https://arachiz.vercel.app**
3. Escribe tu correo y contraseña
4. Haz clic en **"Iniciar sesión"**

### ¿No tienes cuenta?
1. Haz clic en **"Registrarse"**
2. Completa: nombre completo, número de documento, correo, contraseña
3. Haz clic en **"Crear cuenta"**
4. Después de registrarte, pide a tu instructor el **código de ficha** para unirte a tu grupo

### ¿Olvidaste tu contraseña?
1. En la página de login, haz clic en **"¿Olvidaste tu contraseña?"**
2. Escribe tu correo registrado
3. Revisa tu correo y sigue las instrucciones

---

## GUÍA PARA APRENDICES 🎓

### 1. Unirse a una Ficha
Cuando entres por primera vez, necesitas unirte a tu ficha (grupo):
1. Ve al menú principal
2. Haz clic en **"Unirse a ficha"**
3. Escribe el código que te dio tu instructor (ejemplo: `ARC-3146`)
4. ¡Listo! Ya formas parte de la ficha

### 2. Marcar Asistencia con QR
Cuando el instructor inicie una sesión de asistencia:
1. Ve a **"Marcar Asistencia"** en el menú
2. Tu instructor proyectará un código QR
3. Haz clic en **"Escanear QR"** en la app
4. Apunta la cámara de tu celular al QR
5. Espera la confirmación ✅

> ⚠️ **Importante:** El QR solo funciona mientras la sesión esté activa. Si tu instructor cierra la sesión, ya no podrás marcar.

### 3. Marcar Asistencia con NFC
Si tienes una tarjeta NFC registrada:
1. Acerca tu tarjeta al lector que está en el salón
2. Escucharás un pitido y verás la confirmación en el panel del instructor
3. ¡Así de fácil!

### 4. Marcar Asistencia con Huella Dactilar
Si tu huella está registrada en el sistema:
1. Pon el dedo en el sensor de huella que hay en el aula
2. El sistema te reconocerá automáticamente
3. Tu nombre aparecerá como "Presente" en el panel del instructor

### 5. Ver mi Historial de Asistencia
1. Ve a **"Mi Historial"** en el menú
2. Verás una tabla con todas tus asistencias por materia
3. Cada fila muestra: fecha, estado (Presente/Ausente/Tarde), y si está justificado

### 6. Enviar una Excusa
Si faltaste y tienes una razón válida:
1. Ve a **"Mis Excusas"**
2. Haz clic en **"Nueva excusa"**
3. Selecciona la materia y las fechas
4. Escribe el motivo
5. Adjunta documentos si tienes (foto de incapacidad, etc.)
6. Haz clic en **"Enviar"**
7. El instructor revisará tu excusa y recibirás una respuesta

### 7. Minijuegos 🎮
¡Arachiz tiene juegos para los descansos!
1. Ve a **"Juegos"** en el menú
2. Elige tu juego favorito: Snake, Flappy Bird, Memory, Breakout, Wordle...
3. Tu puntuación se guarda automáticamente
4. Mira el **ranking** para ver cómo te comparas con tus compañeros

### 8. Tienda de Skins 🛒
Personaliza tu serpiente del Snake:
1. Ve a **"Tienda"**
2. Mira las skins disponibles con su rareza y precio
3. Compra la que quieras con tarjeta o PSE
4. Ve a **"Mi perfil"** → **"Skins"** para equiparla

---

## GUÍA PARA INSTRUCTORES 👨‍🏫

### 1. Crear una Ficha Nueva
1. Ve a **"Mis Fichas"**
2. Haz clic en **"+ Nueva Ficha"**
3. Completa: número de ficha, nombre del programa, nivel, centro, jornada
4. El sistema generará automáticamente un código de invitación
5. Comparte ese código con tus aprendices

### 2. Agregar Materias
Dentro de tu ficha:
1. Ve a la pestaña **"Materias"**
2. Haz clic en **"+ Nueva Materia"**
3. Escribe el nombre y tipo de materia
4. Guarda

### 3. Configurar el Horario
1. Ve a la pestaña **"Horario"**
2. Para cada materia, arrastra o haz clic en el día y hora
3. Configura hora de inicio y hora de fin
4. Guarda los cambios

### 4. Iniciar una Sesión de Asistencia
Cuando llegue la hora de clase:
1. Ve a tu ficha → selecciona la materia
2. Haz clic en **"▶ Iniciar sesión de asistencia"**
3. Se generará un QR automáticamente — proyéctalo en el tablero
4. Verás en tiempo real quién va llegando y marcando
5. Cuando termines la clase, haz clic en **"⏹ Cerrar sesión"**
6. El sistema marcará como ausentes a quienes no marcaron

### 5. Gestionar Excusas
1. Ve a **"Excusas pendientes"**
2. Haz clic en una excusa para verla
3. Lee el motivo y revisa los archivos adjuntos
4. Haz clic en **"Aprobar"** o **"Rechazar"**
5. Escribe una respuesta (opcional)
6. El aprendiz recibirá una notificación

### 6. Ver y Exportar Reportes
1. Ve a la pestaña **"Reportes"**
2. Selecciona la materia y el rango de fechas
3. Verás una tabla con las estadísticas de cada aprendiz
4. Para exportar, haz clic en:
   - **📥 Excel** — descarga archivo .xlsx
   - **📥 CSV** — descarga archivo .csv
   - **🖨️ Imprimir / PDF** — abre ventana de impresión

### 7. Registrar NFC de un Aprendiz
1. Con el hardware conectado, ve a **"Aprendices"** en tu ficha
2. Haz clic en el nombre del aprendiz → **"Configurar NFC"**
3. Pide al aprendiz que acerque su tarjeta al lector
4. El UID se guardará automáticamente

---

## GUÍA PARA ADMINISTRADORES 🔧

### 1. Gestionar Usuarios
1. Ve a **"Administración"** → **"Usuarios"**
2. Busca un usuario por nombre o documento
3. Puedes: editar su perfil, cambiar su rol, o eliminar su cuenta

### 2. Ver Todas las Fichas
Desde el panel de administrador puedes ver todas las fichas del sistema, incluyendo sus instructores, aprendices y estadísticas.

### 3. Asignar Instructores a Fichas
1. Ve a la ficha que deseas gestionar
2. Haz clic en **"Instructores"**
3. Busca al instructor y asígnalo como "Principal" o "Invitado"

### 4. Papelera
Si alguien eliminó algo por error:
1. Ve a **"Papelera"**
2. Busca el elemento eliminado
3. Haz clic en **"Restaurar"**

---

## PREGUNTAS FRECUENTES

**¿Qué pasa si el QR no funciona?**
Verifica que la sesión de asistencia esté activa. Pide a tu instructor que regenere el QR.

**¿Puedo marcar asistencia desde mi celular?**
Sí. La aplicación funciona en celulares. Solo entra a arachiz.vercel.app desde tu navegador.

**¿Mis datos están seguros?**
Sí. Las contraseñas están encriptadas y la comunicación es segura (HTTPS).

**¿Puedo instalar la app?**
Sí. En Chrome, busca el ícono de instalación en la barra de direcciones o ve a **Menú → "Instalar app"**.

**¿Se puede usar sin internet?**
No. El sistema requiere conexión a internet para funcionar.

---

## SOPORTE

Si tienes problemas:
- Reporta a tu instructor
- Escribe a: soporte@arachiz.com
- GitHub: https://github.com/tu-usuario/arachiz/issues

---

*Manual de usuario — Arachiz v1.3.1 — Ficha 3146013 — SENA*
