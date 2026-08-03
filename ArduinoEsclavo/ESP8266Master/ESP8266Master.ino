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
#include "LogoPNG.h"

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

// --- PROTOTIPOS DE FUNCIONES (Forward declarations para prevenir errores de compilación en C++) ---
void mostrarLogo();
void mostrarMensaje(String l1, String l2 = "", String l3 = "");
void guardarConfigWiFi(String ssid, String password);
void cargarConfigWiFi();
void borrarConfigWiFi();
void iniciarPortalConfig();
void conectarWifi();
bool enviarEvento(String type, String payload, bool online);
void consultarEstadoSesion();
void consultarComandos();

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
// nuevo cambio que ya compila en el ESP8266  
void mostrarMensaje(String l1, String l2, String l3) {
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
    .container { background: var(--card); border: 1px solid var(--border); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); padding: 36px; max-width: 440px; width: 100%; position: relative; overflow: hidden; }
    .logo-container { background: #000000; border: 1px solid #27272a; padding: 18px 24px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.9); }
    .logo-img { max-height: 54px; width: auto; filter: invert(100%); display: block; }
    .header { text-align: center; margin-bottom: 20px; }
    .header p { color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(66, 133, 244, 0.12); border: 1px solid rgba(66, 133, 244, 0.3); color: #60a5fa; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 600; margin-bottom: 24px; width: 100%; justify-content: center; }
    .form-group { margin-bottom: 20px; }
    .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    label { font-weight: 600; color: var(--text); font-size: 14px; }
    .btn-scan { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 4px; border-radius: 6px; }
    .btn-scan:hover { text-decoration: underline; }
    .network-list { max-height: 190px; overflow-y: auto; border: 1px solid var(--border); border-radius: 12px; background: #0e0e11; margin-bottom: 10px; }
    .network-item { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid #1f1f23; transition: background 0.2s; font-size: 14px; color: #d4d4d8; }
    .network-item:last-child { border-bottom: none; }
    .network-item:hover { background: #18181b; color: white; }
    .network-item.selected { background: rgba(66, 133, 244, 0.15); border-left: 4px solid var(--primary); font-weight: 600; color: white; }
    .network-info { display: flex; align-items: center; gap: 8px; }
    .signal-badge { font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .signal-strong { background: rgba(52, 168, 83, 0.2); color: #4ae076; }
    .signal-med { background: rgba(250, 204, 21, 0.2); color: #fde047; }
    .signal-weak { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
    input { width: 100%; padding: 13px 16px; background: #0e0e11; border: 1px solid var(--border); border-radius: 12px; font-size: 15px; color: white; transition: all 0.2s; }
    input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2); }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .toggle-pass { position: absolute; right: 14px; background: none; border: none; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; text-transform: uppercase; }
    .btn-submit { width: 100%; padding: 15px; background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px -5px rgba(66, 133, 244, 0.4); transition: transform 0.2s, box-shadow 0.2s; margin-top: 8px; }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 12px 30px -5px rgba(66, 133, 244, 0.6); }
    .btn-submit:disabled { background: #3f3f46; color: #a1a1aa; cursor: not-allowed; box-shadow: none; transform: none; }
    .btn-reset { width: 100%; padding: 12px; background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 24px; transition: all 0.2s; }
    .btn-reset:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
    #manualInput { display: none; margin-top: 10px; }
    .alert-box { display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 14px; border-radius: 12px; font-size: 14px; margin-bottom: 20px; font-weight: 500; }
    .spinning { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class='container'>
    <div class='logo-container'>
      <img src='/logo.png' alt='Arachiz Logo' class='logo-img'>
    </div>
    <div class='header'>
      <p>Portal de Configuración</p>
    </div>
    
    <div class='badge'>
      <span>Modo Inalámbrico • Hardware v440</span>
    </div>

    <div id='alertBox' class='alert-box'></div>
    
    <form id='wifiForm' onsubmit='guardarRed(event)'>
      <div class='form-group'>
        <div class='label-row'>
          <label>Red WiFi (SSID)</label>
          <button type='button' class='btn-scan' onclick='escanearRedes()' id='scanBtn'>
            <svg class='spinning' style='display:none' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/><path d='M21 3v5h-5'/></svg>
            <span>Escanear Redes</span>
          </button>
        </div>
        
        <div id='networkList' class='network-list'>
          <div class='network-item' style='justify-content:center; color: #a1a1aa;'>Buscando redes disponibles...</div>
        </div>

        <input type='hidden' name='ssid' id='finalSsid' required>
        <input type='text' id='manualInput' placeholder='Nombre de la red oculta o manual' maxlength='63' oninput='updateManualSsid()'>
      </div>
      
      <div class='form-group'>
        <label>Contraseña</label>
        <div class='input-wrapper'>
          <input type='password' name='password' id='wifiPassword' placeholder='Contraseña de acceso a la red' required maxlength='63'>
          <button type='button' class='toggle-pass' onclick='togglePassword()'>Mostrar</button>
        </div>
      </div>
      
      <button type='submit' class='btn-submit' id='submitBtn'>Conectar Caja a Internet</button>
    </form>
    
    <form action='/reset' method='POST' onsubmit="return confirm('¿Confirmas que deseas borrar la memoria del dispositivo?');">
      <button type='submit' class='btn-reset'>Restablecer Configuración de Memoria</button>
    </form>
  </div>

  <script>
    function togglePassword() {
      const p = document.getElementById('wifiPassword');
      const btn = document.querySelector('.toggle-pass');
      if (p.type === 'password') { p.type = 'text'; btn.innerText = 'Ocultar'; }
      else { p.type = 'password'; btn.innerText = 'Mostrar'; }
    }

    function selectNetwork(el, ssid) {
      document.querySelectorAll('.network-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
      const man = document.getElementById('manualInput');
      const hid = document.getElementById('finalSsid');
      if (ssid === '__MANUAL__') {
        man.style.display = 'block';
        man.focus();
        hid.value = man.value;
      } else {
        man.style.display = 'none';
        hid.value = ssid;
      }
    }

    function updateManualSsid() {
      document.getElementById('finalSsid').value = document.getElementById('manualInput').value;
    }

    function escanearRedes() {
      const btn = document.getElementById('scanBtn');
      const list = document.getElementById('networkList');
      const icon = btn.querySelector('svg');
      const text = btn.querySelector('span');
      
      icon.style.display = 'inline-block';
      text.innerText = 'Buscando...';
      btn.disabled = true;

      fetch('/scan')
        .then(r => r.json())
        .then(data => {
          list.innerHTML = '';
          if (data.length === 0) {
            list.innerHTML = "<div class='network-item' style='justify-content:center'>No se detectaron redes en el área</div>";
          } else {
            data.forEach(red => {
              let signalClass = 'signal-weak';
              let signalText = 'Débil';
              if (red.rssi > -68) { signalClass = 'signal-strong'; signalText = 'Fuerte'; }
              else if (red.rssi > -79) { signalClass = 'signal-med'; signalText = 'Media'; }
              
              const secText = red.enc ? 'Protegida' : 'Abierta';
              
              const div = document.createElement('div');
              div.className = 'network-item';
              div.onclick = () => selectNetwork(div, red.ssid);
              div.innerHTML = `
                <span>${red.ssid}</span>
                <div class='network-info'>
                  <span class='signal-badge ${signalClass}'>${signalText}</span>
                  <span style='font-size:11px; color:#a1a1aa;'>${secText}</span>
                </div>
              `;
              list.appendChild(div);
            });
          }
          const manualDiv = document.createElement('div');
          manualDiv.className = 'network-item';
          manualDiv.style.color = '#60a5fa';
          manualDiv.style.fontWeight = '600';
          manualDiv.onclick = () => selectNetwork(manualDiv, '__MANUAL__');
          manualDiv.innerHTML = "<span>+ Agregar red manual u oculta...</span>";
          list.appendChild(manualDiv);
          
          icon.style.display = 'none';
          text.innerText = 'Actualizar Redes';
          btn.disabled = false;
        })
        .catch(e => {
          list.innerHTML = "<div class='network-item' style='color:#f87171'>Error al escanear. Intenta escribir el nombre manualmente.</div>";
          icon.style.display = 'none';
          text.innerText = 'Reintentar';
          btn.disabled = false;
        });
    }

    function guardarRed(e) {
      e.preventDefault();
      const form = document.getElementById('wifiForm');
      const btn = document.getElementById('submitBtn');
      const alert = document.getElementById('alertBox');
      const ssid = document.getElementById('finalSsid').value;
      const pass = document.getElementById('wifiPassword').value;
      
      if (!ssid) {
        alert.innerText = "Por favor selecciona o escribe el nombre de una red WiFi.";
        alert.style.display = 'block';
        return;
      }
      
      alert.style.display = 'none';
      btn.disabled = true;
      btn.innerText = "Verificando contraseña en la caja...";
      
      const params = new URLSearchParams();
      params.append('ssid', ssid);
      params.append('password', pass);

      fetch('/save', { method: 'POST', body: params })
        .then(async r => {
          if (r.ok) {
            const html = await r.text();
            document.open();
            document.write(html);
            document.close();
          } else {
            const data = await r.json();
            alert.innerText = data.message || "Contraseña incorrecta o red inalcanzable. Intenta nuevamente.";
            alert.style.display = 'block';
            btn.disabled = false;
            btn.innerText = "Conectar Caja a Internet";
          }
        })
        .catch(err => {
          alert.innerText = "La conexión excedió el tiempo de espera. Verifica si el LED de la placa indica éxito.";
          alert.style.display = 'block';
          btn.disabled = false;
          btn.innerText = "Reintentar Conexión";
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
    .icon { margin-bottom: 24px; display: flex; justify-content: center; }
    .icon svg { width: 72px; height: 72px; color: #4ae076; animation: scaleUp 0.5s ease-out; }
    h1 { color: #4ae076; font-size: 28px; font-weight: 800; margin-bottom: 12px; letter-spacing: 0.5px; }
    p { color: #a1a1aa; line-height: 1.6; font-size: 15px; margin-bottom: 8px; }
    .info-box { background: rgba(52, 168, 83, 0.1); border: 1px solid rgba(52, 168, 83, 0.3); padding: 16px; border-radius: 12px; margin-top: 24px; font-size: 15px; color: #86efac; font-weight: 500; }
    @keyframes scaleUp { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  </style>
</head>
<body>
  <div class='container'>
    <div class='icon'>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
    <h1>Credenciales Registradas</h1>
    <p>La caja Arachiz está iniciando conexión con tu router.</p>
    <p>Ya puedes cerrar esta pestaña en tu navegador.</p>
    <div class='info-box'>
      puedes volver a conectarte a tu red, arachiz se encargará del resto...
    </div>
  </div>
</body>
</html>
)rawliteral";

void iniciarPortalConfig() {
  // Configurar máxima sensibilidad de recepción para el escáner WiFi
  WiFi.setSleepMode(WIFI_NONE_SLEEP); // Desactiva ahorro energético de radio para escanear con 100% de potencia
  WiFi.mode(WIFI_AP_STA);             // Habilitar modo dual AP+STA para liberar el sintetizador del canal 1
  WiFi.disconnect(true);              // Desvinculación limpia de intentos STA previos
  
  WiFi.softAP("ARACHIZ-CONFIG");
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
  
  mostrarMensaje("CONFIGURAR", "CONEXION EN RED:", "ARACHIZ-CONFIG...");
  
  // Escaneo en segundo plano para inicializar la lista y evitar retardos
  WiFi.scanNetworks(true, true);
  
  server.on("/logo.png", HTTP_GET, []() {
    server.send_P(200, "image/png", (const char*)LOGO_PNG_DATA, LOGO_PNG_SIZE);
  });
  
  server.on("/scan", HTTP_GET, []() {
    // Escaneo síncrono completo con soporte para redes ocultas y máxima cobertura 2.4 GHz
    int n = WiFi.scanNetworks(false, true);
    String json = "[";
    for (int i = 0; i < n; ++i) {
      if (i > 0) json += ",";
      json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + ",\"enc\":" + String(WiFi.encryptionType(i) != ENC_TYPE_NONE ? "true" : "false") + "}";
    }
    json += "]";
    WiFi.scanDelete(); // Limpia la tabla RAM del driver para evitar desbordamientos entre búsquedas
    server.send(200, "application/json", json);
  });

  server.onNotFound([]() {
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/", HTTP_GET, []() {
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/generate_204", HTTP_GET, []() {
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/fwlink", HTTP_GET, []() {
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/hotspot-detect.html", HTTP_GET, []() {
    server.send_P(200, "text/html", HTML_CONFIG);
  });
  
  server.on("/save", HTTP_POST, []() {
    String ssid = server.arg("ssid");
    String password = server.arg("password");
    
    Serial.println("Probando SSID: " + ssid);
    
    if (ssid.length() == 0) {
      server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Nombre de red requerido\"}");
      return;
    }

    mostrarMensaje("PROBANDO WIFI", ssid, "Verificando...");
    
    // Prueba real de conexión en modo dual para no perder enlace con el móvil
    WiFi.mode(WIFI_AP_STA);
    WiFi.begin(ssid, password);
    
    int intentos = 0;
    while (WiFi.status() != WL_CONNECTED && intentos < 14) { // ~7 segundos de verificación
      delay(500);
      intentos++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Conexión exitosa a WiFi!");
      guardarConfigWiFi(ssid, password);
      mostrarLogo(); // Dibuja inmediatamente el logotipo oficial al triunfar
      server.send_P(200, "text/html", HTML_SUCCESS);
      delay(3000);
      ESP.restart();
    } else {
      Serial.println("Error: Contraseña incorrecta o red inalcanzable");
      WiFi.disconnect();
      WiFi.mode(WIFI_AP);
      mostrarMensaje("ERROR DE RED", "CLAVE INCORRECTA", "INTENTA DE NUEVO");
      delay(2500);
      mostrarMensaje("CONFIGURAR", "CONEXION EN RED:", "ARACHIZ-CONFIG...");
      server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Contraseña incorrecta o red inalcanzable. Verifícala e intenta nuevamente.\"}");
    }
  });
  
  server.on("/reset", HTTP_POST, []() {
    borrarConfigWiFi();
    server.send(200, "text/plain", "Memoria restablecida con éxito. Reiniciando dispositivo...");
    delay(1000);
    ESP.restart();
  });
  
  server.begin();
  Serial.println("Portal cautivo iniciado en 192.168.4.1");
}

void conectarWifi() {
  if (!wifiConfig.configured) {
    mostrarMensaje("CONFIGURAR", "CONEXION EN RED:", "ARACHIZ-CONFIG...");
    delay(1000);
    iniciarPortalConfig();
    return;
  }
  
  mostrarMensaje("CONECTANDO A:", wifiConfig.ssid, "Por favor espere...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiConfig.ssid, wifiConfig.password);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500); 
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    mostrarMensaje("CONEXION EXITOSA", WiFi.localIP().toString(), "Iniciando...");
    Serial.println("Conectado exitosamente!");
    delay(1500);
    mostrarLogo(); // Dibuja el logotipo en OLED tras conectar al WiFi
    consultarEstadoSesion();
  } else {
    mostrarMensaje("ERROR DE CONEXION", "WIFI INALCANZABLE", "MANTENIENDO CONFIG");
    Serial.println("ERROR: No se pudo conectar al WiFi");
    delay(4000);
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
