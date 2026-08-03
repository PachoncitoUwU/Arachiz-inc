// Sketch de prueba para el sensor de huella AS608
// Sube esto al Arduino para probar si el sensor funciona

#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

SoftwareSerial mySerial(2, 3);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(9600);
  finger.begin(57600);

  Serial.println("\n=== TEST SENSOR DE HUELLA ===");
  
  if (finger.verifyPassword()) {
    Serial.println("Sensor encontrado!");
  } else {
    Serial.println("ERROR: Sensor no encontrado");
    while (1) { delay(1); }
  }

  Serial.print("Capacidad: ");
  Serial.println(finger.templateCount);
  
  Serial.print("Huellas almacenadas: ");
  finger.getTemplateCount();
  Serial.println(finger.templateCount);

  Serial.println("\n=== PRUEBA DE ENROLAMIENTO EN ID 1 ===");
  Serial.println("Coloca el dedo...");
}

void loop() {
  int p = -1;
  
  // Esperar dedo
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
  }
  Serial.println("Imagen capturada!");

  // Convertir imagen 1
  p = finger.image2Tz(1);
  Serial.print("Conversion imagen 1: ");
  Serial.println(p == FINGERPRINT_OK ? "OK" : "ERROR codigo " + String(p));
  
  if (p != FINGERPRINT_OK) {
    delay(2000);
    return;
  }

  Serial.println("Quita el dedo...");
  delay(2000);
  
  while (finger.getImage() != FINGERPRINT_NOFINGER);
  Serial.println("Dedo quitado. Pon el mismo dedo otra vez...");

  // Esperar segundo dedo
  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
  }
  Serial.println("Segunda imagen capturada!");

  // Convertir imagen 2
  p = finger.image2Tz(2);
  Serial.print("Conversion imagen 2: ");
  Serial.println(p == FINGERPRINT_OK ? "OK" : "ERROR codigo " + String(p));
  
  if (p != FINGERPRINT_OK) {
    delay(2000);
    return;
  }

  // Crear modelo
  Serial.print("Creando modelo... ");
  p = finger.createModel();
  
  if (p == FINGERPRINT_OK) {
    Serial.println("EXITO!");
  } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("ERROR: Error de comunicacion");
  } else if (p == FINGERPRINT_ENROLLMISMATCH) {
    Serial.println("ERROR: Las huellas no coinciden");
  } else {
    Serial.print("ERROR desconocido: ");
    Serial.println(p);
  }

  // Guardar
  if (p == FINGERPRINT_OK) {
    p = finger.storeModel(1);
    Serial.print("Guardando en ID 1: ");
    Serial.println(p == FINGERPRINT_OK ? "EXITO TOTAL!" : "ERROR al guardar");
  }

  Serial.println("\n=== Reinicia el Arduino para probar de nuevo ===\n");
  while(1);
}
