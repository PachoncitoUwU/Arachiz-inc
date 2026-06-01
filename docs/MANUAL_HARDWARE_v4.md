# 🥜 ARACHIZ v4
## Manual de Hardware y Uso del Dispositivo

**Versión del dispositivo:** Arachiz v4  
**Compatible con:** Sistema web Arachiz · https://arachiz.vercel.app

---

> *La caja Arachiz v4 es el cerebro físico del sistema. Se encarga de leer huellas, detectar tarjetas NFC y comunicarle todo al servidor en tiempo real. Sin ella, el sistema funciona — pero con ella, es magia.*

---

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

<!-- ═══════════════════ NUEVA PÁGINA ═══════════════════ -->
---

## 📦 1. ¿Qué hay dentro de la caja?

La caja **Arachiz v4** contiene todo el hardware necesario para el registro biométrico de asistencia. Está diseñada para ser enchufada y lista — sin abrir ni modificar nada.

### Componentes Integrados

| Componente | Función |
|---|---|
| **Arduino Nano / Uno** | Cerebro del dispositivo. Procesa las lecturas y las envía al ESP |
| **ESP8266 (NodeMCU)** | Módulo WiFi. Toma los datos del Arduino y los sube al servidor |
| **Sensor PN532 (NFC)** | Lector de tarjetas y llaveros NFC tipo MIFARE |
| **Sensor AS608 (Huella)** | Lector óptico de huella dactilar. Almacena hasta 127 huellas |
| **Buzzer activo (×2)** | Emite sonidos de confirmación o error |
| **Switch deslizable** | Selecciona el modo de operación: WiFi o USB |

### Entradas y salidas de la caja

```
┌──────────────────────────────────────────────┐
│                 ARACHIZ v4                   │
│                                              │
│  [● Sensor NFC]     [◉ Sensor Huella]        │
│                                              │
│                              ▐ Switch Modo   │
│  [USB-B Arduino] [USB-Mini ESP]             │
└──────────────────────────────────────────────┘
```

- **Puerto USB del Arduino** → Conectar al PC (modo USB local) o fuente de poder
- **Puerto USB del ESP8266** → Conectar solo para reprogramar o depurar
- **Switch Modo** → `↑ OFF` = modo USB · `↓ ON` = modo WiFi con servidor

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

<!-- ═══════════════════ NUEVA PÁGINA ═══════════════════ -->
---

## 🔌 2. Puesta en Marcha

### Lo que necesitas antes de comenzar
- ✅ Cable USB tipo B (el mismo de las impresoras antiguas)
- ✅ Computador con el sistema Arachiz corriendo
- ✅ Red WiFi de 2.4 GHz disponible en el salón
- ✅ Acceso a la cuenta de instructor en https://arachiz.vercel.app

---

### Paso 1 — Encender el dispositivo

Conecta el cable USB del **Arduino** a la corriente o al PC. El buzzer emitirá **dos pitidos cortos** indicando que el sistema arrancó correctamente.

> ⚠️ **Importante:** El sensor de huella puede tener el láser encendido aunque esté en espera. Eso es normal — no indica que esté leyendo. El Arduino lo controla internamente.

---

### Paso 2 — Elegir el modo de operación

El **switch deslizable** en el lateral de la caja determina cómo se comunica el dispositivo:

| Posición | Modo | ¿Cuándo usarlo? |
|---|---|---|
| `↑ (arriba)` | **USB / Local** | Cuando el PC con backend está cerca y conectado por cable |
| `↓ (abajo)` | **WiFi / Render** | Para uso en el aula con conexión al servidor en la nube |

**Para el uso normal en clase → switch abajo (WiFi)**

---

### Paso 3 — Configurar el WiFi (primera vez)

Si es la primera vez o cambiaste de red, el ESP8266 creará una red temporal:

1. Busca en tu celular la red WiFi llamada **`ARACHIZ-CONFIG`**
2. Conéctate (sin contraseña)
3. Se abrirá automáticamente una página de configuración
4. Ingresa el nombre y contraseña del WiFi del salón
5. Toca **"Guardar y Conectar"**
6. El dispositivo se reiniciará y emitirá **tres pitidos** cuando se conecte exitosamente

> Si la página no abre sola → abre el navegador y ve a `http://192.168.4.1`

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

<!-- ═══════════════════ NUEVA PÁGINA ═══════════════════ -->
---

## 📇 3. Uso con Tarjetas NFC

El sensor **PN532** detecta tarjetas y llaveros MIFARE a una distancia de hasta **3 cm**.

### Cómo registrar la tarjeta de un aprendiz

1. Inicia sesión en Arachiz como **instructor**
2. Ve a la ficha → pestaña **"Aprendices"**
3. Toca el nombre del aprendiz → **"Configurar NFC"**
4. Pide al aprendiz que acerque su tarjeta al sensor de la caja
5. El sistema captura el UID automáticamente y lo guarda

### Cómo marcar asistencia con NFC

Una sesión de asistencia debe estar activa. Luego:

1. El aprendiz acerca su tarjeta al sensor
2. El dispositivo emite **dos pitidos ascendentes** 🎵🎵
3. El nombre del aprendiz aparece como **✅ Presente** en el panel del instructor en tiempo real

### ¿Qué tarjetas funcionan?

Cualquier tarjeta o llavero **MIFARE Classic 1K** (estándar). Son las tarjetas blancas o de colores comunes en papelerías y tiendas electrónicas.

> **El sistema NO tiene límite** de tarjetas NFC registradas. A diferencia del sensor de huella, el UID se almacena en la nube.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

<!-- ═══════════════════ NUEVA PÁGINA ═══════════════════ -->
---

## 👆 4. Uso con Huella Dactilar

El sensor **AS608** es un lector óptico. Necesita que el dedo esté en contacto directo con la superficie del sensor.

> ⚠️ **Límite físico del sensor:** Puede almacenar un máximo de **127 huellas**. Si tu ficha tiene más aprendices, complementa con NFC o QR.

---

### Cómo registrar la huella de un aprendiz

El proceso requiere que el instructor inicie el enrolamiento desde la app:

1. Inicia sesión como **instructor**
2. Ve a la ficha → el aprendiz que quieres registrar → **"Registrar huella"**
3. El sistema enviará el comando al dispositivo
4. El dispositivo emitirá un pitido suave — **pide al aprendiz que ponga el dedo**
5. Se escanea dos veces para confirmar
6. Si todo va bien → **tres pitidos ascendentes** ✅

**Si la huella ya estaba registrada:** el sistema lo detecta y emite sonido de error para evitar duplicados.

---

### Cómo marcar asistencia con huella

Con sesión activa:

1. El aprendiz pone el dedo sobre el sensor
2. El sensor procesa en menos de **1 segundo**
3. Sonido de **tres pitidos** en escala ascendente 🎵🎵🎵
4. El nombre aparece en el panel del instructor

---

### Sonidos del dispositivo

| Sonido | Significa |
|---|---|
| 🎵🎵 Dos pitidos (do-re) | NFC leído correctamente |
| 🎵🎵🎵 Tres pitidos ascendentes | Huella reconocida o enrolamiento exitoso |
| ❌ Dos pitidos graves iguales | Error: huella no reconocida, NFC inválido o tiempo agotado |

&nbsp;

&nbsp;

&nbsp;

&nbsp;

<!-- ═══════════════════ NUEVA PÁGINA ═══════════════════ -->
---

## 🔧 5. Solución de Problemas

### El dispositivo no hace nada al encenderlo
- Verifica que el cable USB esté bien conectado al **puerto del Arduino** (no al ESP)
- Espera 5 segundos — el arranque inicial tarda un poco
- Revisa que el switch esté en la posición correcta

### El NFC no detecta la tarjeta
- Acerca la tarjeta a **menos de 2 cm** del sensor, de forma plana
- Evita interferencias metálicas cerca del sensor
- Reinicia el dispositivo desconectando y reconectando el USB

### La huella no es reconocida
- Limpia el sensor con un paño seco
- Asegúrate de que el dedo esté seco y limpio
- El dedo debe estar **plano y centrado** sobre el sensor, no en ángulo
- Verifica que la huella esté registrada en el sistema

### El dispositivo no se conecta al WiFi
- Verifica que el switch esté en modo WiFi (`↓`)
- Asegúrate de que la red sea de **2.4 GHz** (el ESP8266 no soporta 5 GHz)
- Si cambiaste de red, sigue el proceso de configuración de la sección 2
- Como último recurso, mantén presionado el botón **RESET** del ESP

### ¿Cómo saber si está conectado al WiFi?
En modo WiFi, el ESP8266 tiene un LED indicador:
- **LED parpadeando rápido** → Conectando...
- **LED fijo** → Conectado y listo

---

## 🔁 6. Cambiar la Red WiFi

Si necesitas conectar el dispositivo a otra red (por ejemplo, de la casa al SENA):

1. Conecta el dispositivo
2. Desde tu celular, busca la red **`ARACHIZ-CONFIG`**
3. Conéctate y entra al portal
4. Toca **"Borrar configuración"**
5. El dispositivo se reiniciará en modo configuración
6. Sigue el proceso de la sección 2

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

<!-- ═══════════════════ NUEVA PÁGINA ═══════════════════ -->
---

## ⚡ 7. Especificaciones Técnicas

| Parámetro | Valor |
|---|---|
| Microcontrolador principal | Arduino Nano / Uno (ATmega328P) |
| Módulo WiFi | ESP8266 NodeMCU (802.11 b/g/n) |
| Sensor NFC | PN532 (I2C) — ISO/IEC 14443 tipo A/B |
| Sensor de huella | AS608 (UART 57600) — Óptico |
| Capacidad de huellas | Hasta 127 modelos en el sensor |
| Capacidad NFC | Ilimitada (almacenada en la nube) |
| Alimentación | 5V DC vía USB |
| Consumo promedio | ~350mA |
| Comunicación servidor | HTTP via ESP8266 → Render/Backend |
| Protocolos | Serial UART, I2C, SoftwareSerial, HTTP |
| Distancia lectura NFC | Hasta 3 cm |
| Tiempo de respuesta huella | < 1 segundo |
| Firmware | Arachiz Slave v7.1 |

---

## 📋 8. Checklist de Uso en Clase

Antes de iniciar cada sesión de asistencia, verifica:

- [ ] Dispositivo encendido y con **dos pitidos de inicio**
- [ ] Switch en modo **WiFi** (↓)
- [ ] LED del ESP en estado **fijo** (conectado)
- [ ] Sesión de asistencia **iniciada desde la app**
- [ ] Panel del instructor **abierto** para ver en tiempo real
- [ ] Aprendices con sus tarjetas NFC o huellas **ya registradas**

---

&nbsp;

&nbsp;

> **¿Necesitas soporte técnico?**  
> Consulta al equipo de desarrollo o revisa la documentación en:  
> https://arachiz.vercel.app · soporte@arachiz.com

---

<div align="center">

**Arachiz v4 — Hecho con ❤️ por el equipo Arachiz**  
*Ficha 3146013 · SENA · 2026*

</div>
