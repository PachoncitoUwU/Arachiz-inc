#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// --- CONFIGURACIÓN WiFi (se guarda en EEPROM) ---
#define EEPROM_SIZE 512
#define SSID_ADDR 0
#define PASS_ADDR 64
#define CONFIGURED_FLAG_ADDR 128

struct WiFiConfig {
  char ssid[64];
  char password[64];
  bool configured;
};

WiFiConfig wifiConfig;
ESP8266WebServer server(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;

// --- BACKEND URLs ---
const bool USE_RENDER_BACKEND = true; // true = Render (producción/Vercel) | false = local

const char* URL_RENDER_EVENT = "https://arachiz-backend.onrender.com/api/hardware/event";
const char* URL_RENDER_CMD   = "https://arachiz-backend.onrender.com/api/hardware/commands";
const char* URL_LOCAL_EVENT  = "http://192.168.18.74:3000/api/hardware/event";
const char* URL_LOCAL_CMD    = "http://192.168.18.74:3000/api/hardware/commands";
const char* API_KEY          = "arachiz-esp-2024";

// Cliente TLS persistente — reutiliza la conexión TCP/TLS entre llamadas
// Esto elimina el handshake TLS (~300-600ms) en envíos consecutivos
WiFiClientSecure persistentClient;

// --- PANTALLA OLED ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C
#define OLED_SDA 14
#define OLED_SCL 12

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Logo ARACHIZ
const unsigned char arachiz_logo [] PROGMEM = {
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x1e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x06, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x1f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x0f, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x3f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x0f, 0x80, 0x00, 0x00, 
0x00, 0x00, 0x3f, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x0f, 0x80, 0x00, 0x00, 
0x00, 0x00, 0x7f, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x0f, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x7f, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x7f, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0xfb, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0xf3, 0xe0, 0x1c, 0x3c, 0x7f, 0x80, 0x1f, 0xc1, 0xe3, 0xf8, 0x0f, 0x1f, 0xff, 0x00, 
0x00, 0x01, 0xf3, 0xe0, 0x1e, 0xfc, 0xff, 0xe0, 0x7f, 0xf1, 0xef, 0xfc, 0x0f, 0x1f, 0xff, 0x00, 
0x00, 0x01, 0xf1, 0xe0, 0x1f, 0xfc, 0xff, 0xe0, 0xff, 0xf9, 0xff, 0xfe, 0x0f, 0x1f, 0xff, 0x00, 
0x00, 0x01, 0xe1, 0xf0, 0x1f, 0xf8, 0xc1, 0xf0, 0xf8, 0x71, 0xfc, 0x3f, 0x0f, 0x00, 0x1f, 0x00, 
0x00, 0x03, 0xe0, 0xf0, 0x1f, 0x80, 0x00, 0xf1, 0xf0, 0x21, 0xf0, 0x1f, 0x0f, 0x00, 0x3e, 0x00, 
0x00, 0x03, 0xc0, 0xf8, 0x1f, 0x00, 0x00, 0xf1, 0xe0, 0x01, 0xe0, 0x0f, 0x0f, 0x00, 0x7c, 0x00, 
0x00, 0x07, 0xc0, 0x78, 0x1e, 0x00, 0x3f, 0xf3, 0xe0, 0x01, 0xe0, 0x0f, 0x0f, 0x00, 0x78, 0x00, 
0x00, 0x07, 0x00, 0x3c, 0x1e, 0x00, 0xff, 0xf3, 0xe0, 0x01, 0xe0, 0x0f, 0x0f, 0x00, 0xf0, 0x00, 
0x00, 0x0c, 0x1e, 0x0c, 0x1e, 0x01, 0xff, 0xf3, 0xc0, 0x01, 0xe0, 0x0f, 0x0f, 0x01, 0xf0, 0x00, 
0x00, 0x00, 0x3f, 0x80, 0x1e, 0x03, 0xe0, 0xf3, 0xe0, 0x01, 0xe0, 0x0f, 0x0f, 0x03, 0xe0, 0x00, 
0x00, 0x00, 0xff, 0xc0, 0x1e, 0x03, 0xc0, 0xf3, 0xe0, 0x01, 0xe0, 0x0f, 0x0f, 0x07, 0xc0, 0x00, 
0x00, 0x03, 0xff, 0xf0, 0x1e, 0x03, 0xc0, 0xf1, 0xe0, 0x01, 0xe0, 0x0f, 0x0f, 0x07, 0x80, 0x00, 
0x00, 0x07, 0xf1, 0xfc, 0x1e, 0x03, 0xc0, 0xf1, 0xf0, 0x31, 0xe0, 0x0f, 0x0f, 0x0f, 0x00, 0x00, 
0x00, 0x1f, 0xc0, 0xfe, 0x1e, 0x03, 0xe3, 0xf0, 0xfc, 0xf9, 0xe0, 0x0f, 0x0f, 0x1f, 0xfe, 0x00, 
0x00, 0x3f, 0x00, 0x3f, 0x1e, 0x03, 0xff, 0xf0, 0x7f, 0xf1, 0xe0, 0x0f, 0x0f, 0x1f, 0xff, 0x00, 
0x00, 0x3e, 0x00, 0x0f, 0x1e, 0x01, 0xfe, 0x78, 0x3f, 0xe1, 0xe0, 0x0f, 0x0f, 0x1f, 0xff, 0x00, 
0x00, 0x38, 0x00, 0x03, 0x1e, 0x00, 0x7c, 0x30, 0x0f, 0x81, 0xc0, 0x0f, 0x07, 0x1f, 0xff, 0x00, 
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

unsigned long ultimoMensaje = 0;

// Comando pendiente para el Arduino (se entrega cuando el Arduino hace POLL)
String pendingCommand = "";

// --- COMUNICACIÓN CON ARDUINO ---
SoftwareSerial arduinoSerial(4, 0); // RX=D2, TX=D3

void mostrarLogo() {
  display.clearDisplay();
  display.drawBitmap(0, 16, arachiz_logo, 128, 32, WHITE);
  display.display();
}

void mostrarMensaje(String l1, String l2 = "", String l3 = "") {
  ultimoMensaje = millis();
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);  display.println(l1);
  if (l2 != "") { display.setCursor(0, 22); display.println(l2); }
  if (l3 != "") { display.setCursor(0, 44); display.println(l3); }
  display.display();
}

// ========== FUNCIONES EEPROM ==========
void guardarConfigWiFi(String ssid, String password) {
  Serial.println("Guardando WiFi: " + ssid);
  
  EEPROM.begin(EEPROM_SIZE);
  
  // Limpiar las áreas de memoria
  for (int i = 0; i < 200; i++) {
    EEPROM.write(i, 0);
  }
  
  // Guardar SSID
  for (unsigned int i = 0; i < ssid.length() && i < 63; i++) {
    EEPROM.write(SSID_ADDR + i, ssid[i]);
  }
  EEPROM.write(SSID_ADDR + ssid.length(), '\0');
  
  // Guardar Password
  for (unsigned int i = 0; i < password.length() && i < 63; i++) {
    EEPROM.write(PASS_ADDR + i, password[i]);
  }
  EEPROM.write(PASS_ADDR + password.length(), '\0');
  
  // Marcar como configurado
  EEPROM.write(CONFIGURED_FLAG_ADDR, 1);
  
  // IMPORTANTE: Commit para guardar en flash
  bool success = EEPROM.commit();
  Serial.println(success ? "EEPROM guardado OK" : "ERROR guardando EEPROM");
  
  delay(100);
  EEPROM.end();
}

void cargarConfigWiFi() {
  EEPROM.begin(EEPROM_SIZE);
  
  wifiConfig.configured = (EEPROM.read(CONFIGURED_FLAG_ADDR) == 1);
  
  Serial.print("Config flag: ");
  Serial.println(wifiConfig.configured ? "SI" : "NO");
  
  if (wifiConfig.configured) {
    // Leer SSID
    for (int i = 0; i < 63; i++) {
      char c = EEPROM.read(SSID_ADDR + i);
      if (c == '\0') break;
      wifiConfig.ssid[i] = c;
    }
    wifiConfig.ssid[63] = '\0';
    
    // Leer Password
    for (int i = 0; i < 63; i++) {
      char c = EEPROM.read(PASS_ADDR + i);
      if (c == '\0') break;
      wifiConfig.password[i] = c;
    }
    wifiConfig.password[63] = '\0';
    
    Serial.print("SSID cargado: ");
    Serial.println(wifiConfig.ssid);
  }
  
  EEPROM.end();
}

void borrarConfigWiFi() {
  Serial.println("Borrando configuracion WiFi...");
  EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < 200; i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
  EEPROM.end();
  wifiConfig.configured = false;
  Serial.println("Configuracion borrada");
}

// ========== PORTAL CAUTIVO ==========
const char HTML_CONFIG[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>ARACHIZ - Config WiFi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 400px;
      width: 100%;
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      font-size: 32px;
      color: #667eea;
      font-weight: 800;
      letter-spacing: 2px;
    }
    .logo p {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 14px;
    }
    input, select {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 16px;
      transition: all 0.3s;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    button:active {
      transform: translateY(0);
    }
    .info {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #555;
    }
    .reset-btn {
      background: #ff4757;
      margin-top: 10px;
      font-size: 14px;
      padding: 10px;
    }
    .reset-btn:hover {
      box-shadow: 0 10px 20px rgba(255, 71, 87, 0.3);
    }
  </style>
</head>
<body>
  <div class='container'>
    <div class='logo'>
      <h1>ARACHIZ</h1>
      <p>Configuración WiFi</p>
    </div>
    
    <div class='info'>
      📡 Conecta el dispositivo a tu red WiFi para que funcione con el sistema de asistencia.
    </div>
    
    <form action='/save' method='POST'>
      <div class='form-group'>
        <label>Red WiFi (SSID)</label>
        <input type='text' name='ssid' placeholder='Nombre de tu WiFi' required maxlength='63'>
      </div>
      
      <div class='form-group'>
        <label>Contraseña</label>
        <input type='password' name='password' placeholder='Contraseña WiFi' required maxlength='63'>
      </div>
      
      <button type='submit'>💾 Guardar y Conectar</button>
    </form>
    
    <form action='/reset' method='POST'>
      <button type='submit' class='reset-btn'>🔄 Borrar Configuración</button>
    </form>
  </div>
</body>
</html>
)rawliteral";

const char HTML_SUCCESS[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>ARACHIZ - Éxito</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .success-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      color: #11998e;
      font-size: 28px;
      margin-bottom: 15px;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .info {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 10px;
      margin-top: 20px;
      font-size: 14px;
      color: #2e7d32;
    }
  </style>
</head>
<body>
  <div class='container'>
    <div class='success-icon'>✅</div>
    <h1>¡Configuración Guardada!</h1>
    <p>El dispositivo se está conectando a tu red WiFi.</p>
    <p>Puedes cerrar esta ventana.</p>
    <div class='info'>
      El ESP8266 se reiniciará y se conectará automáticamente a tu red.
    </div>
  </div>
</body>
</html>
)rawliteral";

void iniciarPortalConfig() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP("ARACHIZ-CONFIG");
  
  // Iniciar DNS Server para portal cautivo
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
  
  mostrarMensaje("MODO CONFIG", "WiFi: ARACHIZ", "IP: 192.168.4.1");
  
  // Capturar TODAS las peticiones y redirigir al portal
  server.onNotFound([]() {
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/", HTTP_GET, []() {
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/generate_204", HTTP_GET, []() {  // Android
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/fwlink", HTTP_GET, []() {  // Windows
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/hotspot-detect.html", HTTP_GET, []() {  // iOS
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/save", HTTP_POST, []() {
    String ssid = server.arg("ssid");
    String password = server.arg("password");
    
    Serial.println("Recibido SSID: " + ssid);
    Serial.println("Recibido Pass: " + password);
    
    if (ssid.length() > 0) {
      mostrarMensaje("Guardando...", ssid);
      guardarConfigWiFi(ssid, password);
      server.send_P(200, "text/html", HTML_SUCCESS);
      delay(2000);
      Serial.println("Reiniciando ESP...");
      ESP.restart();
    } else {
      server.send(400, "text/plain", "SSID requerido");
    }
  });
  
  server.on("/reset", HTTP_POST, []() {
    borrarConfigWiFi();
    server.send(200, "text/plain", "Configuracion borrada. Reiniciando...");
    delay(1000);
    ESP.restart();
  });
  
  server.begin();
  Serial.println("Portal cautivo iniciado en 192.168.4.1");
  Serial.println("DNS Server activo");
}

void conectarWifi() {
  if (!wifiConfig.configured) {
    mostrarMensaje("Sin config", "Iniciando", "portal WiFi...");
    delay(1000);
    iniciarPortalConfig();
    return;
  }
  
  mostrarMensaje("Conectando", "WiFi...", wifiConfig.ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiConfig.ssid, wifiConfig.password);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500); 
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    mostrarMensaje("WiFi OK", WiFi.localIP().toString(), "Listo!");
    Serial.println("Conectado exitosamente!");
    delay(1500);
    consultarEstadoSesion(); // Sincronizar estado de sesión al reconectar
  } else {
    mostrarMensaje("ERROR WiFi", "No conecta", "Mantener config");
    Serial.println("ERROR: No se pudo conectar al WiFi");
    Serial.println("SSID: " + String(wifiConfig.ssid));
    Serial.println("Verifica nombre y password");
    Serial.println("Presiona RESET para reintentar");
    // NO borramos la config para poder diagnosticar
    delay(5000);
    // Volver al portal SIN borrar
    wifiConfig.configured = false;
    iniciarPortalConfig();
  }
}

bool enviarEvento(String type, String payload, bool online) {
  if (WiFi.status() != WL_CONNECTED) return false;

  String url = online ? URL_RENDER_EVENT : URL_LOCAL_EVENT;

  StaticJsonDocument<128> doc;
  doc["type"] = type;
  doc["payload"] = payload;
  String body;
  serializeJson(doc, body);

  bool ok = false;
  HTTPClient http;

  if (online) {
    // Reutilizar cliente TLS persistente — evita re-handshake (~300ms ahorrados)
    persistentClient.setInsecure();
    if (http.begin(persistentClient, url)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-hardware-key", API_KEY);
      http.addHeader("Connection", "keep-alive");  // mantener conexión TCP viva
      http.setTimeout(6000);  // era 10000ms → 6000ms
      int code = http.POST(body);
      ok = (code == 200);
      Serial.println("POST Render -> " + String(code));
      // NO llamar http.end() para mantener la conexión TCP viva (keep-alive)
      // Solo liberar si falló para evitar estado inconsistente
      if (!ok) http.end();
    }
  } else {
    WiFiClient plainClient;
    http.begin(plainClient, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-hardware-key", API_KEY);
    http.setTimeout(3000);
    int code = http.POST(body);
    ok = (code == 200);
    Serial.println("POST Local -> " + String(code));
    http.end();
  }
  return ok;
}

void consultarEstadoSesion() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(USE_RENDER_BACKEND ? URL_RENDER_CMD : URL_LOCAL_CMD);
  url.replace("/commands", "/session-status");

  if (USE_RENDER_BACKEND) {
    persistentClient.setInsecure();
    http.begin(persistentClient, url);
  } else {
    WiFiClient plainClient;
    http.begin(plainClient, url);
  }

  http.addHeader("x-hardware-key", API_KEY);
  http.setTimeout(5000);

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    StaticJsonDocument<64> doc;
    deserializeJson(doc, payload);
    bool active = doc["sessionActive"] | false;
    String cmd = active ? "SESSION ON" : "SESSION OFF";
    pendingCommand = cmd;
    Serial.println("Estado sesion sincronizado: " + cmd);
  }
  // No cerrar http para mantener keep-alive
}

void consultarComandos() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  if (USE_RENDER_BACKEND) {
    persistentClient.setInsecure();
    http.begin(persistentClient, URL_RENDER_CMD);
  } else {
    WiFiClient plainClient;
    http.begin(plainClient, URL_LOCAL_CMD);
  }

  http.addHeader("x-hardware-key", API_KEY);
  http.addHeader("Connection", "keep-alive");
  http.setTimeout(5000);  // era 8000ms → 5000ms
  
  int code = http.GET();
  Serial.println("[CMD] HTTP " + String(code));

  if (code == 200) {
    String payload = http.getString();
    Serial.println("[CMD] Payload: " + payload);

    StaticJsonDocument<128> doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (err) {
      Serial.println("[CMD] JSON error: " + String(err.c_str()));
      http.end();
      return;
    }

    const char* cmd = doc["command"];
    
    if (cmd != nullptr && strlen(cmd) > 0) {
      Serial.println("[CMD] Guardando para Arduino: " + String(cmd));
      pendingCommand = String(cmd);
      mostrarMensaje("CMD listo", String(cmd), "esp. Arduino...");
    } else {
      Serial.println("[CMD] Sin comandos pendientes");
    }
  } else {
    Serial.println("[CMD] Error HTTP: " + String(code));
    http.end(); // solo cerrar en error para liberar recursos
  }
}

void setup() {
  Serial.begin(115200);
  arduinoSerial.begin(9600);   // 9600 baud — sincronizado con ArduinoEsclavo.ino

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    for(;;);
  }

  mostrarMensaje("ARACHIZ", "Iniciando...");
  delay(500);
  
  // Cargar configuración WiFi desde EEPROM
  cargarConfigWiFi();
  
  conectarWifi();

  // Si no está configurado, el portal se queda activo
  if (!wifiConfig.configured) {
    return; // El loop manejará el servidor web
  }

  mostrarLogo();
}

void loop() {
  // Si estamos en modo portal cautivo, manejar servidor web y DNS
  if (!wifiConfig.configured) {
    dnsServer.processNextRequest();
    server.handleClient();
    return;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    conectarWifi();
    consultarEstadoSesion(); // Re-sincronizar estado tras reconexión
  }

  // Volver al logo después de 3 segundos sin actividad
  if (ultimoMensaje > 0 && millis() - ultimoMensaje > 3000) {
    ultimoMensaje = 0;
    mostrarLogo();
  }

  // Consultar comandos al backend cada 500ms (el Arduino hace POLL cada 400ms)
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 500) {
    lastCheck = millis();
    consultarComandos();
  }

  // Leer mensajes del Arduino
  if (arduinoSerial.available()) {
    arduinoSerial.setTimeout(100); // a 9600 baud la línea llega en <30ms
    String msg = arduinoSerial.readStringUntil('\n');
    msg.trim();
    // Filtrar solo ASCII imprimible
    String limpio = "";
    for (int i = 0; i < (int)msg.length(); i++) {
      char c = msg[i];
      if (c >= 32 && c < 127) limpio += c;
    }
    msg = limpio;
    if (msg.length() == 0) return;

    Serial.println("Arduino: " + msg);

    // El Arduino hace POLL preguntando si hay comandos pendientes
    if (msg == "POLL") {
      if (pendingCommand.length() > 0) {
        Serial.println("[POLL] -> " + pendingCommand);
        delay(5);                     // era 10ms → 5ms
        arduinoSerial.println(pendingCommand);
        pendingCommand = "";
      } else {
        delay(5);                     // era 10ms → 5ms
        arduinoSerial.println("NONE");
      }
      return;
    }

    // Eventos del Arduino (prefijo EVT: en modo WiFi)
    if (msg.startsWith("EVT:")) {
      msg = msg.substring(4);
    }

    // Detectar modo desde el prefijo que manda el Arduino (compatibilidad)
    bool online = msg.startsWith("MODO:RENDER|");
    if (online) msg = msg.substring(12);
    else online = USE_RENDER_BACKEND;

    if (msg.startsWith("READ_NFC:")) {
      String uid = msg.substring(9); uid.trim();
      mostrarMensaje("NFC leido", uid, "Enviando...");
      bool ok = enviarEvento("nfc", uid, online);
      mostrarMensaje("NFC leido", uid, ok ? "Registrado!" : "Error envio");

    } else if (msg.startsWith("READ_FINGER:")) {
      // Soporta con o sin espacio después de los dos puntos
      String id = msg.substring(12); id.trim();
      if (id.length() == 0) id = "?";
      mostrarMensaje("Huella leida", "ID: " + id, "Enviando...");
      bool ok = enviarEvento("finger", id, online);
      mostrarMensaje("Huella leida", "ID: " + id, ok ? "Registrado!" : "Error envio");

    } else if (msg.startsWith("ENROLL_SUCCESS:")) {
      String id = msg.substring(15); id.trim();
      mostrarMensaje("Huella", "Enrolada OK", "ID: " + id);
      enviarEvento("enroll_success", id, online);

    } else if (msg.startsWith("ENROLL_ERROR:")) {
      String err = msg.substring(13); err.trim();
      mostrarMensaje("Error enrol.", err);
      enviarEvento("enroll_error", err, online);

    } else if (msg == "TEST_PING") {
      mostrarMensaje("Arduino OK", "Switch OFF", "Modo USB");
    }
  }
}
