# 🎨 PROMPT DE DISEÑO VISUAL - PRESENTACIÓN ARACHIZ

## 🎯 OBJETIVO DEL DISEÑO
Crear una presentación visualmente impactante que refleje la identidad de marca de **Arachiz**, transmitiendo modernidad, tecnología, confiabilidad y la esencia educativa del SENA, con un estilo limpio, profesional y dinámico.

---

## 🎨 IDENTIDAD VISUAL DE ARACHIZ

### **Paleta de Colores Principal**

**Colores Primarios:**
- **Verde SENA:** `#39A900` - Color institucional, representa crecimiento y educación
- **Azul Tecnológico:** `#4285F4` - Modernidad, confianza, tecnología
- **Azul Oscuro:** `#1a73e8` - Profesionalismo, estabilidad

**Colores Secundarios:**
- **Verde Claro:** `#4CAF50` - Éxito, aprobación
- **Amarillo:** `#FFC107` - Atención, pendiente
- **Rojo:** `#EA4335` - Alerta, rechazo
- **Naranja:** `#FF6B35` - Energía, acción

**Colores Neutros:**
- **Blanco:** `#FFFFFF` - Limpieza, espacio
- **Gris Claro:** `#F5F5F5` - Fondos suaves
- **Gris Medio:** `#9E9E9E` - Texto secundario
- **Gris Oscuro:** `#424242` - Texto principal
- **Negro:** `#000000` - Contraste máximo

**Gradientes Sugeridos:**
- **Gradiente Principal:** Verde SENA (#39A900) → Azul (#4285F4)
- **Gradiente Tecnológico:** Azul Oscuro (#1a73e8) → Azul Claro (#4285F4)
- **Gradiente Energético:** Naranja (#FF6B35) → Amarillo (#FFC107)

---

### **Tipografía**

**Fuentes Principales:**
- **Títulos:** Inter Bold / Montserrat Bold / Poppins Bold
  - Peso: 700-800
  - Tamaño: 48-72pt para títulos principales
  - Tamaño: 36-48pt para subtítulos
  
- **Cuerpo de Texto:** Inter Regular / Roboto / Open Sans
  - Peso: 400-500
  - Tamaño: 18-24pt para texto principal
  - Tamaño: 14-18pt para texto secundario

- **Código/Técnico:** Fira Code / JetBrains Mono / Consolas
  - Para mostrar código o datos técnicos
  - Tamaño: 14-18pt

**Jerarquía Tipográfica:**
- Títulos: Bold, color Verde SENA o Azul
- Subtítulos: Semi-Bold, color Gris Oscuro
- Texto: Regular, color Gris Oscuro
- Énfasis: Bold o color Azul Tecnológico

---

### **Logo y Elementos de Marca**

**Logo Arachiz:**
- Usar logo oficial: `frontend/public/mi-logo.png` (color)
- Versión alternativa: `frontend/public/mi-logo-white.png` (blanco)
- Posición: Esquina superior izquierda en todas las diapositivas
- Tamaño: Proporcional, no más del 10% del ancho de la diapositiva

**Elementos Visuales Característicos:**
- **Iconos:** Lucide Icons (estilo minimalista y moderno)
- **Ilustraciones:** Estilo flat design con colores de la paleta
- **Formas:** Bordes redondeados (border-radius: 8-16px)
- **Sombras:** Sutiles, para dar profundidad sin recargar

---

## 📐 ESTRUCTURA Y LAYOUT

### **Diseño de Diapositivas**

**Formato:**
- Relación de aspecto: 16:9 (1920x1080px)
- Márgenes: 80px en todos los lados
- Área de contenido seguro: 1760x920px

**Grid System:**
- Sistema de 12 columnas
- Espaciado consistente: 24px entre elementos
- Alineación: Izquierda para texto, centrado para elementos visuales

**Composición:**
- **Regla de tercios:** Elementos importantes en intersecciones
- **Espacio en blanco:** Generoso, no saturar diapositivas
- **Balance visual:** Equilibrio entre texto e imágenes
- **Jerarquía clara:** De más a menos importante

---

### **Tipos de Diapositivas**

#### **1. Diapositiva de Portada**
**Elementos:**
- Fondo: Gradiente Verde SENA → Azul Tecnológico (diagonal)
- Logo Arachiz: Grande, centrado superior
- Título: "Arachiz" - Tipografía Bold, 72pt, Blanco
- Subtítulo: "Sistema Integral de Gestión de Asistencia" - 36pt, Blanco 90% opacidad
- Versión: "v1.4.0" - Esquina inferior derecha, 18pt
- Elementos decorativos: Formas geométricas sutiles, iconos de tecnología en bajo contraste

**Estilo:**
- Moderno, impactante, tecnológico
- Uso de transparencias y capas
- Efecto de profundidad con sombras

---

#### **2. Diapositiva de Contenido con Texto**
**Elementos:**
- Fondo: Blanco o Gris Claro (#F5F5F5)
- Encabezado: Barra superior con gradiente sutil (Verde → Azul)
- Título de sección: Verde SENA, 48pt, Bold
- Contenido: Texto en columnas o bullets
- Iconos: A la izquierda de cada punto importante
- Líneas divisorias: Sutiles, color Gris Claro

**Layout:**
```
┌─────────────────────────────────────┐
│ [Logo]              [Título]        │ ← Barra superior
├─────────────────────────────────────┤
│                                     │
│  📊 Título de Sección               │
│                                     │
│  ✓ Punto 1 con icono               │
│  ✓ Punto 2 con icono               │
│  ✓ Punto 3 con icono               │
│                                     │
│  [Imagen o gráfico opcional]        │
│                                     │
└─────────────────────────────────────┘
```

---

#### **3. Diapositiva de Arquitectura/Diagrama**
**Elementos:**
- Fondo: Blanco puro
- Diagrama: Centrado, con colores de la paleta
- Cajas/Componentes: Bordes redondeados, sombras sutiles
- Flechas: Líneas sólidas con puntas, color Azul
- Etiquetas: Texto claro, fondo con transparencia

**Estilo de Diagramas:**
- **Capas:** Representar con rectángulos apilados
- **Flujos:** Flechas direccionales claras
- **Componentes:** Cajas con iconos representativos
- **Conexiones:** Líneas punteadas para relaciones opcionales
- **Colores:** Cada capa/tipo con color diferente de la paleta

**Ejemplo de Colores por Capa:**
- Frontend: Azul (#4285F4)
- Backend: Verde (#39A900)
- Base de Datos: Naranja (#FF6B35)
- Servicios Externos: Gris (#9E9E9E)

---

#### **4. Diapositiva de Tecnologías**
**Elementos:**
- Fondo: Blanco con patrón sutil de puntos o líneas
- Título: "Stack Tecnológico" - Verde SENA, 48pt
- Logos de tecnologías: Organizados en grid
- Nombres y versiones: Debajo de cada logo
- Categorías: Agrupadas con etiquetas (Frontend, Backend, etc.)

**Layout:**
```
┌─────────────────────────────────────┐
│  Stack Tecnológico                  │
│                                     │
│  Frontend                           │
│  [React] [Vite] [Tailwind] [...]   │
│                                     │
│  Backend                            │
│  [Node]  [Express] [Prisma] [...]  │
│                                     │
│  Base de Datos                      │
│  [PostgreSQL] [Supabase]            │
└─────────────────────────────────────┘
```

**Estilo de Logos:**
- Tamaño uniforme: 80x80px
- Espaciado: 40px entre logos
- Fondo: Círculo o cuadrado redondeado con sombra
- Hover effect (si es interactivo): Escala 1.1x

---

#### **5. Diapositiva de Estadísticas/Métricas**
**Elementos:**
- Fondo: Gradiente sutil (Blanco → Gris Claro)
- Números grandes: 72pt, Bold, Verde SENA o Azul
- Descripción: 24pt, Regular, Gris Oscuro
- Iconos: Grandes, coloridos, representativos
- Gráficos: Estilo minimalista, colores de la paleta

**Layout de Métricas:**
```
┌─────────────────────────────────────┐
│  Impacto del Sistema                │
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐         │
│  │ 80% │  │ 99% │  │ 15  │         │
│  │ ⚡  │  │ ✓   │  │ ⏱   │         │
│  └─────┘  └─────┘  └─────┘         │
│  Reducción Precisión  Minutos       │
│  de tiempo           ahorrados      │
└─────────────────────────────────────┘
```

---

#### **6. Diapositiva de Capturas de Pantalla**
**Elementos:**
- Fondo: Gradiente sutil o color sólido
- Captura: Centrada, con sombra pronunciada
- Marco: Simular ventana de navegador (opcional)
- Anotaciones: Flechas y etiquetas para destacar features
- Título descriptivo: Arriba o abajo de la captura

**Estilo de Capturas:**
- Sombra: `0 20px 60px rgba(0,0,0,0.3)`
- Borde: 1px sólido, color Gris Claro
- Esquinas: Redondeadas (8px)
- Escala: Ajustar para que se vea claramente

---

#### **7. Diapositiva de Comparación (Antes/Después)**
**Elementos:**
- División vertical: 50/50
- Lado izquierdo: "Antes" - Colores apagados, iconos de problema
- Lado derecho: "Después" - Colores vibrantes, iconos de éxito
- Línea divisoria: Vertical, con gradiente
- Iconos: ❌ para problemas, ✅ para soluciones

**Layout:**
```
┌─────────────────────────────────────┐
│  Transformación Digital             │
│                                     │
│  ANTES          │  DESPUÉS          │
│  ❌ Manual      │  ✅ Automatizado  │
│  ❌ Lento       │  ✅ Rápido        │
│  ❌ Errores     │  ✅ Preciso       │
│  ❌ Papel       │  ✅ Digital       │
└─────────────────────────────────────┘
```

---

## 🎭 ELEMENTOS VISUALES ESPECÍFICOS

### **Iconografía**

**Iconos por Sección:**
- **Asistencia:** 📊 📋 ✓ ⏱ 👤
- **Tecnología:** 💻 🔧 ⚙️ 🚀 ⚡
- **Seguridad:** 🔒 🛡️ 🔐 🔑
- **Educación:** 📚 🎓 👨‍🏫 👩‍🎓
- **Gamificación:** 🎮 🏆 🎯 ⭐ 🎨
- **Análisis:** 📈 📊 💹 🔍
- **Comunicación:** 💬 📧 🔔 📱

**Estilo de Iconos:**
- Línea: 2-3px de grosor
- Estilo: Outline o filled según contexto
- Colores: De la paleta principal
- Tamaño: 48-64px para iconos destacados, 24-32px para bullets

---

### **Gráficos y Visualizaciones**

**Tipos de Gráficos:**
1. **Gráficos de Barras:** Para comparaciones
2. **Gráficos de Líneas:** Para tendencias temporales
3. **Gráficos de Pastel:** Para distribuciones (usar con moderación)
4. **Infografías:** Para procesos y flujos

**Estilo de Gráficos:**
- Colores: De la paleta principal
- Fondo: Transparente o blanco
- Ejes: Líneas sutiles, color Gris Claro
- Etiquetas: Tipografía clara, tamaño legible
- Leyenda: Posición consistente (derecha o abajo)

---

### **Fotografías e Imágenes**

**Estilo Fotográfico:**
- **Tono:** Profesional, educativo, tecnológico
- **Filtro:** Ligero overlay con colores de marca (10-20% opacidad)
- **Composición:** Personas usando tecnología, aulas modernas, dispositivos
- **Calidad:** Alta resolución, bien iluminadas

**Uso de Imágenes:**
- Como fondo con overlay oscuro para texto blanco
- Como elemento decorativo en esquinas
- Como ilustración de conceptos
- Siempre con propósito, nunca decorativas sin sentido

---

### **Formas y Elementos Decorativos**

**Formas Geométricas:**
- **Círculos:** Para iconos, avatares, badges
- **Rectángulos redondeados:** Para cajas de contenido
- **Líneas:** Para divisores y conexiones
- **Polígonos:** Para elementos decorativos de fondo

**Efectos Visuales:**
- **Gradientes:** Sutiles, en fondos y elementos destacados
- **Sombras:** Para dar profundidad (box-shadow)
- **Transparencias:** Para capas y overlays
- **Blur:** Para fondos de modales o elementos destacados

---

## 🎬 ANIMACIONES Y TRANSICIONES (Si aplica)

**Transiciones entre Diapositivas:**
- **Tipo:** Fade, Slide, o Zoom
- **Duración:** 0.5-0.8 segundos
- **Easing:** Ease-in-out (suave)

**Animaciones de Elementos:**
- **Entrada:** Fade in + Slide up
- **Énfasis:** Scale o Pulse para elementos importantes
- **Salida:** Fade out
- **Timing:** Secuencial, no todo a la vez

**Principios:**
- Sutiles, no distraer del contenido
- Consistentes en toda la presentación
- Con propósito (guiar la atención)

---

## 📱 ADAPTABILIDAD Y CONSISTENCIA

**Consistencia Visual:**
- Mismo estilo de iconos en toda la presentación
- Paleta de colores coherente
- Tipografía uniforme
- Espaciados consistentes
- Alineación precisa

**Elementos Recurrentes:**
- Logo en todas las diapositivas (excepto portada)
- Número de página (esquina inferior derecha)
- Barra de progreso (opcional, parte superior)
- Footer con información de contacto (opcional)

---

## 🎯 DIAPOSITIVAS ESPECIALES

### **Diapositiva de Cierre**
**Elementos:**
- Fondo: Gradiente similar a portada
- Mensaje: "Gracias" o "¿Preguntas?"
- Información de contacto
- Logo Arachiz
- Redes sociales o enlaces (si aplica)

**Estilo:**
- Minimalista, elegante
- Texto centrado
- Colores: Blanco sobre gradiente

---

### **Diapositiva de Sección (Separadores)**
**Elementos:**
- Fondo: Color sólido (Verde SENA o Azul)
- Título de sección: Grande, centrado, Blanco
- Icono representativo: Grande, centrado
- Número de sección (opcional)

**Estilo:**
- Impactante, simple
- Alto contraste
- Tipografía Bold

---

## 🔍 DETALLES FINALES

**Calidad y Exportación:**
- Resolución: Mínimo 1920x1080px (Full HD)
- Formato: PDF de alta calidad o PowerPoint/Keynote
- Fuentes: Embebidas o convertidas a curvas
- Imágenes: Optimizadas pero sin pérdida de calidad

**Accesibilidad:**
- Contraste suficiente (mínimo 4.5:1 para texto)
- Texto legible a distancia
- No depender solo del color para transmitir información
- Alt text para imágenes (si aplica)

**Branding:**
- Reflejar la identidad de Arachiz en cada diapositiva
- Transmitir profesionalismo y modernidad
- Mantener coherencia con la aplicación web
- Usar elementos visuales reconocibles

---

## 📋 CHECKLIST DE DISEÑO

- [ ] Paleta de colores aplicada consistentemente
- [ ] Tipografía jerárquica y legible
- [ ] Logo visible en todas las diapositivas
- [ ] Espaciado y alineación precisos
- [ ] Iconos del mismo estilo
- [ ] Gráficos con colores de marca
- [ ] Imágenes de alta calidad
- [ ] Contraste adecuado para legibilidad
- [ ] Animaciones sutiles y con propósito
- [ ] Diseño responsive (si aplica)
- [ ] Elementos decorativos coherentes
- [ ] Diapositivas no saturadas de información
- [ ] Jerarquía visual clara
- [ ] Estilo moderno y tecnológico
- [ ] Refleja la identidad de Arachiz

---

## 💡 INSPIRACIÓN Y REFERENCIAS

**Estilo Visual:**
- **Google Material Design:** Colores vibrantes, sombras sutiles
- **Apple Keynote:** Minimalismo, tipografía clara
- **Stripe:** Gradientes modernos, ilustraciones flat
- **Notion:** Limpieza, espacios en blanco generosos

**Palabras Clave del Diseño:**
- Moderno
- Tecnológico
- Limpio
- Profesional
- Educativo
- Dinámico
- Confiable
- Innovador

---

**Versión del Documento:** 1.0  
**Fecha:** Abril 2026  
**Proyecto:** Arachiz v1.4.0  
**Diseño para:** Presentación Ejecutiva y Técnica
