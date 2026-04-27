#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN WiFi ---
const char* WIFI_SSID     = "Famila_Pachon";
const char* WIFI_PASSWORD = "Familiapachon875";

// --- BACKEND URLs ---
const char* URL_RENDER = "https://bakendarachizpriv.onrender.com/api/hardware/event";
const char* URL_LOCAL  = "http://192.168.X.X:3000/api/hardware/event"; // Cambia X.X por tu IP local
const char* API_KEY    = "arachiz-esp-2024";

// --- PIN SWITCH (D1 = GPIO5) ---
#define PIN_SWITCH 5

// --- PANTALLA OLED ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C
#define OLED_SDA 14
#define OLED_SCL 12

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- COMUNICACIÓN CON ARDUINO ---
SoftwareSerial arduinoSerial(4, 0); // RX=D2, TX=D3

void mostrarMensaje(String l1, String l2 = "", String l3 = "") {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);  display.println(l1);
  if (l2 != "") { display.setCursor(0, 22); display.println(l2); }
  if (l3 != "") { display.setCursor(0, 44); display.println(l3); }
  display.display();
}

bool modoOnline() {
  return digitalRead(PIN_SWITCH) == HIGH;
}

void conectarWifi() {
  mostrarMensaje("Conectando", "WiFi...", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500); intentos++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    mostrarMensaje("WiFi OK", WiFi.localIP().toString(), "Listo!");
    delay(1500);
  } else {
    mostrarMensaje("ERROR WiFi", "Sin conexion");
    delay(1500);
  }
}

bool enviarEvento(String type, String payload) {
  if (WiFi.status() != WL_CONNECTED) return false;

  bool online = modoOnline();
  String url = online ? URL_RENDER : URL_LOCAL;

  StaticJsonDocument<128> doc;
  doc["type"] = type;
  doc["payload"] = payload;
  String body;
  serializeJson(doc, body);

  bool ok = false;
  if (online) {
    // HTTPS para Render
    WiFiClientSecure client;
    client.setInsecure(); // Sin verificar certificado (suficiente para este uso)
    HTTPClient http;
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-hardware-key", API_KEY);
    int code = http.POST(body);
    ok = (code == 200);
    Serial.println("POST Render -> " + String(code));
    http.end();
  } else {
    // HTTP para local
    WiFiClient client;
    HTTPClient http;
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-hardware-key", API_KEY);
    int code = http.POST(body);
    ok = (code == 200);
    Serial.println("POST Local -> " + String(code));
    http.end();
  }
  return ok;
}

void setup() {
  Serial.begin(115200);
  arduinoSerial.begin(9600);
  pinMode(PIN_SWITCH, INPUT_PULLDOWN_16); // D1

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    for(;;);
  }

  mostrarMensaje("ARACHIZ", "Iniciando...");
  delay(500);
  conectarWifi();

  String modo = modoOnline() ? "Render (online)" : "Local";
  mostrarMensaje("ARACHIZ listo", modo, "Esperando...");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) conectarWifi();

  if (arduinoSerial.available()) {
    String msg = arduinoSerial.readStringUntil('\n');
    msg.trim();
    if (msg.length() == 0) return;

    Serial.println("Arduino: " + msg);

    if (msg.startsWith("READ_NFC:")) {
      String uid = msg.substring(9); uid.trim();
      mostrarMensaje("NFC leido", uid, "Enviando...");
      bool ok = enviarEvento("nfc", uid);
      mostrarMensaje("NFC leido", uid, ok ? "Registrado!" : "Error envio");

    } else if (msg.startsWith("READ_FINGER:")) {
      String id = msg.substring(12); id.trim();
      mostrarMensaje("Huella leida", "ID: " + id, "Enviando...");
      bool ok = enviarEvento("finger", id);
      mostrarMensaje("Huella leida", "ID: " + id, ok ? "Registrado!" : "Error envio");

    } else if (msg.startsWith("ENROLL_SUCCESS:")) {
      String id = msg.substring(15); id.trim();
      mostrarMensaje("Huella", "Enrolada OK", "ID: " + id);
      enviarEvento("enroll_success", id);

    } else if (msg.startsWith("ENROLL_ERROR:")) {
      String err = msg.substring(13); err.trim();
      mostrarMensaje("Error enrol.", err);
      enviarEvento("enroll_error", err);

    } else if (msg == "TEST_PING") {
      String modo = modoOnline() ? "Render" : "Local";
      mostrarMensaje("Arduino OK", "Modo: " + modo);
    }
  }
}
