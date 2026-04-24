// ============================================================
//  ARACHIZ - Arduino UNO (Esclavo de Sensores) V7.0
//  Sensores: AS608 (huella) + PN532 (NFC)
//  Comunicación: Hardware Serial → ESP8266
//  Buzzer: Pin 9
// ============================================================
#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// --- HARDWARE ---
// AS608 en pines D2(RX) y D3(TX) → SoftwareSerial (no usa el Serial0 del USB)
SoftwareSerial mySerial(2, 3);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// PN532 por I2C: SDA → A4, SCL → A5
PN532_I2C pn532_i2c(Wire);
PN532 nfc_hardware(pn532_i2c);

// Buzzer en pin 9
const int PIN_BUZZER = 9;

// --- PROTOTIPOS ---
void sonidoExito();
void sonidoError();
bool enrolar(int id);
String hexUID(uint8_t* uid, uint8_t len);
void escucharComandos();

void setup() {
  // Serial0 (pines 0 y 1) → comunicación con ESP8266
  // Misma velocidad que el ESP8266 usa para escuchar
  Serial.begin(9600);
  pinMode(PIN_BUZZER, OUTPUT);

  // Inicializar NFC
  nfc_hardware.begin();
  nfc_hardware.SAMConfig();

  // Inicializar huella
  finger.begin(57600);

  // Avisar al ESP8266 que el Arduino arrancó
  Serial.println("ARDUINO_READY");
}

void loop() {
  // 1. Escuchar comandos del ESP8266 (que a su vez vienen del backend/Vercel)
  escucharComandos();

  // 2. Lectura NFC
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;
  bool success = nfc_hardware.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);

  if (success) {
    String uid_str = hexUID(uid, uidLength);
    Serial.print("READ_NFC: ");
    Serial.println(uid_str);
    sonidoExito();
    delay(1000);
    nfc_hardware.SAMConfig();
  }

  // 3. Lectura Huella
  if (finger.getImage() == FINGERPRINT_OK) {
    if (finger.image2Tz() == FINGERPRINT_OK) {
      if (finger.fingerFastSearch() == FINGERPRINT_OK) {
        Serial.print("READ_FINGER: ");
        Serial.println(finger.fingerID);
        sonidoExito();
        delay(1000);
      } else {
        Serial.println("DEBUG: Huella no reconocida por el sensor");
        sonidoError();
        delay(1000);
      }
    }
  }
}

// --- Escuchar comandos del ESP8266 (mismo protocolo que antes) ---
void escucharComandos() {
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();

    if (comando == "CLEAR_DB") {
      finger.emptyDatabase();
      Serial.println("DEBUG: Base de datos borrada con exito");
      sonidoExito();

    } else if (comando.startsWith("ENROLL ")) {
      int idx = comando.substring(7).toInt();
      if (idx > 0 && idx < 128) {
        Serial.print("DEBUG: Iniciando enrolamiento en ID ");
        Serial.println(idx);
        bool res = enrolar(idx);
        if (res) {
          Serial.print("ENROLL_SUCCESS: ");
          Serial.println(idx);
        } else {
          Serial.println("ENROLL_ERROR: Cancelado o falló");
        }
      }
    }
  }
}

// --- ENROLAMIENTO ---
bool enrolar(int id) {
  int p = -1;
  Serial.println(F("DEBUG: COLOQUE EL DEDO..."));
  unsigned long start = millis();
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (millis() - start > 15000) {
      Serial.println(F("ENROLL_ERROR: Tiempo agotado (15s)."));
      sonidoError();
      return false;
    }
  }

  p = finger.image2Tz(1);
  if (p == FINGERPRINT_OK) {
    p = finger.fingerFastSearch();
    if (p == FINGERPRINT_OK) {
      Serial.println(F("ENROLL_ERROR: Esta huella ya está registrada."));
      sonidoError();
      delay(2000);
      return false;
    }
  }

  tone(PIN_BUZZER, 2000, 150);
  Serial.println(F("DEBUG: QUITE EL DEDO..."));
  delay(1000);
  start = millis();
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    if (millis() - start > 10000) break;
  }

  p = -1;
  Serial.println(F("DEBUG: COLOQUE EL MISMO DEDO OTRA VEZ..."));
  start = millis();
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (millis() - start > 15000) {
      Serial.println(F("ENROLL_ERROR: Tiempo agotado (15s)."));
      sonidoError();
      return false;
    }
  }

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println(F("ENROLL_ERROR: Error al procesar imagen 2."));
    sonidoError();
    return false;
  }

  if (finger.createModel() == FINGERPRINT_OK) {
    if (finger.storeModel(id) == FINGERPRINT_OK) {
      tone(PIN_BUZZER, 2000, 200);
      return true;
    }
  }

  Serial.println(F("ENROLL_ERROR: Las huellas no coinciden."));
  sonidoError();
  delay(1000);
  return false;
}

// --- UTILIDADES ---
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

void sonidoExito() { tone(PIN_BUZZER, 2500, 400); }
void sonidoError()  { tone(PIN_BUZZER, 500, 300); delay(100); tone(PIN_BUZZER, 500, 300); }
