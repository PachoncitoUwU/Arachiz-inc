#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <NfcAdapter.h> // Requiere instalar la librería NDEF (Don/NDEF)

// --- CONFIGURACIÓN HARDWARE ---
PN532_I2C pn532_i2c(Wire);
NfcAdapter nfc = NfcAdapter(pn532_i2c);

const int PIN_BUZZER = 6;

void setup(void) {
  Serial.begin(9600);
  Serial.println("Iniciando Arachiz NDEF Mobile Reader...");
  nfc.begin();
}

void loop(void) {
  Serial.println("\nAcerca tu celular o tarjeta...");
  
  if (nfc.tagPresent()) {
    NfcTag tag = nfc.read();
    
    // Si tiene un mensaje NDEF (Celular o Tarjeta NDEF)
    if (tag.hasNdefMessage()) {
      NdefMessage message = tag.getNdefMessage();
      
      // Leer el primer registro del mensaje NDEF
      NdefRecord record = message.getRecord(0);
      int payloadLength = record.getPayloadLength();
      byte payload[payloadLength];
      record.getPayload(payload);
      
      String payloadAsString = "";
      for (int c = 0; c < payloadLength; c++) {
        payloadAsString += (char)payload[c];
      }
      
      // El payload trae un código de lenguaje (ej. "en" o "es") al inicio, lo limpiamos
      String uid_celular = payloadAsString.substring(3);
      
      Serial.print("READ_NFC_MOBILE: ");
      Serial.println(uid_celular);
      
      // Sonido de éxito
      tone(PIN_BUZZER, 1000, 250);
      
    } else {
      // Es una tarjeta normal sin NDEF, leemos el UID clásico
      String uid_str = tag.getUidString();
      uid_str.replace(" ", ""); // Quitar espacios
      
      Serial.print("READ_NFC_CLASSIC: ");
      Serial.println(uid_str);
      
      // Sonido de éxito
      tone(PIN_BUZZER, 1000, 250);
    }
    
    delay(2000); // Esperar antes de la siguiente lectura
  }
  delay(100);
}
