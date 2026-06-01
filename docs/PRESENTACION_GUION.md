# GUION DE PRESENTACIÓN — ARACHIZ
## Estilo Google I/O | 15 minutos | 5 personas

---

## 🎯 ESTRUCTURA GENERAL (15 min)

| Tiempo | Sección | Quién |
|--------|---------|-------|
| 0:00 – 1:00 | **EL PROBLEMA** + ¿Qué es Arachiz? | Persona 1 |
| 1:00 – 1:40 | **ABSTRACT** (en inglés) | Persona 2 |
| 1:40 – 7:00 | **DEMO EN VIVO** (software + hardware) | Persona 3 + 4 |
| 7:00 – 11:00 | **CÓMO LO HICIMOS** (soft + hard) | Persona 3 + 4 |
| 11:00 – 13:00 | **ROLES Y JERARQUÍA** | Persona 5 |
| 13:00 – 15:00 | **CIERRE** + preguntas | Todos |

---

## 🎙️ PERSONA 1 — EL PROBLEMA Y ¿QUÉ ES ARACHIZ? (1 min)

> Habla con energía. Presenta el problema como si fuera algo que a todos les pasa.

**[DIAPOSITIVA: Imagen de lista de asistencia en papel]**

*"¿Cuántas veces han visto a un instructor pasar lista uno por uno... y eso tarda 10 minutos? O peor, ¿cuántas veces se perdió la lista? ¿cuántas veces alguien marcó por otro?"*

*"Nosotros también lo vivimos, y por eso creamos **Arachiz**."*

**[DIAPOSITIVA: Logo Arachiz + URL]**

*"Arachiz es un **sistema inteligente de asistencia** para el SENA. Con él, un aprendiz puede marcar su asistencia en **menos de 3 segundos** usando su celular, su tarjeta, su huella o su cara. El instructor ve todo en tiempo real. Sin papeles, sin errores, sin pérdida de tiempo."*

*"Es web, es gratuito, está desplegado hoy mismo en: **arachiz.vercel.app**"*

---

## 🎙️ PERSONA 2 — ABSTRACT (40 segundos, en inglés)

> Habla claro, pausado. Está bien leer esto si es necesario.

**[DIAPOSITIVA: Abstract en inglés sobre fondo oscuro]**

*"Arachiz is an intelligent attendance management system designed for SENA's academic environment. It integrates biometric identification — QR codes, NFC cards, fingerprint sensors, and facial recognition — with a real-time web platform built on React and Node.js. The system features three user roles: administrator, instructor, and apprentice, each with tailored dashboards and permissions. Data is stored in a cloud PostgreSQL database through Supabase, and the application is publicly available at arachiz.vercel.app. Additionally, Arachiz includes a gamification module with seven mini-games and a skin shop to increase student engagement."*

---

## 🎙️ PERSONAS 3 Y 4 — DEMO EN VIVO (5 min 20 seg)

> Esta es la parte más importante. Hazla fluida como si fuera un comercial de Apple/Google. Prepárala con anticipación.

### PRE-DEMO: Preparar antes de presentar
- [ ] Abrir arachiz.vercel.app en el navegador
- [ ] Tener una cuenta instructor lista para mostrar
- [ ] Tener una cuenta aprendiz en el celular
- [ ] Tener el hardware (ESP8266 + sensores) conectado y encendido
- [ ] Poner celular en modo "No molestar"

---

### PARTE A: Demo de Software (3 min)

**[PERSONA 3 en la PC, PERSONA 4 narra]**

**PERSONA 4:** *"Veamos Arachiz en acción."*

**[Mostrar login]**
*"Primero, el instructor entra al sistema..."* → Login con cuenta instructor

**[Mostrar dashboard instructor]**
*"Aquí ve todas sus fichas. Accede a la ficha 3146013."*

**[Abrir ficha → iniciar sesión]**
*"Con un clic, inicia la sesión de asistencia para Programación I. El sistema genera un QR automáticamente."*

**[Proyectar QR en pantalla]**
*"Este QR lo proyectan en el tablero."*

**[PERSONA 3 saca el celular]**
*"Yo, como aprendiz, escaneo el QR desde mi celular."*
→ Escanea el QR en el celular → aparece como "Presente" en el panel del instructor

**[El jurado ve el nombre aparecer en tiempo real]**
*"¿Vieron eso? En tiempo real, sin recargar la página. Usando WebSockets."*

**[Mostrar exportación]**
*"Y al final del día, el instructor exporta el reporte completo a Excel o CSV con un solo clic."*

**[Mostrar vista de impresión]**
*"O puede generarlo para imprimir o PDF."*

---

### PARTE B: Demo de Hardware (2 min 20 seg)

**[PERSONA 4 en el hardware, PERSONA 3 narra]**

**PERSONA 3:** *"Pero Arachiz no es solo una app. También tiene hardware."*

**[Mostrar el dispositivo físico]**
*"Este es nuestro dispositivo IoT. Tiene: un ESP8266 con WiFi, un sensor de huella dactilar AS608, y un lector NFC."*

**[Demo NFC]**
*"Si el aprendiz tiene su tarjeta NFC registrada..."*
→ PERSONA 4 acerca la tarjeta al lector
*"... el sistema lo reconoce instantáneamente."*
→ Mostrar que aparece en el panel

**[Demo huella]**
*"Y con la huella dactilar..."*
→ Pone el dedo en el sensor
*"... mismo resultado. Sin necesitar el celular."*

**[Demo reconocimiento facial - si funciona]**
*"Y si tienen cámara, pueden usar reconocimiento facial con face-api.js. Todo funciona a la vez, el aprendiz puede usar el método que prefiera."*

**[Mostrar vista móvil]**
*"Y claro, todo funciona en celular. Diseño responsive, modo oscuro, funciona como una app."*

---

## 🎙️ PERSONAS 3 Y 4 — CÓMO LO HICIMOS (4 min)

**[DIAPOSITIVA: Arquitectura del sistema]**

**PERSONA 3:** *"¿Cómo construimos esto?"*

*"El frontend está hecho con React 19 y Vite. Optimizamos el bundle de 900 kilobytes a solo 209 kilobytes — una reducción del 77%. Eso significa que carga muy rápido."*

**[DIAPOSITIVA: Tech stack visual]**

*"El backend es Node.js con Express. Usamos Prisma como ORM para manejar la base de datos PostgreSQL en Supabase. La comunicación en tiempo real es con Socket.io."*

**PERSONA 4:** *"Para el hardware, programamos el ESP8266 en C++ con Arduino IDE. Se conecta al WiFi del salón y envía las lecturas al backend usando HTTP."*

**[DIAPOSITIVA: Diagrama flujo hardware]**

*"El sensor de huella AS608 puede almacenar hasta 162 huellas localmente. El lector NFC trabaja con tarjetas MIFARE estándar, que son económicas y seguras."*

**PERSONA 3:** *"Desplegamos el frontend en Vercel y el backend en Render, ambos gratis. La base de datos está en Supabase. El proyecto no tiene costo mensual de operación."*

---

## 🎙️ PERSONA 5 — ROLES Y JERARQUÍA (2 min)

**[DIAPOSITIVA: Pirámide de roles]**

*"Arachiz maneja tres niveles de usuarios."*

**[DIAPOSITIVA: Administrador]**

*"El **Administrador** tiene control total: gestiona todos los usuarios del sistema, puede ver todas las fichas, asignar instructores, y tiene acceso a la papelera y al historial de cambios. Es como el dueño del sistema."*

**[DIAPOSITIVA: Instructor]**

*"El **Instructor** gestiona sus propias fichas. Crea materias, configura horarios, inicia sesiones de asistencia y gestiona las excusas de sus aprendices. También puede exportar reportes."*

**[DIAPOSITIVA: Aprendiz]**

*"El **Aprendiz** es el usuario final. Se une a su ficha, marca asistencia, envía excusas y puede disfrutar de los minijuegos. No puede ver ni modificar información de otros aprendices."*

**[DIAPOSITIVA: Tabla de permisos]**

*"Cada rol tiene permisos específicos. Si un aprendiz intenta acceder a una ruta de instructor, el sistema lo bloquea con el middleware de autenticación."*

---

## 🎙️ TODOS — CIERRE (2 min)

**[DIAPOSITIVA: Logros del proyecto]**

**Persona 1:**
*"En resumen, Arachiz logró:"*
- ✅ *Un sistema web funcional y público*
- ✅ *4 métodos de identificación biométrica*
- ✅ *Asistencia en tiempo real*
- ✅ *Hardware IoT propio*
- ✅ *Gamificación con 7 juegos*
- ✅ *Sin costo de operación*

**[DIAPOSITIVA: URL + QR de la app]**

**Persona 1:** *"Pueden probarlo ahora mismo escaneando este QR o entrando a arachiz.vercel.app"*

**Persona 2:** *"¿Alguna pregunta?"*

---

## 💡 CONSEJOS PARA LA PRESENTACIÓN

### Estilo "Google I/O"
- Hablen de pie, sin leer del papel (o casi)
- Pasen de diapositiva con transiciones suaves
- Cuando demuestren algo en vivo, **comenten lo que hacen** antes de hacerlo
- Hagan pausas dramáticas cuando ocurra algo impresionante (como el nombre apareciendo en tiempo real)

### Diapositivas recomendadas (10-12 slides)
1. Portada: Logo Arachiz + "Ficha 3146013"
2. El problema: foto de lista en papel con X grande
3. La solución: "Arachiz" con URL
4. Abstract en inglés
5. Demo QR (solo captura o en vivo)
6. Demo hardware (foto del dispositivo)
7. Arquitectura técnica (diagrama simple)
8. Tech stack (logos de tecnologías)
9. Roles y jerarquía (pirámide)
10. Logros y métricas
11. QR para probar la app + URL

### Si algo falla en la demo en vivo
- Tengan capturas de pantalla/vídeo de respaldo
- El instructor puede mostrar el panel aunque no esté el hardware
- El reconocimiento facial puede fallar con mala iluminación — tengan el QR como backup

### Frases de impacto
- *"De 10 minutos a 3 segundos"*
- *"Sin papeles, sin errores, sin pérdida de tiempo"*
- *"Funciona hoy, en este momento, en producción"*
- *"Costo de operación: cero pesos"*

---

## 📝 PREGUNTAS FRECUENTES DEL JURADO

**P: ¿Qué pasa si no hay internet?**
R: *"El sistema requiere internet. Sin embargo, el ESP8266 puede almacenar localmente hasta 162 huellas para operar offline y sincronizar después."*

**P: ¿Qué tan seguro es?**
R: *"Las contraseñas se guardan con bcrypt. Los tokens JWT expiran en 8 horas. La comunicación es HTTPS. No guardamos contraseñas en texto plano."*

**P: ¿Podría escalar a otras sedes del SENA?**
R: *"Sí. La base de datos en Supabase puede manejar miles de usuarios. Solo se necesitaría un plan de pago para más almacenamiento."*

**P: ¿Cuánto costó el hardware?**
R: *"Aproximadamente 172,000 pesos colombianos para el prototipo completo."*

**P: ¿Por qué usaron SQLite y PostgreSQL?**
R: *"SQLite se usa solo en desarrollo local. En producción usamos PostgreSQL en Supabase."*

---

*Guion de presentación — Arachiz — Ficha 3146013 — SENA*
