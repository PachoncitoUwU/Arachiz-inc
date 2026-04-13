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

const int PIN_BUZZER = 9;

// --- PROTOTIPOS ---
void sonidoExito();
void sonidoError();
bool enrolar(int id);
String hexUID(uint8_t* uid, uint8_t len);

bool isStandby = true; // Inicia ahorrando energía

void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUZZER, OUTPUT);
  nfc_hardware.begin();
  nfc_hardware.SAMConfig();
  finger.begin(57600);

  Serial.println(F("\n-------------------------------------------"));
  Serial.println(F("SISTEMA ARACHIZ - MODO ESCLAVO V6.0"));
  Serial.println(F("ESPERANDO COMANDOS O LECTURAS..."));
  Serial.println(F("-------------------------------------------"));
}

void loop() {
  // 1. Escuchar Comandos Seriales de Node.js
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();
    if (comando == "SESSION ON") {
      isStandby = false;
      Serial.println("DEBUG: Sesion activa - Sensores ENCENDIDOS");
    } else if (comando == "SESSION OFF") {
      isStandby = true;
      Serial.println("DEBUG: Sesion finalizada - Sensores en STANDBY");
    } else if (comando.startsWith("ENROLL ")) {
      int idx = comando.substring(7).toInt();
      if (idx > 0 && idx < 128) {
        Serial.print("DEBUG: Iniciando enrolamiento en ID ");
        Serial.println(idx);
        bool res = enrolar(idx);
        if(res){
           Serial.print("ENROLL_SUCCESS: ");
           Serial.println(idx);
        } else {
           Serial.println("ENROLL_ERROR: Cancelado o falló");
        }
      }
    }
  }

  // Ahorro de Energía: Si no hay clase activa, no leer sensores
  if (isStandby) {
    delay(200); 
    return;
  }

  // 2. Lectura NFC
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 }; 
  uint8_t uidLength;

  success = nfc_hardware.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);

  if (success) {
    String uid_str = hexUID(uid, uidLength);
    Serial.print("READ_NFC: ");
    Serial.println(uid_str);
    sonidoExito();
    delay(1000); // Evita lecturas múltiples del mismo sticker
    nfc_hardware.SAMConfig(); // Reinicia el sensor
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

// --- FUNCIÓN DE ENROLAMIENTO (Invocada por Node.js) ---
bool enrolar(int id) {
  int p = -1;
  Serial.println(F("DEBUG: COLOQUE EL DEDO..."));
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    // Validar si envian comando cancelar por serial... se omite por simplicidad
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
  while (finger.getImage() != FINGERPRINT_NOFINGER);
  
  p = -1;
  Serial.println(F("DEBUG: COLOQUE EL MISMO DEDO OTRA VEZ..."));
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
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

String hexUID(uint8_t* uid, uint8_t len) {
  String s = "";
  for (uint8_t i=0; i < len; i++) {
    if (i > 0) s += " ";
    if (uid[i] < 0x10) s += "0";
    s += String(uid[i], HEX);
  }
  s.toUpperCase();
  return s;
}

void sonidoExito() { tone(PIN_BUZZER, 2500, 400); }
void sonidoError() { tone(PIN_BUZZER, 500, 300); delay(100); tone(PIN_BUZZER, 500, 300); }
