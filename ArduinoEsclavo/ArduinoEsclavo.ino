// Deshabilitar watchdog al inicio para evitar loop de resets
#include <avr/wdt.h>
void wdt_init(void) __attribute__((naked)) __attribute__((section(".init3")));
void wdt_init(void) { wdt_disable(); }

#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// ── HARDWARE ──────────────────────────────────────────────────────────────────
PN532_I2C pn532_i2c(Wire);
PN532 nfc_hardware(pn532_i2c);

SoftwareSerial mySerial(2, 3);   // AS608 huella: RX=2, TX=3
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
SoftwareSerial espSerial(8, 9);  // ESP8266: RX=8, TX=9

const int PIN_BUZZER  = 6;
const int PIN_BUZZER2 = 5;
const int PIN_SWITCH  = 7;  // LOW=WiFi | HIGH=USB

// ── ESTADO ────────────────────────────────────────────────────────────────────
bool sesionActiva = false;
bool enrollando   = false;
unsigned long lastPoll = 0;
const unsigned long POLL_INTERVAL = 600;

// ── PROTOTIPOS ────────────────────────────────────────────────────────────────
void   sonidoNFC();
void   sonidoHuella();
void   sonidoEnrolamientoInicio();
void   sonidoEnrolamientoOK();
void   sonidoError();
bool   enrolar(int id);
String hexUID(uint8_t* uid, uint8_t len);
void   enviarEvento(String msg);
void   bridgeTone(int freq, unsigned long dur);
void   procesarComando(String cmd);
String pollESP();
void   esperarRetiroDedo(unsigned long timeoutMs);

// ── SETUP ─────────────────────────────────────────────────────────────────────
void setup() {
  wdt_disable();

  Serial.begin(9600);
  espSerial.begin(4800);

  pinMode(PIN_BUZZER,  OUTPUT);
  pinMode(PIN_BUZZER2, OUTPUT);
  digitalWrite(PIN_BUZZER2, LOW);
  pinMode(PIN_SWITCH, INPUT_PULLUP);

  delay(100);

  Serial.println(F("\n========================================="));
  Serial.println(F(" ARACHIZ - MODO ESCLAVO V10.3"));
  Serial.println(F("========================================="));

  Wire.begin();
  nfc_hardware.begin();
  delay(50);
  uint32_t ver = nfc_hardware.getFirmwareVersion();
  if (!ver) {
    Serial.println(F("ERROR: NFC no encontrado"));
  } else {
    Serial.print(F("NFC OK v")); Serial.println((ver >> 16) & 0xFF);
    nfc_hardware.SAMConfig();
  }

  mySerial.listen();
  finger.begin(57600);
  delay(50);
  if (finger.verifyPassword()) {
    Serial.println(F("Huella AS608 OK"));
  } else {
    Serial.println(F("ERROR: Sensor huella no encontrado"));
  }

  Serial.println(digitalRead(PIN_SWITCH) == LOW ? F("MODO: WiFi") : F("MODO: USB"));
  Serial.println(F("========================================="));
}

// ── ENVIAR EVENTO ─────────────────────────────────────────────────────────────
// NOTA: en modo WiFi el sonido ya se tocó ANTES de llamar esta función,
// porque espSerial.listen() desactiva mySerial (SoftwareSerial exclusivo)
void enviarEvento(String msg) {
  if (digitalRead(PIN_SWITCH) == LOW) {
    espSerial.listen();
    delay(10);
    espSerial.println("EVT:" + msg);
    // Esperar a que el ESP reciba todos los bytes (a 4800 baud, ~2ms/byte)
    // "EVT:READ_FINGER:128\n" = ~22 bytes → ~46ms mínimo
    delay(60);
    Serial.println("WiFi -> " + msg);
    // Volver a escuchar el AS608 para no dejarlo huérfano
    mySerial.listen();
  } else {
    Serial.println(msg);
  }
}

// ── ESPERAR RETIRO DE DEDO ────────────────────────────────────────────────────
// Función auxiliar: siempre activa mySerial antes de preguntar al AS608
void esperarRetiroDedo(unsigned long timeoutMs) {
  unsigned long t0 = millis();
  uint8_t estado;
  do {
    mySerial.listen();
    delay(60);
    estado = finger.getImage();
  } while (estado != FINGERPRINT_NOFINGER && millis() - t0 < timeoutMs);
  delay(120); // estabilización final del sensor
}

// ── POLL AL ESP ───────────────────────────────────────────────────────────────
String pollESP() {
  espSerial.listen();
  delay(5);
  espSerial.println("POLL");
  unsigned long t0 = millis();
  while (millis() - t0 < 300) {
    if (espSerial.available()) {
      delay(20);
      String r = espSerial.readStringUntil('\n');
      r.trim();
      String clean = "";
      for (int i = 0; i < (int)r.length(); i++) {
        char c = r[i]; if (c >= 32 && c < 127) clean += c;
      }
      mySerial.listen(); // restaurar escucha al AS608
      return (clean == "NONE") ? "" : clean;
    }
  }
  mySerial.listen(); // restaurar escucha al AS608
  return "";
}

// ── LOOP PRINCIPAL ────────────────────────────────────────────────────────────
// ORDEN CRÍTICO:
//   1. Comandos USB   (inmediato, sin bloqueo)
//   2. Huella         (mySerial.listen() activo, SIN competencia con espSerial)
//   3. Poll ESP       (solo WiFi, usa espSerial brevemente y restaura mySerial)
//   4. NFC            (ÚLTIMO: I2C bloquea ~25ms)
void loop() {

  // ── A. Comandos por USB ───────────────────────────────────────────────────
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    procesarComando(cmd);
  }

  // ── B. Lectura Huella ────────────────────────────────────────────────────
  if (!enrollando && sesionActiva) {
    mySerial.listen();
    uint8_t imgResult = finger.getImage();

    if (imgResult == FINGERPRINT_OK) {
      Serial.println(F("[Huella] Dedo detectado, procesando..."));

      if (finger.image2Tz() == FINGERPRINT_OK) {

        if (finger.fingerFastSearch() == FINGERPRINT_OK) {
          int fid = finger.fingerID;
          Serial.print(F("[Huella] Match! ID=")); Serial.println(fid);

          // PRIMERO sonar (mySerial aún activo, bridgeTone no usa serial)
          sonidoHuella();

          // LUEGO enviar (en WiFi esto cambia el listen, por eso sonamos antes)
          enviarEvento("READ_FINGER:" + String(fid));

          // Esperar que el dedo se retire
          esperarRetiroDedo(4000);

        } else {
          Serial.println(F("[Huella] No reconocida"));
          sonidoError();
          esperarRetiroDedo(3000);
        }

      } else {
        Serial.println(F("[Huella] Error convirtiendo imagen"));
        esperarRetiroDedo(2000);
      }
    }
    // FINGERPRINT_NOFINGER es normal → no hacer nada
  }

  // ── C. Poll al ESP (modo WiFi) ────────────────────────────────────────────
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

  // ── D. Lectura NFC (VA AL FINAL — su timeout I2C bloquea el CPU ~25ms) ───
  if (!enrollando) {
    uint8_t uid[7] = {0};
    uint8_t uidLen = 0;
    if (nfc_hardware.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen, 25)) {
      sonidoNFC();                                    // sonar ANTES de enviar
      enviarEvento("READ_NFC:" + hexUID(uid, uidLen));
      delay(400);
      nfc_hardware.SAMConfig();
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

  // Captura 1
  sonidoEnrolamientoInicio();
  Serial.println(F("[1/2] PON EL DEDO"));
  unsigned long t = millis();
  do {
    mySerial.listen();
    p = finger.getImage();
    if (millis() - t > 15000) { sonidoError(); return false; }
  } while (p != FINGERPRINT_OK);

  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) { sonidoError(); return false; }

  finger.getTemplateCount();
  if (finger.templateCount > 0 && finger.fingerFastSearch() == FINGERPRINT_OK) {
    Serial.println(F("Ya registrada"));
    sonidoError(); delay(1500); return false;
  }

  bridgeTone(1400, 100); delay(70); bridgeTone(1400, 100);
  Serial.println(F("QUITA EL DEDO"));
  delay(600);
  esperarRetiroDedo(8000);

  // Captura 2
  sonidoEnrolamientoInicio();
  Serial.println(F("[2/2] PON EL MISMO DEDO"));
  t = millis();
  do {
    mySerial.listen();
    p = finger.getImage();
    if (millis() - t > 15000) { sonidoError(); return false; }
  } while (p != FINGERPRINT_OK);

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) { sonidoError(); return false; }

  p = finger.createModel();
  if (p != FINGERPRINT_OK) {
    Serial.println(F("No coinciden"));
    sonidoError(); delay(1000); return false;
  }

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

void bridgeTone(int freq, unsigned long dur) {
  unsigned long per = 1000000UL / freq, half = per / 2;
  unsigned long t0 = millis();
  while (millis() - t0 < dur) {
    digitalWrite(PIN_BUZZER, HIGH); digitalWrite(PIN_BUZZER2, LOW);
    delayMicroseconds(half);
    digitalWrite(PIN_BUZZER, LOW);  digitalWrite(PIN_BUZZER2, HIGH);
    delayMicroseconds(half);
  }
  digitalWrite(PIN_BUZZER, LOW); digitalWrite(PIN_BUZZER2, LOW);
}

void sonidoNFC()               { bridgeTone(1000,180); delay(40); bridgeTone(1500,180); }
void sonidoHuella()            { bridgeTone(900,130); delay(35); bridgeTone(1200,130); delay(35); bridgeTone(1600,180); }
void sonidoEnrolamientoInicio(){ bridgeTone(800,90);  delay(55); bridgeTone(1100,180); }
void sonidoEnrolamientoOK()    { bridgeTone(1000,110); delay(45); bridgeTone(1300,110); delay(45); bridgeTone(1600,110); delay(45); bridgeTone(2000,280); }
void sonidoError()             { bridgeTone(320,320); delay(75); bridgeTone(320,320); }
