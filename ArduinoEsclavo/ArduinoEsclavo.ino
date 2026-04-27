#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// --- CONFIGURACIÓN HARDWARE ---
PN532_I2C pn532_i2c(Wire);
PN532 nfc_hardware(pn532_i2c);
SoftwareSerial mySerial(2, 3);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

const int PIN_BUZZER = 6;
const int PIN_SWITCH = 7;
const int PIN_RX_ESP = 8;
const int PIN_TX_ESP = 9;  // Via divisor de tensión hacia ESP8266 D2

// Comunicación con ESP8266
SoftwareSerial espSerial(PIN_RX_ESP, PIN_TX_ESP); // RX, TX

// --- PROTOTIPOS ---
void sonidoExito();
void sonidoError();
bool enrolar(int id);
String hexUID(uint8_t* uid, uint8_t len);
void enviarEvento(String msg);

void setup() {
  Serial.begin(9600);
  espSerial.begin(9600);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_SWITCH, INPUT_PULLUP);

  Serial.println(F("\n-------------------------------------------"));
  Serial.println(F("SISTEMA ARACHIZ - MODO ESCLAVO V7.0"));
  Serial.println(F("-------------------------------------------"));

  Serial.println(F("DEBUG: Iniciando NFC..."));
  nfc_hardware.begin();
  uint32_t versiondata = nfc_hardware.getFirmwareVersion();
  if (!versiondata) {
    Serial.println(F("ERROR: Sensor NFC PN532 no encontrado."));
  } else {
    Serial.print(F("DEBUG: NFC OK - Firmware v"));
    Serial.println((versiondata >> 16) & 0xFF);
    nfc_hardware.SAMConfig();
  }

  Serial.println(F("DEBUG: Iniciando sensor de huella..."));
  finger.begin(57600);
  if (finger.verifyPassword()) {
    Serial.println(F("DEBUG: Huella OK"));
  } else {
    Serial.println(F("ERROR: Sensor de huella no encontrado."));
  }

  bool modoESP = (digitalRead(PIN_SWITCH) == LOW);
  Serial.println(modoESP ? F("MODO: ESP8266 (WiFi)") : F("MODO: USB (Local)"));
  Serial.println(F("-------------------------------------------"));
}

// Envía el evento al destino correcto según el switch
void enviarEvento(String msg) {
  bool modoESP = (digitalRead(PIN_SWITCH) == LOW);
  if (modoESP) {
    espSerial.listen();
    espSerial.println(msg);
  } else {
    Serial.println(msg);
  }
}

void loop() {
  // 1. Escuchar comandos desde Node.js (solo en modo USB)
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();
    if (comando == "CLEAR_DB") {
      mySerial.listen();
      finger.emptyDatabase();
      Serial.println("DEBUG: Base de datos borrada con exito");
      sonidoExito();
    } else if (comando.startsWith("ENROLL ")) {
      int idx = comando.substring(7).toInt();
      if (idx > 0 && idx < 128) {
        Serial.print("DEBUG: Iniciando enrolamiento en ID ");
        Serial.println(idx);
        mySerial.listen();
        bool res = enrolar(idx);
        if (res) {
          Serial.print("ENROLL_SUCCESS: ");
          Serial.println(idx);
        } else {
          Serial.println("ENROLL_ERROR: Cancelado o fallo");
        }
      }
    }
  }

  // 2. Lectura NFC
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  success = nfc_hardware.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);

  if (success) {
    String uid_str = hexUID(uid, uidLength);
    enviarEvento("READ_NFC: " + uid_str);
    sonidoExito();
    delay(1000);
    nfc_hardware.SAMConfig();
  }

  // 3. Lectura Huella
  mySerial.listen();
  if (finger.getImage() == FINGERPRINT_OK) {
    if (finger.image2Tz() == FINGERPRINT_OK) {
      if (finger.fingerFastSearch() == FINGERPRINT_OK) {
        enviarEvento("READ_FINGER: " + String(finger.fingerID));
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

// --- FUNCIÓN DE ENROLAMIENTO ---
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
      Serial.println(F("ENROLL_ERROR: Esta huella ya esta registrada."));
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
      enviarEvento("ENROLL_SUCCESS: " + String(id));
      return true;
    }
  }

  Serial.println(F("ENROLL_ERROR: Las huellas no coinciden."));
  sonidoError();
  delay(1000);
  return false;
}

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
void sonidoError() { tone(PIN_BUZZER, 500, 300); delay(100); tone(PIN_BUZZER, 500, 300); }
