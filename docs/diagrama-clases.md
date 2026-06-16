# Diagrama de Clases — Arachiz Inc

> **Nota arquitectónica:** El proyecto usa **Node.js + Prisma ORM**.  
> No existen clases Model propias. Los modelos se definen en `schema.prisma` y Prisma genera
> automáticamente todos los métodos de acceso a datos (`findMany`, `create`, `update`, `delete`, etc.).  
> Los controladores consumen directamente el singleton de `PrismaClient` exportado desde `lib/prisma.js`.  
> Por esto, las clases del diagrama aparecen **sin métodos** — esa es la representación correcta para un ORM.

```mermaid
classDiagram

    %% ─── CAPA DE ACCESO A DATOS ───
    class PrismaClient {
        -databaseUrl: String
        +$connect() Promise
        +$disconnect() Promise
    }

    %% ─── MODELOS PRINCIPALES ───

    class User {
        +id: String
        +userType: String
        +fullName: String
        +document: String
        +email: String
        +password: String
        +avatarUrl: String?
        +nfcUid: String?
        +huellas: Int[]
        +faceDescriptor: Float[]
        +rachaAsistencia: Int
        +createdAt: DateTime
    }

    class Ficha {
        +id: String
        +numero: String
        +nombre: String
        +nivel: String
        +centro: String
        +jornada: String
        +region: String
        +duracion: Int
        +fechaInicio: DateTime?
        +fechaFin: DateTime?
        +code: String
        +createdAt: DateTime
    }

    class FichaInstructor {
        +id: String
        +role: String
        +fichaId: String
        +instructorId: String
    }

    class Materia {
        +id: String
        +nombre: String
        +tipo: String
        +fichaId: String
        +instructorId: String?
    }

    class Horario {
        +id: String
        +dia: String
        +horaInicio: String
        +horaFin: String
        +fichaId: String
        +materiaId: String
    }

    class Asistencia {
        +id: String
        +fecha: String
        +activa: Boolean
        +timestamp: DateTime
        +llegadaTarde: Int
        +duracion: Int
        +aula: String?
        +descripcion: String?
        +materiaId: String
        +instructorId: String
    }

    class RegistroAsistencia {
        +id: String
        +presente: Boolean
        +metodo: String
        +timestamp: DateTime
        +justificado: Boolean
        +tarde: Boolean
        +asistenciaId: String
        +aprendizId: String
    }

    class Excusa {
        +id: String
        +fechas: String
        +motivo: String
        +archivosUrls: String?
        +estado: String
        +respuesta: String?
        +createdAt: DateTime
        +aprendizId: String
        +materiaId: String
        +registroAsistenciaId: String?
    }

    class MateriaEvitada {
        +id: String
        +aprendizId: String
        +materiaId: String
        +createdAt: DateTime
    }

    class Papelera {
        +id: String
        +tipoElemento: String
        +elementoId: String
        +datosOriginales: Json
        +razonEliminacion: String?
        +fechaEliminacion: DateTime
        +fichaId: String
        +eliminadoPor: String
        +rolEliminador: String
    }

    class HistorialCambios {
        +id: String
        +tipoEvento: String
        +entidad: String
        +entidadId: String
        +descripcion: String
        +datosAnteriores: Json?
        +datosNuevos: Json?
        +fechaHora: DateTime
        +ipAddress: String?
        +fichaId: String
        +usuarioId: String
    }

    class ConflictoHorario {
        +id: String
        +dia: String
        +descripcion: String
        +horarioIds: Json
        +resuelto: Boolean
        +createdAt: DateTime
        +resolvedAt: DateTime?
        +instructorId: String
        +creadoPor: String?
    }

    class MensajeChat {
        +id: String
        +texto: String
        +createdAt: DateTime
        +fichaId: String
        +senderId: String
    }

    class Notification {
        +id: String
        +title: String
        +message: String
        +type: String
        +read: Boolean
        +createdAt: DateTime
        +userId: String
    }

    class RespuestaRapida {
        +id: String
        +texto: String
        +orden: Int
        +createdAt: DateTime
        +instructorId: String
    }

    %% ─── RELACIONES ───

    %% PrismaClient gestiona todos los modelos
    PrismaClient ..> User : gestiona
    PrismaClient ..> Ficha : gestiona
    PrismaClient ..> Materia : gestiona
    PrismaClient ..> Asistencia : gestiona

    %% User ↔ Ficha (muchos a muchos vía tabla intermedia)
    User "1" --> "0..*" FichaInstructor : es instructor en
    Ficha "1" --> "0..*" FichaInstructor : tiene instructores
    User "0..*" --> "0..*" Ficha : aprendiz en

    %% User como admin/instructorAdmin de Ficha
    User "0..1" --> "0..*" Ficha : administra

    %% Ficha contiene Materias y Horarios
    Ficha "1" --> "0..*" Materia : contiene
    Ficha "1" --> "0..*" Horario : tiene

    %% Materia tiene Horarios y Asistencias
    Materia "1" --> "0..*" Horario : define
    Materia "1" --> "0..*" Asistencia : genera

    %% Asistencia tiene Registros
    Asistencia "1" --> "0..*" RegistroAsistencia : contiene

    %% User registra asistencia
    User "1" --> "0..*" RegistroAsistencia : tiene registro

    %% Excusa vinculada a registro
    RegistroAsistencia "1" --> "0..*" Excusa : justifica con
    User "1" --> "0..*" Excusa : crea
    Materia "1" --> "0..*" Excusa : referencia

    %% MateriaEvitada
    User "1" --> "0..*" MateriaEvitada : evita
    Materia "1" --> "0..*" MateriaEvitada : es evitada por

    %% Auditoría y chat vinculados a Ficha/User
    Ficha "1" --> "0..*" Papelera : registra en
    Ficha "1" --> "0..*" HistorialCambios : tiene historial
    Ficha "1" --> "0..*" MensajeChat : tiene mensajes
    User "1" --> "0..*" MensajeChat : envía
    User "1" --> "0..*" HistorialCambios : genera
    User "1" --> "0..*" Papelera : elimina
    User "1" --> "0..*" Notification : recibe
    User "1" --> "0..*" RespuestaRapida : configura
    User "1" --> "0..*" ConflictoHorario : tiene conflicto
```
