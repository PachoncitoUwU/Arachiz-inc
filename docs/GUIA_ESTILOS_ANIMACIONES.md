# 🎨 Guía de Estilos y Animaciones - Arachiz

## Rama: ClaudePrueba

Esta guía te muestra cómo usar todas las animaciones y estilos mejorados de Tailwind CSS en Arachiz.

---

## 📦 Bibliotecas Instaladas

```json
{
  "tailwindcss-animate": "Animaciones predefinidas",
  "@tailwindcss/forms": "Estilos mejorados para formularios",
  "@tailwindcss/typography": "Tipografía mejorada",
  "framer-motion": "Animaciones avanzadas con React"
}
```

---

## 🎭 Animaciones Disponibles

### Animaciones de Entrada

```jsx
// Fade In
<div className="animate-fade-in">Aparece suavemente</div>

// Fade In Up (desde abajo)
<div className="animate-fade-in-up">Sube mientras aparece</div>

// Fade In Down (desde arriba)
<div className="animate-fade-in-down">Baja mientras aparece</div>

// Fade In Left (desde izquierda)
<div className="animate-fade-in-left">Entra desde la izquierda</div>

// Fade In Right (desde derecha)
<div className="animate-fade-in-right">Entra desde la derecha</div>

// Scale In (crece)
<div className="animate-scale-in">Crece desde el centro</div>

// Slide In Up
<div className="animate-slide-in-up">Desliza hacia arriba</div>

// Slide In Down
<div className="animate-slide-in-down">Desliza hacia abajo</div>
```

### Animaciones de Atención

```jsx
// Bounce Suave
<button className="animate-bounce-soft">¡Haz clic!</button>

// Pulse Suave
<div className="animate-pulse-soft">Pulsando...</div>

// Wiggle (menear)
<div className="animate-wiggle">Menea</div>

// Shake (sacudir)
<div className="animate-shake">Sacude</div>

// Float (flotar)
<div className="animate-float">Flotando</div>

// Glow (brillo)
<div className="animate-glow">Brillando</div>
```

### Animaciones de Carga

```jsx
// Spin Lento
<div className="animate-spin-slow">⚙️</div>

// Ping Lento
<div className="animate-ping-slow">📡</div>

// Shimmer (brillo deslizante)
<div className="animate-shimmer">Cargando...</div>

// Gradient Animado
<div className="animate-gradient gradient-arachiz">Gradiente animado</div>
```

### Delays de Animación

```jsx
// Animaciones escalonadas
<div className="animate-fade-in animate-delay-100">Primero</div>
<div className="animate-fade-in animate-delay-200">Segundo</div>
<div className="animate-fade-in animate-delay-300">Tercero</div>
<div className="animate-fade-in animate-delay-400">Cuarto</div>
<div className="animate-fade-in animate-delay-500">Quinto</div>
```

---

## 🎨 Componentes de UI

### Botones

```jsx
// Botón Primario
<button className="btn-primary">Guardar</button>

// Botón Secundario
<button className="btn-secondary">Cancelar</button>

// Botón de Éxito
<button className="btn-success">Confirmar</button>

// Botón de Peligro
<button className="btn-danger">Eliminar</button>

// Botón de Advertencia
<button className="btn-warning">Advertencia</button>

// Botón Fantasma
<button className="btn-ghost">Sutil</button>

// Botón de Icono
<button className="btn-icon">
  <Icon size={18} />
</button>

// Botón con Ripple Effect
<button className="btn-primary btn-ripple">
  Click con efecto
</button>
```

### Cards

```jsx
// Card Normal
<div className="card">
  <h3>Título</h3>
  <p>Contenido</p>
</div>

// Card con Hover
<div className="card-hover">
  <h3>Se eleva al pasar el mouse</h3>
</div>

// Card Glass (Glassmorphism)
<div className="card-glass">
  <h3>Efecto de vidrio</h3>
</div>

// Card con Animación de Entrada
<div className="card animate-fade-in-up">
  <h3>Aparece con animación</h3>
</div>
```

### Inputs

```jsx
// Input Normal
<input type="text" className="input-field" placeholder="Escribe aquí" />

// Input con Error
<input type="text" className="input-error" placeholder="Error" />

// Input con Éxito
<input type="text" className="input-success" placeholder="Correcto" />

// Input con Glow al Focus
<input type="text" className="input-field input-glow" placeholder="Brilla al enfocar" />

// Label
<label className="input-label">Nombre</label>
```

### Badges

```jsx
// Badge Primario
<span className="badge-primary">Nuevo</span>

// Badge de Éxito
<span className="badge-success">Activo</span>

// Badge de Peligro
<span className="badge-danger">Urgente</span>

// Badge de Advertencia
<span className="badge-warning">Pendiente</span>

// Badge Gris
<span className="badge-gray">Inactivo</span>

// Badge con Pulse
<span className="badge-primary badge-pulse">¡Nuevo!</span>
```

### Avatares

```jsx
// Avatar Pequeño
<img src="..." className="avatar-sm" />

// Avatar Mediano
<img src="..." className="avatar-md" />

// Avatar Grande
<img src="..." className="avatar-lg" />

// Avatar Extra Grande
<img src="..." className="avatar-xl" />

// Avatar con Ring
<img src="..." className="avatar-md avatar-ring" />
```

### Alerts

```jsx
// Alert Info
<div className="alert-info">
  <AlertCircle size={20} />
  <div>
    <h4 className="font-semibold">Información</h4>
    <p className="text-sm">Este es un mensaje informativo</p>
  </div>
</div>

// Alert Success
<div className="alert-success">
  <CheckCircle size={20} />
  <div>
    <h4 className="font-semibold">¡Éxito!</h4>
    <p className="text-sm">Operación completada</p>
  </div>
</div>

// Alert Warning
<div className="alert-warning">
  <AlertTriangle size={20} />
  <div>
    <h4 className="font-semibold">Advertencia</h4>
    <p className="text-sm">Ten cuidado</p>
  </div>
</div>

// Alert Error
<div className="alert-error">
  <XCircle size={20} />
  <div>
    <h4 className="font-semibold">Error</h4>
    <p className="text-sm">Algo salió mal</p>
  </div>
</div>
```

### Modales

```jsx
// Modal Básico
<div className="modal-backdrop" onClick={onClose}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    <h2 className="text-xl font-bold mb-4">Título del Modal</h2>
    <p className="text-gray-600 mb-6">Contenido del modal</p>
    <div className="flex gap-3 justify-end">
      <button className="btn-secondary" onClick={onClose}>Cancelar</button>
      <button className="btn-primary">Confirmar</button>
    </div>
  </div>
</div>
```

### Progress Bars

```jsx
// Barra de Progreso
<div className="progress">
  <div className="progress-bar" style={{ width: '60%' }}></div>
</div>

// Con Animación
<div className="progress">
  <div className="progress-bar animate-shimmer" style={{ width: '60%' }}></div>
</div>
```

### Skeleton Loaders

```jsx
// Skeleton de Texto
<div className="skeleton-text"></div>

// Skeleton de Caja
<div className="skeleton-box h-20 w-full"></div>

// Skeleton de Círculo (Avatar)
<div className="skeleton-circle w-12 h-12"></div>

// Skeleton de Card
<div className="card">
  <div className="skeleton-circle w-12 h-12 mb-3"></div>
  <div className="skeleton-text mb-2"></div>
  <div className="skeleton-text w-3/4"></div>
</div>
```

---

## 🎨 Efectos Especiales

### Glassmorphism

```jsx
// Efecto de Vidrio
<div className="glass p-6 rounded-2xl">
  <h3>Contenido con efecto de vidrio</h3>
</div>

// Vidrio Oscuro
<div className="glass-dark p-6 rounded-2xl">
  <h3>Vidrio oscuro</h3>
</div>

// Glass Effect Utility
<div className="glass-effect p-6 rounded-2xl">
  <h3>Efecto de vidrio con utility</h3>
</div>
```

### Gradientes

```jsx
// Gradiente Azul
<div className="gradient-blue p-6 rounded-2xl text-white">
  Gradiente azul
</div>

// Gradiente Verde
<div className="gradient-green p-6 rounded-2xl text-white">
  Gradiente verde
</div>

// Gradiente Rojo
<div className="gradient-red p-6 rounded-2xl text-white">
  Gradiente rojo
</div>

// Gradiente Amarillo
<div className="gradient-yellow p-6 rounded-2xl text-white">
  Gradiente amarillo
</div>

// Gradiente Arachiz (Multicolor)
<div className="gradient-arachiz p-6 rounded-2xl text-white">
  Gradiente Arachiz
</div>

// Gradiente Animado
<div className="gradient-animate p-6 rounded-2xl text-white">
  Gradiente que se mueve
</div>
```

### Texto con Efectos

```jsx
// Texto con Gradiente
<h1 className="text-gradient text-4xl font-bold">
  Texto con gradiente
</h1>

// Texto con Shimmer
<h1 className="text-shimmer text-4xl font-bold">
  Texto brillante
</h1>
```

### Hover Effects

```jsx
// Lift (Elevar)
<div className="hover-lift card">
  Se eleva al pasar el mouse
</div>

// Glow (Brillo)
<button className="btn-primary hover-glow">
  Brilla al pasar el mouse
</button>
```

---

## 🎯 Ejemplos Prácticos

### Card de Aprendiz con Animaciones

```jsx
<div className="card-hover animate-fade-in-up animate-delay-100">
  <div className="flex items-center gap-4">
    <img src={avatar} className="avatar-md avatar-ring" />
    <div className="flex-1">
      <h3 className="font-bold text-gray-900">Juan Pérez</h3>
      <p className="text-sm text-gray-500">juan@example.com</p>
    </div>
    <span className="badge-success">Activo</span>
  </div>
</div>
```

### Botón de Acción con Efectos

```jsx
<button className="btn-primary btn-ripple hover-glow animate-bounce-soft">
  <CheckCircle size={18} />
  Registrar Asistencia
</button>
```

### Modal de Confirmación

```jsx
<div className="modal-backdrop">
  <div className="modal-content animate-scale-in">
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
        <CheckCircle size={32} className="text-green-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">¡Éxito!</h2>
      <p className="text-gray-600 mb-6">La operación se completó correctamente</p>
      <button className="btn-primary w-full">Continuar</button>
    </div>
  </div>
</div>
```

### Lista con Animaciones Escalonadas

```jsx
<div className="stagger-fade-in space-y-3">
  <div className="card">Elemento 1</div>
  <div className="card">Elemento 2</div>
  <div className="card">Elemento 3</div>
  <div className="card">Elemento 4</div>
  <div className="card">Elemento 5</div>
</div>
```

### Notificación Toast

```jsx
<div className="notification-slide fixed top-4 right-4 z-50">
  <div className="alert-success shadow-card-hover">
    <CheckCircle size={20} />
    <div>
      <h4 className="font-semibold">¡Guardado!</h4>
      <p className="text-sm">Los cambios se guardaron correctamente</p>
    </div>
  </div>
</div>
```

---

## 🎨 Paleta de Colores Extendida

### Azul (Blue)
- `bg-blue-50` a `bg-blue-900`
- `text-blue-50` a `text-blue-900`
- `border-blue-50` a `border-blue-900`

### Verde (Green)
- `bg-green-50` a `bg-green-900`
- `text-green-50` a `text-green-900`
- `border-green-50` a `border-green-900`

### Rojo (Red)
- `bg-red-50` a `bg-red-900`
- `text-red-50` a `text-red-900`
- `border-red-50` a `border-red-900`

### Amarillo (Yellow)
- `bg-yellow-50` a `bg-yellow-900`
- `text-yellow-50` a `text-yellow-900`
- `border-yellow-50` a `border-yellow-900`

### Gris (Gray)
- `bg-gray-50` a `bg-gray-900`
- `text-gray-50` a `text-gray-900`
- `border-gray-50` a `border-gray-900`

---

## 🌙 Dark Mode

Todas las clases funcionan automáticamente en dark mode. Solo agrega la clase `dark` al elemento `<html>`:

```jsx
// Activar dark mode
document.documentElement.classList.add('dark');

// Desactivar dark mode
document.documentElement.classList.remove('dark');
```

---

## 📱 Responsive Design

Usa los prefijos de Tailwind para responsive:

```jsx
// Móvil primero
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Cards */}
</div>

// Ocultar en móvil
<div className="hidden md:block">Solo en desktop</div>

// Mostrar solo en móvil
<div className="block md:hidden">Solo en móvil</div>
```

---

## 🚀 Tips de Performance

1. **Usa `will-change` para animaciones pesadas**:
   ```jsx
   <div className="will-change-transform animate-float">...</div>
   ```

2. **Prefiere `transform` sobre `top/left`**:
   ```jsx
   // ✅ Bueno
   <div className="transform translate-x-4">...</div>
   
   // ❌ Evitar
   <div style={{ left: '16px' }}>...</div>
   ```

3. **Usa `backdrop-blur` con moderación**:
   ```jsx
   // Solo cuando sea necesario
   <div className="backdrop-blur-xl">...</div>
   ```

---

## 📚 Recursos Adicionales

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind CSS Animate](https://github.com/jamiebuilds/tailwindcss-animate)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)

---

## 🎉 Ejemplos Completos

### Dashboard Card Animada

```jsx
<div className="card-hover animate-fade-in-up">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-gray-900">Estadísticas</h3>
    <span className="badge-primary badge-pulse">Nuevo</span>
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="text-center p-4 bg-blue-50 rounded-xl">
      <div className="text-3xl font-bold text-blue-600 animate-bounce-soft">
        127
      </div>
      <div className="text-sm text-gray-600 mt-1">Aprendices</div>
    </div>
    
    <div className="text-center p-4 bg-green-50 rounded-xl">
      <div className="text-3xl font-bold text-green-600 animate-bounce-soft animate-delay-100">
        95%
      </div>
      <div className="text-sm text-gray-600 mt-1">Asistencia</div>
    </div>
  </div>
</div>
```

### Formulario con Validación

```jsx
<form className="space-y-4">
  <div>
    <label className="input-label">Nombre</label>
    <input 
      type="text" 
      className={isValid ? "input-success" : "input-error"}
      placeholder="Tu nombre"
    />
    {!isValid && (
      <p className="text-sm text-red-500 mt-1 animate-shake">
        Este campo es requerido
      </p>
    )}
  </div>
  
  <button type="submit" className="btn-primary w-full btn-ripple">
    Enviar
  </button>
</form>
```

---

**¡Diviértete creando interfaces hermosas con Arachiz! 🥜✨**
