# Resumen: Sistema de Hardware Arduino + ESP8266

## ✅ Lo que ya funciona

### Hardware
- ✅ Arduino Uno lee NFC (PN532) y huellas (AS608)
- ✅ ESP8266 NodeMCU con pantalla OLED integrada
- ✅ Comunicación Arduino → ESP8266 por divisor de tensión (pines 9→D2, 8←D3)
- ✅ Switch para cambiar entre modo USB y WiFi
- ✅ Buzzer con sonidos diferenciados:
  - NFC: 2 tonos ascendentes (pi-pi)
  - Huella: 3 tonos ascendentes (pi-pi-pi)
  - Enrolamiento exitoso: 3 tonos largos
  - Error: 2 tonos graves (buu-buu)

### Software
- ✅ Modo USB (switch OFF): Arduino → Node.js por puerto COM (funciona como antes)
- ✅ Modo WiFi (switch ON): Arduino → ESP8266 → Render por HTTPS
- ✅ Backend tiene ruta `/api/hardware/event` para recibir eventos del ESP
- ✅ Pantalla OLED muestra logo de ARACHIZ en reposo
- ✅ Pantalla muestra mensajes cuando pasa algo y vuelve al logo después de 3 segundos

### Conexiones Físicas
```
Arduino 5V → Riel + protoboard
Arduino GND → Riel - protoboard
ESP8266 VIN → Riel +
ESP8266 GND → Riel -

NFC PN532 (I2C):
- VCC → 5V
- GND → GND
- SDA → Arduino A4 (o pin SDA físico)
- SCL → Arduino A5 (o pin SCL físico)
- Switches: 1:ON, 2:OFF

AS608 Huella:
- VCC → 3.3V del Arduino
- GND → GND
- TX → Arduino pin 2
- RX → Arduino pin 3

Buzzer:
- Pin largo → Arduino pin 6
- Pin corto → GND

Switch:
- Una pata → Arduino pin 7
- Otra pata → GND

Divisor de tensión (Arduino → ESP):
- Arduino pin 9 → R1 (1kΩ) → punto medio → ESP D2
- Punto medio → R2 (2.2kΩ) → GND

Retorno (ESP → Arduino):
- ESP D3 → Arduino pin 8 (directo, sin divisor)
```

## ⏳ Pendiente / En progreso

### Enrolamiento por WiFi
- ✅ Backend tiene cola de comandos (`/api/hardware/commands`)
- ✅ ESP consulta la cola cada 2 segundos
- ❌ **Falta probar** — necesita que Render despliegue desde rama `PruebaArduinoEsp`

### Bugs del Frontend
1. ❌ Vista "Gestionar" en fichas no deja borrar caras registradas
2. ❌ En asistencia no salen las clases anteriores
3. ❌ No sale el cuadrito de info NFC en inicio

### Audio (Placa SYJ-01A)
- ❌ No implementado
- Requiere: conexión TX/RX al Arduino, micro SD con MP3, bocina

## 📋 Próximos pasos

1. **Configurar Render** para desplegar desde `PruebaArduinoEsp`
2. **Probar enrolamiento WiFi** completo
3. **Arreglar bugs del frontend** (gestionar caras, historial asistencia, info NFC)
4. **Planear integración de audio** con SYJ-01A

## 🔧 Archivos modificados

### Arduino
- `ArduinoEsclavo/ArduinoEsclavo.ino` - V7.1 con sonidos y switch

### ESP8266
- `ESP8266Master/ESP8266Master.ino` - Con logo, WiFi y consulta de comandos

### Backend
- `backend/routes/hardwareRoutes.js` - Nueva ruta para ESP
- `backend/controllers/hardwareController.js` - Maneja eventos y cola de comandos
- `backend/controllers/serialController.js` - Soporte para modo WiFi en enrolamiento
- `backend/server.js` - Registra ruta `/api/hardware`
- `backend/.env` - Variable `HARDWARE_API_KEY`

## 🌐 URLs importantes

- Backend Render: `https://arachiz-backend.onrender.com`
- Ruta eventos: `POST /api/hardware/event`
- Ruta comandos: `GET /api/hardware/commands`
- API Key: `arachiz-esp-2024`
