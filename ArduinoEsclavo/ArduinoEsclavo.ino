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
const int PIN_BUZZER2 = 5;  // Segundo pin para modo puente (mas volumen)
const int PIN_SWITCH = 7;
const int PIN_RX_ESP = 8;
const int PIN_TX_ESP = 9;

// Comunicación con ESP8266
SoftwareSerial espSerial(PIN_RX_ESP, PIN_TX_ESP);

// --- PROTOTIPOS ---
void sonidoNFC();
void sonidoHuella();
void sonidoEnrolamiento();
void sonidoError();
bool enrolar(int id);
String hexUID(uint8_t* uid, uint8_t len);
void enviarEvento(String msg);

void setup() {
  Serial.begin(9600);
  espSerial.begin(9600);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BUZZER2, OUTPUT);
  digitalWrite(PIN_BUZZER2, LOW);
  pinMode(PIN_SWITCH, INPUT_PULLUP);

  Serial.println(F("\n-------------------------------------------"));
  Serial.println(F("SISTEMA ARACHIZ - MODO ESCLAVO V7.1"));
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
    espSerial.println("MODO:RENDER|" + msg);
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
      sonidoEnrolamiento();
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
    sonidoNFC();
    delay(500);
    nfc_hardware.SAMConfig();
  }

  // 3. Lectura Huella
  mySerial.listen();
  if (finger.getImage() == FINGERPRINT_OK) {
    if (finger.image2Tz() == FINGERPRINT_OK) {
      if (finger.fingerFastSearch() == FINGERPRINT_OK) {
        enviarEvento("READ_FINGER: " + String(finger.fingerID));
        sonidoHuella();
        delay(500);
      } else {
        Serial.println("DEBUG: Huella no reconocida por el sensor");
        sonidoError();
        delay(500);
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

  bridgeTone(1200, 150);
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
      sonidoEnrolamiento();
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

// --- FUNCION DE TONO EN MODO PUENTE (2x VOLUMEN) ---
// Genera el tono manualmente alternando 2 pines en fase opuesta
// Esto duplica el voltaje efectivo en el altavoz (10Vpp vs 5Vpp)
void bridgeTone(int freq, unsigned long duracion) {
  unsigned long periodo = 1000000UL / freq;  // microsegundos
  unsigned long mitad = periodo / 2;
  unsigned long inicio = millis();

  while (millis() - inicio < duracion) {
    digitalWrite(PIN_BUZZER, HIGH);
    digitalWrite(PIN_BUZZER2, LOW);
    delayMicroseconds(mitad);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_BUZZER2, HIGH);
    delayMicroseconds(mitad);
  }
  // Apagar ambos pines al terminar
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_BUZZER2, LOW);
}

void sonidoNFC() {
  bridgeTone(1000, 250);
  delay(50);
  bridgeTone(1400, 250);
}

void sonidoHuella() {
  bridgeTone(900, 200);
  delay(50);
  bridgeTone(1200, 200);
  delay(50);
  bridgeTone(1500, 200);
}

void sonidoEnrolamiento() {
  bridgeTone(1000, 200);
  delay(50);
  bridgeTone(1300, 200);
  delay(50);
  bridgeTone(1600, 300);
}

void sonidoError() {
  bridgeTone(400, 400);
  delay(100);
  bridgeTone(400, 400);
}
