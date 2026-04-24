// ============================================================
//  ARACHIZ - ESP8266 (Maestro WiFi) V1.0
//  Módulo: ESP8266 con OLED 0.96" SSD1306 (I2C)
//  Rol: Puente entre Arduino UNO ↔ Backend Render ↔ Vercel
//
//  Librerías necesarias (instalar en Arduino IDE):
//    - ESP8266WiFi        (viene con el board ESP8266)
//    - ESP8266HTTPClient  (viene con el board ESP8266)
//    - ArduinoJson        (instalar desde Library Manager v7.x)
//    - Adafruit SSD1306   (instalar desde Library Manager)
//    - Adafruit GFX       (instalar desde Library Manager)
// ============================================================
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>

// ─── CONFIGURACIÓN ─────────────────────────────────────────
// ¡CAMBIA ESTOS VALORES!
const char* WIFI_SSID     = "TU_WIFI_NOMBRE";
const char* WIFI_PASSWORD = "TU_WIFI_CLAVE";
const char* BACKEND_URL   = "https://tu-backend.onrender.com";

// Cambia este token al JWT de un instructor activo.
// Más adelante puedes hacer esto dinámico desde el frontend.
const char* AUTH_TOKEN    = "Bearer TU_JWT_TOKEN_INSTRUCTOR";

// ID de la sesión de asistencia activa (lo actualiza el frontend)
// El ESP8266 lo recibirá vía Serial con el comando: SESSION_ID:123
int SESSION_ID = 0;
// ───────────────────────────────────────────────────────────

// OLED: 128x64, dirección I2C 0x3C
// Tu módulo v2.1.2: SCL → D5 (GPIO12), SDA → D6 (GPIO14)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Serial software para hablar con el Arduino UNO
// RX del ESP8266 → Pin D2 (GPIO4) → conectar a TX (pin1) del Arduino
// TX del ESP8266 → Pin D3 (GPIO0) → conectar a RX (pin0) del Arduino
// ¡OJO! Poner resistencia 1kΩ en la línea TX del ESP8266 → RX del Arduino
SoftwareSerial arduinoSerial(4, 0); // RX=D2(GPIO4), TX=D3(GPIO0)

// ─── FUNCIONES DE PANTALLA ─────────────────────────────────
void mostrarOLED(String linea1, String linea2 = "", String linea3 = "") {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(linea1);
  display.setTextSize(1);
  if (linea2 != "") {
    display.setCursor(0, 20);
    display.println(linea2);
  }
  if (linea3 != "") {
    display.setCursor(0, 32);
    display.println(linea3);
  }
  display.display();
}

// ─── SETUP ─────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);        // Debug via USB (opcional)
  arduinoSerial.begin(9600); // Comunicación con Arduino UNO

  // Pines reales de tu módulo ESP8266 OLED v2.1.2
  Wire.begin(14, 12); // SDA=D6(GPIO14), SCL=D5(GPIO12)
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();

  // Pantalla de bienvenida — solo muestra ARACHIZ
  mostrarOLED("ARACHIZ");
  delay(2000);

  // Conectar WiFi
  mostrarOLED("ARACHIZ", "Conectando", "WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 30) {
    delay(500);
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    mostrarOLED("ARACHIZ", "WiFi OK", WiFi.localIP().toString());
    delay(2000);
  } else {
    mostrarOLED("ARACHIZ", "Sin WiFi", "Solo local");
    delay(2000);
  }

  mostrarOLED("ARACHIZ");
}

// ─── LOOP PRINCIPAL ────────────────────────────────────────
void loop() {
  // Leer lo que manda el Arduino UNO por Serial
  if (arduinoSerial.available() > 0) {
    String msg = arduinoSerial.readStringUntil('\n');
    msg.trim();

    Serial.println("[Arduino]: " + msg); // Log USB para debug

    if (msg.startsWith("READ_NFC: ")) {
      String uid = msg.substring(10);
      procesarNFC(uid);

    } else if (msg.startsWith("READ_FINGER: ")) {
      int fingerId = msg.substring(13).toInt();
      procesarHuella(fingerId);

    } else if (msg.startsWith("ENROLL_SUCCESS: ")) {
      mostrarOLED("ARACHIZ", "Huella", "Guardada OK");
      delay(2000);
      mostrarOLED("ARACHIZ");

    } else if (msg.startsWith("ENROLL_ERROR: ")) {
      String err = msg.substring(14);
      mostrarOLED("ARACHIZ", "Error:", err.substring(0, 16));
      delay(2000);
      mostrarOLED("ARACHIZ");

    } else if (msg.startsWith("DEBUG: ")) {
      // Solo mostrar brevemente mensajes de proceso
      String dbg = msg.substring(7);
      mostrarOLED("ARACHIZ", dbg.substring(0, 21));

    } else if (msg.startsWith("SESSION_ID:")) {
      // El backend puede enviar este comando para indicar la sesión activa
      SESSION_ID = msg.substring(11).toInt();
      mostrarOLED("ARACHIZ", "Sesion:", String(SESSION_ID));
      delay(1500);
      mostrarOLED("ARACHIZ");

    } else if (msg == "ARDUINO_READY") {
      mostrarOLED("ARACHIZ", "Arduino", "listo");
      delay(1500);
      mostrarOLED("ARACHIZ");
    }
  }
}

// ─── PROCESAR LECTURA NFC ──────────────────────────────────
void procesarNFC(String uid) {
  mostrarOLED("ARACHIZ", "NFC...", uid.substring(0, 16));

  if (SESSION_ID == 0) {
    mostrarOLED("ARACHIZ", "Sin sesion", "activa");
    delay(2000);
    mostrarOLED("ARACHIZ");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    mostrarOLED("ARACHIZ", "Sin WiFi", "offline");
    delay(2000);
    mostrarOLED("ARACHIZ");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Para HTTPS sin validar cert (Render usa HTTPS)
  HTTPClient http;

  String url = String(BACKEND_URL) + "/api/serial/wifi-event";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", AUTH_TOKEN);

  // Construir JSON
  JsonDocument doc;
  doc["type"]      = "nfc";
  doc["uid"]       = uid;
  doc["sessionId"] = SESSION_ID;
  String body;
  serializeJson(doc, body);

  int httpCode = http.POST(body);

  if (httpCode == 200) {
    // Parsear respuesta
    JsonDocument resp;
    deserializeJson(resp, http.getString());
    String nombre = resp["nombre"] | "Aprendiz";
    bool ok       = resp["success"] | false;

    if (ok) {
      mostrarOLED("OK", nombre.substring(0, 14), "Registrado");
    } else {
      String motivo = resp["message"] | "No hallado";
      mostrarOLED("X Error", motivo.substring(0, 21));
    }
  } else {
    mostrarOLED("ARACHIZ", "HTTP Err", String(httpCode));
  }

  http.end();
  delay(2500);
  mostrarOLED("ARACHIZ");
}

// ─── PROCESAR LECTURA HUELLA ───────────────────────────────
void procesarHuella(int fingerId) {
  mostrarOLED("ARACHIZ", "Huella ID:", String(fingerId));

  if (SESSION_ID == 0) {
    mostrarOLED("ARACHIZ", "Sin sesion", "activa");
    delay(2000);
    mostrarOLED("ARACHIZ");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    mostrarOLED("ARACHIZ", "Sin WiFi", "offline");
    delay(2000);
    mostrarOLED("ARACHIZ");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(BACKEND_URL) + "/api/serial/wifi-event";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", AUTH_TOKEN);

  JsonDocument doc;
  doc["type"]      = "finger";
  doc["fingerId"]  = fingerId;
  doc["sessionId"] = SESSION_ID;
  String body;
  serializeJson(doc, body);

  int httpCode = http.POST(body);

  if (httpCode == 200) {
    JsonDocument resp;
    deserializeJson(resp, http.getString());
    String nombre = resp["nombre"] | "Aprendiz";
    bool ok       = resp["success"] | false;

    if (ok) {
      mostrarOLED("OK", nombre.substring(0, 14), "Registrado");
    } else {
      String motivo = resp["message"] | "No hallado";
      mostrarOLED("X Error", motivo.substring(0, 21));
    }
  } else {
    mostrarOLED("ARACHIZ", "HTTP Err", String(httpCode));
  }

  http.end();
  delay(2500);
  mostrarOLED("ARACHIZ");
}
