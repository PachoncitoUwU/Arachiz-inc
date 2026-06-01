# PROYECTO FORMATIVO — FICHA 3146013
## Sistema de Gestión de Asistencia Inteligente — ARACHIZ

**Centro de Formación:** SENA  
**Ficha:** 3146013  
**Programa:** Análisis y Desarrollo de Software  
**Versión:** 1.3.1  
**Fecha:** Mayo 2026  
**URL Pública:** https://arachiz.vercel.app

---

## 1. PLANTEAMIENTO DEL PROBLEMA

El control de asistencia en los centros de formación del SENA se realiza de manera manual, generando pérdida de tiempo en el aula, errores humanos en el registro, dificultad para hacer seguimiento histórico y una carga administrativa innecesaria para los instructores. Adicionalmente, no existe un mecanismo tecnológico que integre múltiples métodos de identificación biométrica con una plataforma web centralizada.

---

## 2. JUSTIFICACIÓN

Arachiz nace como respuesta a la necesidad de modernizar el proceso de asistencia en el SENA, combinando tecnología IoT, reconocimiento biométrico y gamificación para crear una experiencia educativa más eficiente y atractiva.

**¿Por qué es importante?**
- Reduce el tiempo de registro de asistencia de ~10 minutos a segundos
- Elimina errores humanos en el conteo de asistentes
- Permite reportes en tiempo real para instructores y administrativos
- Integra hardware económico (ESP8266 + Arduino) con software moderno
- Mejora la motivación de los aprendices mediante gamificación

**Impacto esperado:**
- Reducción del 90% del tiempo dedicado al control manual de asistencia
- Cobertura de múltiples métodos de identificación (QR, NFC, Huella, Facial)
- Historial digital completo y exportable de asistencias

---

## 3. OBJETIVOS

### Objetivo General
Desarrollar e implementar un sistema web integral de gestión de asistencia académica para el SENA, con soporte de identificación biométrica multimodal (QR, NFC, huella dactilar y reconocimiento facial) mediante hardware IoT, que automatice el registro de asistencia y facilite la administración académica.

### Objetivos Específicos
1. **Diseñar** la arquitectura del sistema backend (Node.js + Express + Prisma) y frontend (React 19 + Vite) con base de datos PostgreSQL en la nube (Supabase)
2. **Implementar** autenticación segura con JWT, roles diferenciados (Administrador, Instructor, Aprendiz) y recuperación de contraseña
3. **Desarrollar** el módulo de hardware IoT con ESP8266/Arduino para leer huellas dactilares (AS608) y tarjetas NFC (MIFARE)
4. **Integrar** reconocimiento facial en tiempo real usando face-api.js con modelos de detección local
5. **Construir** el módulo de gamificación con 7 minijuegos, sistema de skins, rankings y tienda virtual
6. **Desplegar** la aplicación en producción usando Vercel (frontend) y Render (backend) con base de datos Supabase
7. **Generar** reportes exportables a Excel/CSV con estadísticas de asistencia por ficha, materia y aprendiz

---

## 4. CRONOGRAMA DE ACTIVIDADES

| N° | Actividad | Semana 1 | Semana 2 | Semana 3 | Semana 4 | Semana 5 | Semana 6 | Semana 7 | Semana 8 |
|----|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Análisis de requerimientos y diseño de BD | ✅ | | | | | | | |
| 2 | Configuración del entorno y arquitectura base | ✅ | | | | | | | |
| 3 | Módulo de autenticación (JWT, roles) | | ✅ | | | | | | |
| 4 | CRUD de Fichas, Materias, Horarios | | ✅ | ✅ | | | | | |
| 5 | Módulo de asistencia en tiempo real (Socket.io) | | | ✅ | ✅ | | | | |
| 6 | Hardware ESP8266 + Huella + NFC | | | | ✅ | ✅ | | | |
| 7 | Reconocimiento facial (face-api.js) | | | | | ✅ | | | |
| 8 | Sistema de excusas con adjuntos | | | | | ✅ | ✅ | | |
| 9 | Módulo de gamificación y minijuegos | | | | | | ✅ | | |
| 10 | Exportación Excel, reportes, estadísticas | | | | | | ✅ | | |
| 11 | Despliegue en producción (Vercel + Render) | | | | | | | ✅ | |
| 12 | Pruebas, correcciones y documentación | | | | | | | ✅ | ✅ |
| 13 | Presentación final | | | | | | | | ✅ |

---

## 5. PRESUPUESTO

### 5.1 Costos de Hardware

| Componente | Cantidad | Costo Unitario (COP) | Costo Total (COP) |
|---|---|---|---|
| Arduino Nano / Uno | 1 | $18.000 | $18.000 |
| ESP8266 (NodeMCU) | 1 | $22.000 | $22.000 |
| Sensor Huella AS608 | 1 | $35.000 | $35.000 |
| Módulo NFC RC522 | 1 | $12.000 | $12.000 |
| Tarjetas MIFARE (x10) | 10 | $2.500 | $25.000 |
| Cámara USB (reconocimiento facial) | 1 | $45.000 | $45.000 |
| Cables y protoboard | 1 | $15.000 | $15.000 |
| **SUBTOTAL HARDWARE** | | | **$172.000** |

### 5.2 Costos de Software y Servicios en la Nube

| Servicio | Plan | Costo Mensual (USD) | Observaciones |
|---|---|---|---|
| Supabase (Base de datos) | Free | $0 | Hasta 500MB, suficiente para la ficha |
| Vercel (Frontend) | Free | $0 | Deploy automático |
| Render (Backend) | Free | $0 | Spin-down en inactividad |
| Supabase Storage (archivos) | Free | $0 | Hasta 1GB |
| **SUBTOTAL SERVICIOS** | | | **$0 USD** |

### 5.3 Costos de Desarrollo (Horas Invertidas)

| Rol | Horas | Valor Hora (COP) | Total (COP) |
|---|---|---|---|
| Desarrollador Full Stack (×2) | 120h c/u | $25.000 | $6.000.000 |
| Desarrollador Hardware/IoT (×1) | 80h | $25.000 | $2.000.000 |
| Diseñador UI/UX (×1) | 60h | $20.000 | $1.200.000 |
| QA / Documentación (×1) | 40h | $15.000 | $600.000 |
| **SUBTOTAL DESARROLLO** | | | **$9.800.000** |

### 5.4 Resumen Total

| Categoría | Costo (COP) |
|---|---|
| Hardware | $172.000 |
| Servicios en la nube | $0 |
| Desarrollo (estimado) | $9.800.000 |
| **TOTAL PROYECTO** | **$9.972.000** |

> **Nota:** Los costos de desarrollo corresponden a una estimación basada en el mercado laboral colombiano para aprendices avanzados. Los servicios en la nube se utilizan en sus planes gratuitos, lo que hace el proyecto autosostenible sin inversión mensual.

---

## 6. INTEGRANTES DEL EQUIPO

| Nombre | Rol |
|---|---|
| [Integrante 1] | Líder técnico / Desarrollador Backend |
| [Integrante 2] | Desarrollador Frontend |
| [Integrante 3] | Hardware / IoT |
| [Integrante 4] | UI/UX Design |
| [Integrante 5] | QA / Documentación |

---

## 7. RESULTADOS ESPERADOS

- ✅ Sistema web funcional y desplegado en producción (arachiz.vercel.app)
- ✅ Integración de 4 métodos de identificación biométrica
- ✅ Aplicación móvil-friendly (PWA)
- ✅ Sistema de gamificación con 7 minijuegos
- ✅ Exportación de reportes a Excel
- ✅ Manual de usuario y manual técnico
- ✅ Código fuente versionado en GitHub

---

*Proyecto desarrollado en el marco del programa Análisis y Desarrollo de Software — SENA*
