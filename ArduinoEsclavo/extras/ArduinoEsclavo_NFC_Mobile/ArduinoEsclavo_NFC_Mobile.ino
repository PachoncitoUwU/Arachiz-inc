#include <Wire.h>
#include <Adafruit_PN532.h>

// --- CONFIGURACIÓN HARDWARE ---
// Adafruit_PN532 usando I2C por hardware
Adafruit_PN532 nfc((uint8_t)0, (uint8_t)0);

const int PIN_BUZZER = 6;

void setup(void) {
  Serial.begin(9600);
  Serial.println("Iniciando Arachiz NDEF Mobile Reader...");
  nfc.begin();
  
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("ERROR: No se encontro lector PN532");
  } else {
    Serial.print("PN532 OK v"); Serial.println((versiondata >> 16) & 0xFF, HEX);
    nfc.SAMConfig();
  }
}

void loop(void) {
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;
  
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100);
  
  if (success) {
    Serial.println("\nAcerca tu celular o tarjeta...");
    Serial.print("READ_NFC: ");
    for (uint8_t i = 0; i < uidLength; i++) {
      if (i > 0) Serial.print(" ");
      if (uid[i] < 0x10) Serial.print("0");
      Serial.print(uid[i], HEX);
    }
    Serial.println();
    
    // Sonido de éxito
    tone(PIN_BUZZER, 1000, 250);
    delay(1500);
  }
  delay(100);
}
