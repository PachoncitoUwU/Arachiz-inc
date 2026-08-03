// Deshabilitar watchdog al inicio para evitar loop de resets
#include <avr/wdt.h>
void wdt_init(void) __attribute__((naked)) __attribute__((section(".init3")));
void wdt_init(void) { wdt_disable(); }

#include <Wire.h>
#include <Adafruit_PN532.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// ── HARDWARE ──────────────────────────────────────────────────────────────────
// Adafruit_PN532 usando I2C por hardware (pines A4/A5 en Uno/Nano)
Adafruit_PN532 nfc_hardware((uint8_t)0, (uint8_t)0);

SoftwareSerial mySerial(2, 3);   // AS608 huella: RX=2, TX=3
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
SoftwareSerial espSerial(8, 9);  // ESP8266: RX=8, TX=9

// IMPORTANTE: PIN_BUZZER debe ser pin PWM (3,5,6,9,10,11 en Uno/Nano)
// tone() usa Timer2 y no bloquea interrupciones — a diferencia de bridgeTone()
const int PIN_BUZZER  = 6;
const int PIN_BUZZER2 = 5;
const int PIN_SWITCH  = 7;  // LOW=WiFi | HIGH=USB

// ── ESTADO ────────────────────────────────────────────────────────────────────
bool sesionActiva   = false;
bool enrollando     = false;
bool modoTest       = false;
unsigned long lastPoll    = 0;
unsigned long lastNFC     = 0;
uint8_t       erroresSensor = 0;

// Intervalos optimizados para menor latencia
const unsigned long POLL_INTERVAL = 400;   // era 600ms → ahora 400ms
const unsigned long NFC_INTERVAL  = 150;   // era 200ms → ahora 150ms
const uint8_t       MAX_ERRORES   = 6;

// ── PROTOTIPOS ────────────────────────────────────────────────────────────────
void    sonidoNFC();
void    sonidoHuella();
void    sonidoEnrolamientoInicio();
void    sonidoEnrolamientoOK();
void    sonidoError();
bool    enrolar(int id);
String  hexUID(uint8_t* uid, uint8_t len);
void    enviarEvento(String msg);
void    procesarComando(String cmd);
String  pollESP();
void    esperarRetiroDedo(unsigned long timeoutMs);
bool    reiniciarSensor();
void    beep(int freq, int dur);   // wrapper de tone() no bloqueante

// ── SETUP ─────────────────────────────────────────────────────────────────────
void setup() {
  wdt_disable();

  Serial.begin(9600);
  espSerial.begin(9600);   // 9600 baud — sincronizado con ESP8266Master.ino

  pinMode(PIN_BUZZER,  OUTPUT);
  pinMode(PIN_BUZZER2, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_BUZZER2, LOW);
  pinMode(PIN_SWITCH, INPUT_PULLUP);

  delay(200);

  Serial.println(F("\n========================================="));
  Serial.println(F(" ARACHIZ - MODO ESCLAVO V10.5"));
  Serial.println(F("========================================="));

  Wire.begin();
  nfc_hardware.begin();
  delay(100);
  uint32_t ver = nfc_hardware.getFirmwareVersion();
  if (!ver) {
    Serial.println(F("ERROR: NFC no encontrado"));
  } else {
    Serial.print(F("NFC OK v")); Serial.println((ver >> 16) & 0xFF);
    nfc_hardware.SAMConfig();
  }

  mySerial.listen();
  finger.begin(57600);
  delay(100);
  if (!finger.verifyPassword()) {
    // Si no responde a 57600, probar a 9600 baudios (común en sensores con luz azul R307/AS608)
    finger.begin(9600);
    delay(100);
  }

  if (finger.verifyPassword()) {
    Serial.println(F("Huella AS608 OK"));
    erroresSensor = 0;
  } else {
    Serial.println(F("ERROR: Sensor huella no encontrado"));
  }

  Serial.println(digitalRead(PIN_SWITCH) == LOW ? F("MODO: WiFi") : F("MODO: USB"));
  Serial.println(F("========================================="));
}

// ── BEEP: usa tone() que NO bloquea interrupciones ───────────────────────────
// tone() dispara el sonido en background usando Timer2.
// La llamada retorna inmediatamente; noTone() lo para.
// Para el buzzer bridge (A+ / A-), alternamos PIN_BUZZER2 manualmente
// pero SOLO durante el delay posterior (ya no estamos hablando con el sensor).
void beep(int freq, int dur) {
  tone(PIN_BUZZER, freq, dur);
  // PIN_BUZZER2 actúa como tierra del puente H — ponerlo LOW es suficiente
  digitalWrite(PIN_BUZZER2, LOW);
  delay(dur);           // delay DESPUÉS de que tone() ya está corriendo
  noTone(PIN_BUZZER);
  digitalWrite(PIN_BUZZER, LOW);
}

// ── SONIDOS ───────────────────────────────────────────────────────────────────
void sonidoHuella() {
  beep(900, 80); delay(25); beep(1200, 80); delay(25); beep(1600, 120);
}
void sonidoNFC() {
  beep(1000, 120); delay(30); beep(1500, 120);
}
void sonidoEnrolamientoInicio() {
  beep(800, 70); delay(40); beep(1100, 140);
}
void sonidoEnrolamientoOK() {
  beep(1000, 90); delay(35); beep(1300, 90); delay(35);
  beep(1600, 90); delay(35); beep(2000, 220);
}
void sonidoError() {
  beep(300, 280); delay(60); beep(300, 280);
}

// ── REINICIAR SENSOR AS608 ────────────────────────────────────────────────────
bool reiniciarSensor() {
  Serial.println(F("[Huella] Reiniciando sensor..."));
  mySerial.end();
  delay(300);
  mySerial.begin(57600);
  mySerial.listen();
  delay(300);
  finger.begin(57600);
  delay(150);
  erroresSensor = 0;
  if (finger.verifyPassword()) {
    Serial.println(F("[Huella] OK tras reinicio"));
    return true;
  }
  Serial.println(F("[Huella] No responde tras reinicio"));
  return false;
}

// ── ENVIAR EVENTO ─────────────────────────────────────────────────────────────
void enviarEvento(String msg) {
  if (digitalRead(PIN_SWITCH) == LOW) {
    while (espSerial.available()) espSerial.read(); // limpiar basura
    espSerial.listen();
    delay(5);
    espSerial.println("EVT:" + msg);
    // A 9600 baud ~1ms/byte; "EVT:READ_FINGER:128\n" ~22 bytes = ~22ms
    delay(35);                  // margen seguro sobre los 22ms a 9600 baud
    Serial.println("WiFi -> " + msg);
    mySerial.listen();
    delay(5);
  } else {
    Serial.println(msg);
  }
}

// ── ESPERAR RETIRO DE DEDO ────────────────────────────────────────────────────
void esperarRetiroDedo(unsigned long timeoutMs) {
  unsigned long t0 = millis();
  uint8_t estado;
  do {
    mySerial.listen();
    delay(50);                  // era 80ms → 50ms: más rápido para detectar retiro
    estado = finger.getImage();
    if (estado == FINGERPRINT_PACKETRECIEVEERR) {
      erroresSensor++;
      break;
    }
  } while (estado != FINGERPRINT_NOFINGER && millis() - t0 < timeoutMs);
  delay(60);                    // era 120ms → 60ms
}

// ── POLL AL ESP ───────────────────────────────────────────────────────────────
String pollESP() {
  while (espSerial.available()) espSerial.read();
  espSerial.listen();
  delay(3);
  espSerial.println("POLL");
  unsigned long t0 = millis();
  while (millis() - t0 < 200) { // 200ms suficiente a 9600 baud
    if (espSerial.available()) {
      delay(10);                // a 9600 baud la respuesta llega en ~5ms
      String r = espSerial.readStringUntil('\n');
      r.trim();
      String clean = "";
      for (int i = 0; i < (int)r.length(); i++) {
        char c = r[i]; if (c >= 32 && c < 127) clean += c;
      }
      mySerial.listen();
      return (clean == "NONE") ? "" : clean;
    }
  }
  mySerial.listen();
  return "";
}

// ── LOOP PRINCIPAL ────────────────────────────────────────────────────────────
void loop() {

  // ── A. Comandos por USB ───────────────────────────────────────────────────
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    procesarComando(cmd);
  }

  // ── B. Poll al ESP (modo WiFi) ────────────────────────────────────────────
  if (!enrollando && digitalRead(PIN_SWITCH) == LOW) {
    if (millis() - lastPoll >= POLL_INTERVAL) {
      lastPoll = millis();
      String cmd = pollESP();
      if (cmd.length() > 0) {
        Serial.println("CMD:[" + cmd + "]");
        procesarComando(cmd);
      }
    }
  }

  // ── C. RESTRICCIÓN DE REPOSO: SOLO LEER SI HAY SESIÓN, ENROLAMIENTO O TEST ──
  bool lecturaPermitida = sesionActiva || enrollando || modoTest;
  if (!lecturaPermitida) {
    return; // En reposo: NO escanear ni emitir sonidos
  }

  // ── D. Lectura Huella (ANTES del NFC para evitar que I2C tape el SoftwareSerial)
  if (!enrollando) {
    mySerial.listen();          // ceder el SoftwareSerial al AS608
    delay(5);                   // suficiente para estabilizar
    uint8_t imgResult = finger.getImage();

    if (imgResult == FINGERPRINT_OK) {
      erroresSensor = 0;
      Serial.println(F("[Huella] Dedo detectado..."));

      mySerial.listen();
      uint8_t tz = finger.image2Tz();

      if (tz == FINGERPRINT_OK) {
        if (modoTest) {
          // EN MODO DIAGNÓSTICO: CUALQUIER HUELLA DETECTADA ES ÉXITO
          enviarEvento("READ_FINGER:TEST_OK");
          sonidoHuella();
          esperarRetiroDedo(3000);
        } else {
          // EN MODO NORMAL DE ASISTENCIA: BUSCAR MATCH EN BD DEL SENSOR
          mySerial.listen();
          uint8_t fs = finger.fingerFastSearch();

          if (fs == FINGERPRINT_OK) {
            int fid = finger.fingerID;
            Serial.print(F("[Huella] Match! ID=")); Serial.println(fid);
            enviarEvento("READ_FINGER:" + String(fid));
            sonidoHuella();
            esperarRetiroDedo(5000);

          } else if (fs == FINGERPRINT_NOTFOUND) {
            Serial.println(F("[Huella] No reconocida"));
            sonidoError();
            esperarRetiroDedo(3000);

          } else {
            Serial.print(F("[Huella] Err busqueda: ")); Serial.println(fs);
            erroresSensor++;
            esperarRetiroDedo(1000);
          }
        }

      } else if (tz == FINGERPRINT_IMAGEMESS) {
        Serial.println(F("[Huella] Imagen borrosa"));
        esperarRetiroDedo(1500);

      } else {
        Serial.print(F("[Huella] Err image2Tz: ")); Serial.println(tz);
        erroresSensor++;
        esperarRetiroDedo(1000);
      }

    } else if (imgResult == FINGERPRINT_NOFINGER) {
      erroresSensor = 0; // sin dedo = estado limpio

    } else if (imgResult == FINGERPRINT_PACKETRECIEVEERR) {
      erroresSensor++;
      delay(150);
      if (erroresSensor >= MAX_ERRORES) reiniciarSensor();

    } else {
      erroresSensor++;
      delay(100);
      if (erroresSensor >= MAX_ERRORES) reiniciarSensor();
    }
  }

  // ── E. Lectura NFC (throttled + restaura mySerial después de I2C) ─────────
  if (!enrollando && millis() - lastNFC >= NFC_INTERVAL) {
    lastNFC = millis();
    uint8_t uid[7] = {0};
    uint8_t uidLen = 0;
    bool found = nfc_hardware.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen, 80);
    mySerial.listen();
    if (found) {
      enviarEvento("READ_NFC:" + hexUID(uid, uidLen));
      sonidoNFC();
      delay(400);
      nfc_hardware.SAMConfig();
      mySerial.listen();
      lastNFC = millis();
    }
  }
}

// ── PROCESAR COMANDO ──────────────────────────────────────────────────────────
void procesarComando(String cmd) {
  if (cmd.length() == 0) return;

  if (cmd == "SESSION ON") {
    sesionActiva = true;
    Serial.println(F("Sesion ACTIVA"));

  } else if (cmd == "SESSION OFF") {
    sesionActiva = false;
    Serial.println(F("Sesion INACTIVA"));

  } else if (cmd == "TEST_MODE_ON") {
    modoTest = true;
    Serial.println(F("Modo TEST ACTIVO"));
    sonidoEnrolamientoInicio();

  } else if (cmd == "TEST_MODE_OFF") {
    modoTest = false;
    Serial.println(F("Modo TEST INACTIVO"));

  } else if (cmd == "TEST_BUZZER") {
    Serial.println(F("Prueba de BUZZER"));
    sonidoEnrolamientoOK();

  } else if (cmd == "CLEAR_DB") {
    mySerial.listen();
    finger.emptyDatabase();
    Serial.println(F("BD borrada"));
    sonidoEnrolamientoOK();

  } else if (cmd.startsWith("ENROLL ") && !enrollando) {
    int idx = cmd.substring(7).toInt();
    if (idx > 0 && idx < 128) {
      enrollando = true;
      mySerial.listen();
      bool ok = enrolar(idx);
      delay(100);
      enviarEvento(ok
        ? "ENROLL_SUCCESS:" + String(idx)
        : "ENROLL_ERROR:Cancelado o fallo");
      enrollando = false;
    }

  } else if (cmd.startsWith("DELETE_FINGER ")) {
    int idx = cmd.substring(14).toInt();
    mySerial.listen();
    if (finger.deleteModel(idx) == FINGERPRINT_OK) {
      Serial.println(F("Huella eliminada"));
      sonidoEnrolamientoOK();
    } else {
      sonidoError();
    }
  }
}

// ── ENROLAMIENTO 2 CAPTURAS ───────────────────────────────────────────────────
bool enrolar(int id) {
  int p;

  sonidoEnrolamientoInicio();
  Serial.println(F("[1/2] PON EL DEDO"));
  unsigned long t = millis();
  do {
    mySerial.listen();
    delay(10);
    p = finger.getImage();
    if (millis() - t > 15000) { sonidoError(); return false; }
  } while (p != FINGERPRINT_OK);

  mySerial.listen();
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) { sonidoError(); return false; }

  // Verificar si la huella ya está registrada
  finger.getTemplateCount();
  if (finger.templateCount > 0) {
    mySerial.listen();
    if (finger.fingerFastSearch() == FINGERPRINT_OK) {
      Serial.println(F("Ya registrada"));
      sonidoError(); delay(1500); return false;
    }
  }

  beep(1400, 80); delay(50); beep(1400, 80);
  Serial.println(F("QUITA EL DEDO"));
  delay(500);
  esperarRetiroDedo(8000);

  sonidoEnrolamientoInicio();
  Serial.println(F("[2/2] PON EL MISMO DEDO"));
  t = millis();
  do {
    mySerial.listen();
    delay(10);
    p = finger.getImage();
    if (millis() - t > 15000) { sonidoError(); return false; }
  } while (p != FINGERPRINT_OK);

  mySerial.listen();
  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) { sonidoError(); return false; }

  mySerial.listen();
  p = finger.createModel();
  if (p != FINGERPRINT_OK) {
    Serial.println(F("No coinciden"));
    sonidoError(); delay(1000); return false;
  }

  mySerial.listen();
  p = finger.storeModel(id);
  if (p == FINGERPRINT_OK) {
    Serial.println("Guardada ID " + String(id));
    sonidoEnrolamientoOK();
    return true;
  }
  sonidoError();
  return false;
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────
String hexUID(uint8_t* uid, uint8_t len) {
  String s = "";
  for (uint8_t i = 0; i < len; i++) {
    if (i > 0) s += " ";
    if (uid[i] < 0x10) s += "0";
    s += String(uid[i], HEX);
  }
  s.toUpperCase();
  return s;
}
