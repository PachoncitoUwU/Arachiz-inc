# WIREFRAMES Y PROTOTIPOS — ARACHIZ
## Ficha 3146013 | Diseño de Interfaces

> **Nota:** Los wireframes están representados en formato ASCII/texto para ser compatibles con cualquier visualizador. Para wireframes visuales interactivos, visita: https://arachiz.vercel.app

---

## 1. PANTALLA: LOGIN

```
╔══════════════════════════════════════════╗
║                                          ║
║         🥜  ARACHIZ                      ║
║    Sistema de Asistencia SENA            ║
║                                          ║
║  ┌────────────────────────────────────┐  ║
║  │  📧 Correo electrónico             │  ║
║  └────────────────────────────────────┘  ║
║  ┌────────────────────────────────────┐  ║
║  │  🔒 Contraseña                     │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  ┌────────────────────────────────────┐  ║
║  │        INICIAR SESIÓN              │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  ────────────  o con  ──────────────     ║
║                                          ║
║  ┌────────────────────────────────────┐  ║
║  │   G   Continuar con Google         │  ║
║  └────────────────────────────────────┘  ║
║                                          ║
║  ¿No tienes cuenta? Registrarse          ║
║  ¿Olvidaste tu contraseña?               ║
╚══════════════════════════════════════════╝
```

---

## 2. PANTALLA: DASHBOARD INSTRUCTOR

```
╔══════════════════════════════════════════════════════════╗
║ 🥜 Arachiz   [Fichas] [Horarios] [Reportes]  👤 Nombre ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Bienvenido, Instructor García 👋                        ║
║                                                          ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  ║
║  │ 📋 Fichas   │  │ 👥 Aprendices│  │ 📅 Sesiones hoy │  ║
║  │     3       │  │     87      │  │       2         │  ║
║  └─────────────┘  └─────────────┘  └─────────────────┘  ║
║                                                          ║
║  MIS FICHAS                        [+ Nueva Ficha]       ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ Ficha 3146013 — Análisis y Desarrollo de Software  │  ║
║  │ 30 aprendices · 5 materias · Jornada diurna        │  ║
║  │          [Ver ficha]    [Iniciar sesión ▶]          │  ║
║  ├────────────────────────────────────────────────────┤  ║
║  │ Ficha 2589401 — Diseño Gráfico                     │  ║
║  │ 28 aprendices · 4 materias · Jornada nocturna      │  ║
║  │          [Ver ficha]    [Iniciar sesión ▶]          │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                          ║
║  EXCUSAS PENDIENTES (3)                                  ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ ⏳ Juan Pérez — Cita médica — 2 fechas    [Ver]    │  ║
║  │ ⏳ María López — Calamidad dom. — 1 fecha  [Ver]   │  ║
║  └────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════╝
```

---

## 3. PANTALLA: SESIÓN DE ASISTENCIA (TIEMPO REAL)

```
╔══════════════════════════════════════════════════════════╗
║  ← Volver   SESIÓN ACTIVA: Programación I   [🔴 Cerrar] ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌──────────────────┐  ┌──────────────────────────────┐  ║
║  │                  │  │  LISTA DE ASISTENCIA         │  ║
║  │   ██████████     │  │  ────────────────────────    │  ║
║  │   ██ QR ████     │  │  ✅ Carlos Gómez     [NFC]   │  ║
║  │   ██████████     │  │  ✅ Ana Rodríguez    [QR]    │  ║
║  │                  │  │  ✅ Luis Martínez    [huella] │  ║
║  │  Código QR       │  │  ⏳ María López...           │  ║
║  │  para asistencia │  │  ❌ Pedro Sánchez   ausente  │  ║
║  │                  │  │                              │  ║
║  │  [Regenerar QR]  │  │  Presentes: 3/5  ████░░  60% │  ║
║  └──────────────────┘  └──────────────────────────────┘  ║
║                                                          ║
║  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ║
║  │ ⏱️ 45 min    │  │ 🏃 Tarde: 15m │  │ 🏫 Aula 301  │  ║
║  └──────────────┘  └──────────────┘  └───────────────┘  ║
╚══════════════════════════════════════════════════════════╝
```

---

## 4. PANTALLA: DASHBOARD APRENDIZ

```
╔══════════════════════════════════════════════════════════╗
║ 🥜 Arachiz   [Inicio] [Excusas] [Juegos] [Tienda] 👤    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Hola, Carlos! 👋  Ficha 3146013                         ║
║                                                          ║
║  MI ASISTENCIA ESTE MES                                  ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │  ✅ Presentes: 18   ❌ Ausentes: 2   ⏰ Tardes: 1  │  ║
║  │  ████████████████░░░░  90% asistencia              │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                          ║
║  HOY                                                     ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ 🟢 Programación I    7:00 - 9:00   [Marcar asisit] │  ║
║  │ ⚪ Bases de Datos     9:00 - 11:00  [Próximamente]  │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                          ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ 🎮 MINIJUEGOS   Tu mejor: Snake 1,240 pts          │  ║
║  │ [Snake] [Flappy] [Memory] [Breakout] [Wordle]      │  ║
║  └────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════╝
```

---

## 5. PANTALLA: ESCÁNER QR (MÓVIL)

```
╔═══════════════════════════╗
║  ← Volver  Marcar Asist.  ║
╠═══════════════════════════╣
║                           ║
║  Apunta la cámara al QR   ║
║  del instructor           ║
║                           ║
║  ┌─────────────────────┐  ║
║  │                     │  ║
║  │   [  VISOR DE   ]   │  ║
║  │   [   CÁMARA    ]   │  ║
║  │   [             ]   │  ║
║  │                     │  ║
║  └─────────────────────┘  ║
║                           ║
║  ─────── o ingresa ─────── ║
║  código manualmente:      ║
║  ┌─────────────────────┐  ║
║  │ Código QR...        │  ║
║  └─────────────────────┘  ║
║  [    CONFIRMAR      ]    ║
╚═══════════════════════════╝
```

---

## 6. PANTALLA: REPORTES Y EXPORTACIÓN

```
╔══════════════════════════════════════════════════════════╗
║  ← Volver   REPORTES — Programación I — Ficha 3146013   ║
╠══════════════════════════════════════════════════════════╣
║  Filtrar: [Todas las fechas ▼]  [Todos los aprendices ▼] ║
║                                                          ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ APRENDIZ          │ PRES │ AUS │ TARDE │ %ASIST    │  ║
║  │───────────────────│──────│─────│───────│───────────│  ║
║  │ Carlos Gómez      │  18  │  2  │   1   │  90%  ✅  │  ║
║  │ Ana Rodríguez     │  20  │  0  │   0   │  100% ✅  │  ║
║  │ Luis Martínez     │  15  │  5  │   2   │  75%  ⚠️  │  ║
║  │ María López       │  12  │  8  │   0   │  60%  ❌  │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                          ║
║  ┌────────────────┐  ┌───────────────┐  ┌────────────┐  ║
║  │ 📥 Excel       │  │ 📥 CSV        │  │ 🖨️ Imprimir│  ║
║  │ Descargar      │  │ Descargar     │  │ / PDF      │  ║
║  └────────────────┘  └───────────────┘  └────────────┘  ║
║                                                          ║
║  PLANTILLA: [📋 Descargar plantilla Excel vacía]         ║
╚══════════════════════════════════════════════════════════╝
```

---

## 7. PANTALLA: PANEL ADMINISTRADOR

```
╔══════════════════════════════════════════════════════════╗
║ 🥜 Arachiz ADMIN  [Usuarios] [Fichas] [Papelera] [Logs]  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  RESUMEN GLOBAL                                          ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  ║
║  │Usuarios  │  │ Fichas   │  │Aprendices│  │Sesiones │  ║
║  │   127    │  │   12     │  │   320    │  │   48    │  ║
║  └──────────┘  └──────────┘  └──────────┘  └─────────┘  ║
║                                                          ║
║  GESTIÓN DE USUARIOS                    [+ Nuevo usuario] ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ Buscar usuario...                          [Buscar] │  ║
║  │ ──────────────────────────────────────────────────  │  ║
║  │ 👤 García, Juan   instructor   [Editar] [Eliminar]  │  ║
║  │ 👤 López, María   aprendiz     [Editar] [Eliminar]  │  ║
║  │ 👤 Pérez, Carlos  instructor   [Editar] [Eliminar]  │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                          ║
║  PAPELERA (3 elementos)   [Ver papelera]                 ║
╚══════════════════════════════════════════════════════════╝
```

---

## 8. NAVEGACIÓN Y MAPA DEL SITIO

```
                    [ LOGIN / REGISTRO ]
                            │
                    ┌───────┴────────┐
                    ▼                ▼
            [ INSTRUCTOR ]      [ APRENDIZ ]
                 │                   │
        ┌────────┤           ┌───────┤
        ▼        ▼           ▼       ▼
    [Fichas] [Horarios]  [Inicio] [Excusas]
        │                   │
        ▼               [Historial]
    [Sesión]                │
    [activa]            [Juegos]
        │                   │
    [Reportes]          [Tienda]
    
    [ ADMINISTRADOR ]
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
[Usuarios] [Fichas] [Papelera/Logs]
```

---

*Wireframes del sistema Arachiz — Ficha 3146013 — SENA*
