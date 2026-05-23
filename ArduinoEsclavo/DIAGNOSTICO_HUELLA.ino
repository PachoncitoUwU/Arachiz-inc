// =====================================================
// DIAGNOSTICO COMPLETO DEL SENSOR DE HUELLA AS608
// Sube esto al Arduino para verificar si el sensor
// funciona correctamente. Abre el Monitor Serial a 9600.
// =====================================================

#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// --- PINES DEL SENSOR ---
// Cambia estos si usas otros pines
const int PIN_RX = 2;  // Cable AMARILLO del sensor -> Pin 2 del Arduino
const int PIN_TX = 3;  // Cable BLANCO del sensor  -> Pin 3 del Arduino

SoftwareSerial mySerial(PIN_RX, PIN_TX);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

int fase = 0; // 0=diagnostico, 1=esperando dedo, 2=resultado

void setup() {
  Serial.begin(9600);
  delay(1000);

  Serial.println(F("\n============================================="));
  Serial.println(F("   DIAGNOSTICO SENSOR DE HUELLA AS608"));
  Serial.println(F("============================================="));
  Serial.println();

  // --- PASO 1: Verificar comunicacion ---
  Serial.println(F("[PASO 1] Verificando comunicacion..."));
  finger.begin(57600);
  delay(500);

  if (finger.verifyPassword()) {
    Serial.println(F("  ✓ Comunicacion OK - Sensor responde correctamente"));
  } else {
    Serial.println(F("  ✗ ERROR: El sensor NO responde"));
    Serial.println();
    Serial.println(F("  === REVISA LO SIGUIENTE ==="));
    Serial.println(F("  1. Cables bien conectados:"));
    Serial.println(F("     - VCC (rojo)     -> 5V del Arduino (NO 3.3V)"));
    Serial.println(F("     - GND (negro)    -> GND del Arduino"));
    Serial.println(F("     - TX  (amarillo) -> Pin 2 del Arduino"));
    Serial.println(F("     - RX  (blanco)   -> Pin 3 del Arduino"));
    Serial.println(F("  2. Que los cables no esten sueltos o haciendo"));
    Serial.println(F("     falso contacto en el conector"));
    Serial.println(F("  3. El sensor debe estar alimentado a 5V"));
    Serial.println(F("  4. Prueba intercambiar TX y RX (pines 2 y 3)"));
    Serial.println();
    Serial.println(F("  Reinicia el Arduino despues de revisar."));
    while (1) { delay(100); }
  }

  // --- PASO 2: Parametros del sensor ---
  Serial.println();
  Serial.println(F("[PASO 2] Leyendo parametros del sensor..."));
  finger.getParameters();
  Serial.print(F("  - Capacidad maxima: "));
  Serial.print(finger.capacity);
  Serial.println(F(" huellas"));
  Serial.print(F("  - Nivel de seguridad: "));
  Serial.println(finger.security_level);
  Serial.print(F("  - Direccion del sensor: 0x"));
  Serial.println(finger.device_addr, HEX);
  Serial.print(F("  - Tamanio de paquete: "));
  Serial.println(finger.packet_len);

  // --- PASO 3: Huellas almacenadas ---
  Serial.println();
  Serial.println(F("[PASO 3] Contando huellas almacenadas..."));
  finger.getTemplateCount();
  Serial.print(F("  - Huellas guardadas: "));
  Serial.println(finger.templateCount);

  if (finger.templateCount == 0) {
    Serial.println(F("  (No hay huellas - es normal si no has enrollado)"));
  }

  // --- PASO 4: Prueba de deteccion ---
  Serial.println();
  Serial.println(F("============================================="));
  Serial.println(F("[PASO 4] PRUEBA DE DETECCION EN VIVO"));
  Serial.println(F("============================================="));
  Serial.println(F("  Pon el dedo en el sensor..."));
  Serial.println(F("  (El LED del sensor deberia estar encendido)"));
  Serial.println(F("  Esperando 30 segundos maximo..."));
  Serial.println();

  fase = 1;
}

void loop() {
  if (fase != 1) return;

  static unsigned long inicio = millis();
  static bool primeraVez = true;

  // Timeout de 30 segundos
  if (millis() - inicio > 30000) {
    Serial.println();
    Serial.println(F("  ✗ TIMEOUT: No se detecto ningun dedo en 30s"));
    Serial.println(F("  Posibles causas:"));
    Serial.println(F("  - El sensor esta danado"));
    Serial.println(F("  - El dedo estaba muy seco o sucio"));
    Serial.println(F("  - El sensor no recibe suficiente voltaje"));
    Serial.println(F("  Reinicia para intentar de nuevo."));
    fase = 2;
    return;
  }

  int p = finger.getImage();

  if (p == FINGERPRINT_OK) {
    Serial.println(F("  ✓ DEDO DETECTADO - Imagen capturada!"));

    // Intentar convertir
    p = finger.image2Tz();
    if (p == FINGERPRINT_OK) {
      Serial.println(F("  ✓ Imagen convertida correctamente"));

      // Si hay huellas guardadas, intentar buscar
      if (finger.templateCount > 0) {
        p = finger.fingerFastSearch();
        if (p == FINGERPRINT_OK) {
          Serial.print(F("  ✓ HUELLA RECONOCIDA! ID: "));
          Serial.print(finger.fingerID);
          Serial.print(F("  Confianza: "));
          Serial.println(finger.confidence);
        } else {
          Serial.println(F("  - Huella NO reconocida (no esta registrada)"));
        }
      } else {
        Serial.println(F("  (No hay huellas para comparar - enrolla primero)"));
      }
    } else {
      Serial.print(F("  ✗ Error al convertir imagen. Codigo: "));
      Serial.println(p);
    }

    Serial.println();
    Serial.println(F("============================================="));
    Serial.println(F("  DIAGNOSTICO COMPLETO"));
    Serial.println(F("  Si llegaste aqui, el sensor FUNCIONA."));
    Serial.println(F("  Pon otro dedo o reinicia para repetir."));
    Serial.println(F("============================================="));

    delay(3000);
    inicio = millis(); // reiniciar timeout para otra lectura
    Serial.println();
    Serial.println(F("  Esperando otro dedo..."));

  } else if (p == FINGERPRINT_NOFINGER) {
    // Normal, no hay dedo
    if (primeraVez || (millis() - inicio) % 5000 < 50) {
      // Imprimir punto cada 5 segundos para mostrar que sigue vivo
      if (!primeraVez) Serial.print(F("."));
      primeraVez = false;
    }
  } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println(F("  ✗ ERROR de comunicacion - revisa cables"));
  } else {
    Serial.print(F("  ✗ Error desconocido: "));
    Serial.println(p);
  }
}
