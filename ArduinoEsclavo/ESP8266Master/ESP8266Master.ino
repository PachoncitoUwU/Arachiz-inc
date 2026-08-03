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

// --- MODO DE OPERACIÓN ---
const bool MODO_SOLO_PANTALLA = false; // true = Apagar WiFi, ahorrar corriente y mostrar LOGO ARACHIZ | false = Modo WiFi web

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

// --- PANTALLA OLED INTEGRADA ---
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
  <title>ARACHIZ - Portal WiFi</title>
  <style>
    :root { --primary: #4285F4; --success: #34A853; --bg: #09090b; --card: #18181b; --border: #27272a; --text: #f4f4f5; --text-muted: #a1a1aa; }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background-color: var(--bg); background-image: radial-gradient(circle at 50% 10%, rgba(66, 133, 244, 0.15) 0%, rgba(9, 9, 11, 0) 70%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; color: var(--text); }
    .container { background: var(--card); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); padding: 36px; max-width: 420px; width: 100%; position: relative; overflow: hidden; }
    .header { text-align: center; margin-bottom: 28px; }
    .header h1 { font-size: 32px; font-weight: 800; letter-spacing: 1px; background: linear-gradient(to right, #4285F4, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header p { color: var(--text-muted); font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(52, 168, 83, 0.15); border: 1px solid rgba(52, 168, 83, 0.4); color: #4ae076; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; margin-bottom: 24px; width: 100%; justify-content: center; }
    .form-group { margin-bottom: 20px; }
    .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    label { font-weight: 600; color: var(--text); font-size: 14px; }
    .btn-scan { background: none; border: none; color: var(--primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: 6px; }
    .btn-scan:hover { text-decoration: underline; }
    select, input { width: 100%; padding: 13px 16px; background: #0e0e11; border: 1px solid var(--border); border-radius: 12px; font-size: 15px; color: white; transition: all 0.2s; }
    select:focus, input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2); }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .toggle-pass { position: absolute; right: 14px; background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; }
    .btn-submit { width: 100%; padding: 15px; background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px -5px rgba(66, 133, 244, 0.4); transition: transform 0.2s, box-shadow 0.2s; margin-top: 8px; }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 12px 30px -5px rgba(66, 133, 244, 0.6); }
    .btn-submit:active { transform: translateY(0); }
    .btn-reset { width: 100%; padding: 12px; background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 24px; transition: all 0.2s; }
    .btn-reset:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
    #manualInput { display: none; margin-top: 10px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .spinning { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>ARACHIZ</h1>
      <p>Portal de Configuración</p>
    </div>
    
    <div class='badge'>
      <span>⚡ Modo Inalámbrico • Hardware v440</span>
    </div>
    
    <form action='/save' method='POST' id='wifiForm'>
      <div class='form-group'>
        <div class='label-row'>
          <label>Red WiFi (SSID)</label>
          <button type='button' class='btn-scan' onclick='escanearRedes()' id='scanBtn'>🔄 Escanear</button>
        </div>
        <select id='networkSelect' onchange='handleSelectChange()'>
          <option value=''>Buscando redes en el aire...</option>
        </select>
        <input type='hidden' name='ssid' id='finalSsid' required>
        <input type='text' id='manualInput' placeholder='Nombre de tu red oculta o manual' maxlength='63' oninput='updateManualSsid()'>
      </div>
      
      <div class='form-group'>
        <label>Contraseña</label>
        <div class='input-wrapper'>
          <input type='password' name='password' id='wifiPassword' placeholder='Contraseña de tu red WiFi' required maxlength='63'>
          <button type='button' class='toggle-pass' onclick='togglePassword()'>👁️</button>
        </div>
      </div>
      
      <button type='submit' class='btn-submit'>🚀 Conectar Caja a Internet</button>
    </form>
    
    <form action='/reset' method='POST' onsubmit="return confirm('¿Deseas borrar las contraseñas guardadas?');">
      <button type='submit' class='btn-reset'>🗑️ Restablecer Configuración de Memoria</button>
    </form>
  </div>

  <script>
    function togglePassword() {
      const p = document.getElementById('wifiPassword');
      const btn = document.querySelector('.toggle-pass');
      if (p.type === 'password') { p.type = 'text'; btn.innerText = '🙈'; }
      else { p.type = 'password'; btn.innerText = '👁️'; }
    }

    function handleSelectChange() {
      const sel = document.getElementById('networkSelect');
      const man = document.getElementById('manualInput');
      const hid = document.getElementById('finalSsid');
      if (sel.value === '__MANUAL__') {
        man.style.display = 'block';
        man.focus();
        hid.value = man.value;
      } else {
        man.style.display = 'none';
        hid.value = sel.value;
      }
    }

    function updateManualSsid() {
      document.getElementById('finalSsid').value = document.getElementById('manualInput').value;
    }

    function escanearRedes() {
      const btn = document.getElementById('scanBtn');
      const sel = document.getElementById('networkSelect');
      btn.innerHTML = '<span class="spinning">🔄</span> Buscando...';
      btn.disabled = true;

      fetch('/scan')
        .then(r => r.json())
        .then(data => {
          sel.innerHTML = '<option value="" disabled selected>— Selecciona una red detectada —</option>';
          data.forEach(red => {
            const icon = red.rssi > -65 ? '🟢' : (red.rssi > -78 ? '🟡' : '🟠');
            const lock = red.enc ? '🔒' : '🔓';
            sel.innerHTML += `<option value="${red.ssid}">${icon} ${lock} ${red.ssid} (${red.rssi} dBm)</option>`;
          });
          sel.innerHTML += '<option value="__MANUAL__">➕ Escribir red manual / oculta...</option>';
          btn.innerHTML = '🔄 Actualizar';
          btn.disabled = false;
        })
        .catch(e => {
          sel.innerHTML = '<option value="__MANUAL__">⚠️ Error escaneando - Escribe manual</option>';
          btn.innerHTML = '🔄 Reintentar';
          btn.disabled = false;
          handleSelectChange();
        });
    }

    window.onload = escanearRedes;
  </script>
</body>
</html>
)rawliteral";

const char HTML_SUCCESS[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>ARACHIZ - Conectado</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #09090b; background-image: radial-gradient(circle at 50% 10%, rgba(52, 168, 83, 0.2) 0%, rgba(9, 9, 11, 0) 70%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; color: #f4f4f5; }
    .container { background: #18181b; border: 1px solid #27272a; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); padding: 40px; max-width: 420px; width: 100%; text-align: center; }
    .icon { font-size: 72px; margin-bottom: 24px; animation: bounce 1s ease infinite; }
    h1 { color: #4ae076; font-size: 28px; font-weight: 800; margin-bottom: 12px; letter-spacing: 0.5px; }
    p { color: #a1a1aa; line-height: 1.6; font-size: 15px; margin-bottom: 8px; }
    .info-box { background: rgba(52, 168, 83, 0.1); border: 1px solid rgba(52, 168, 83, 0.3); padding: 16px; border-radius: 12px; margin-top: 24px; font-size: 14px; color: #86efac; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  </style>
</head>
<body>
  <div class='container'>
    <div class='icon'>🎉</div>
    <h1>¡Credenciales Registradas!</h1>
    <p>La placa ESP8266 está iniciando conexión con tu router.</p>
    <p>Ya puedes cerrar esta pestaña en tu navegador.</p>
    <div class='info-box'>
      ⚡ En cuanto enlacemos, el sistema conmutará tus huellas y chips a los servidores de Vercel/Render automáticamente.
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
  
  // Endpoint para escanear redes WiFi dinámicamente y devolver JSON
  server.on("/scan", HTTP_GET, []() {
    int n = WiFi.scanNetworks();
    String json = "[";
    for (int i = 0; i < n; ++i) {
      if (i > 0) json += ",";
      json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + ",\"enc\":" + String(WiFi.encryptionType(i) != ENC_TYPE_NONE ? "true" : "false") + "}";
    }
    json += "]";
    server.send(200, "application/json", json);
  });

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
    Serial.println(F("ADVERTENCIA: Pantalla OLED no encontrada. Continuando..."));
  }

  mostrarMensaje("ARACHIZ", "Iniciando...");
  delay(500);
  
  // --- MODO SOLO PANTALLA (Ahorro de energía y visualización de logo) ---
  if (MODO_SOLO_PANTALLA) {
    WiFi.mode(WIFI_OFF); // Apaga la radiofrecuencia y baja consumo de 150mA a 15mA
    Serial.println(F("Modo Solo Pantalla Activo: WiFi APAGADO"));
    mostrarLogo();
    return;
  }

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
  // --- A. MODO SOLO PANTALLA (Coprocesador gráfico sin WiFi) ---
  if (MODO_SOLO_PANTALLA) {
    // Volver al logo después de 3 segundos sin actividad
    if (ultimoMensaje > 0 && millis() - ultimoMensaje > 3000) {
      ultimoMensaje = 0;
      mostrarLogo();
    }

    // Escuchar mensajes del Arduino por cable serial y mostrarlos por 3 segundos
    if (arduinoSerial.available()) {
      arduinoSerial.setTimeout(100);
      String msg = arduinoSerial.readStringUntil('\n');
      msg.trim();
      if (msg.length() == 0 || msg == "POLL") return;

      if (msg.startsWith("EVT:")) msg = msg.substring(4);
      if (msg.startsWith("READ_NFC:")) {
        String uid = msg.substring(9); uid.trim();
        mostrarMensaje("NFC Detectado", uid, "ARACHIZ LOG");
      } else if (msg.startsWith("READ_FINGER:")) {
        String id = msg.substring(12); id.trim();
        mostrarMensaje("Huella Leida", "ID: " + id, "ARACHIZ LOG");
      } else if (msg.startsWith("ENROLL_SUCCESS:")) {
        String id = msg.substring(15); id.trim();
        mostrarMensaje("Enrolado OK!", "Huella ID: " + id);
      } else if (msg.startsWith("ENROLL_ERROR:")) {
        String err = msg.substring(13); err.trim();
        mostrarMensaje("Error Enrol.", err);
      }
    }
    return;
  }

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
