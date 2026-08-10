#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include "LogoPNG.h"

// --- LIBRERÍAS BLUETOOTH LOW ENERGY (BLE 4.2 / 5.0) PARA ESP32 ---
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

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

const byte DNS_PORT = 53;
DNSServer dnsServer;
WebServer server(80);

// MODO DE PRUEBAS DE HARDWARE SIN INTERNET NI BLUETOOTH ENLAZADO
bool MODO_SOLO_CONEXION = false;

// --- CONFIGURACIÓN BLUETOOTH (BLE GATT SERVER) ---
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E" // UART Service UUID para Web Bluetooth API
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E" // Recepción de comandos desde Móvil/PC
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" // Transmisión en vivo de huellas y RFID

BLEServer* pServer = NULL;
BLECharacteristic* pTxCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// --- CONFIGURACIÓN BACKEND ---
const char* URL_RENDER_EVENT = "https://arachiz-backend.onrender.com/api/hardware/event";
const char* URL_RENDER_CMD   = "https://arachiz-backend.onrender.com/api/hardware/commands";
const char* API_KEY          = "arachiz-esp-2024";

WiFiClientSecure persistentClient;

// --- COMUNICACIÓN POR HARDWARE SERIAL CON ARDUINO (ESP32 UART2) ---
// En tu Arduino Uno mantienes los mismos Pines 8 (RX) y 9 (TX).
// GPIO 16 (RX2 en ESP32) -> Conectar al Pin 9 del Arduino (TX)
// GPIO 17 (TX2 en ESP32) -> Conectar al Pin 8 del Arduino (RX)
#define RXD2 16
#define TXD2 17
HardwareSerial arduinoSerial(2);

unsigned long ultimoMensaje = 0;
String pendingCommand = ""; // Cola para garantizar entrega sincronizada con POLL de Arduino

// --- PROTOTIPOS DE FUNCIONES EN C++ ---
void logEstado(String l1, String l2 = "", String l3 = "");
void cargarConfigWiFi();
void guardarConfigWiFi(const char* ssid, const char* pass);
void borrarConfigWiFi();
void iniciarPortalConfig();
void conectarWifi();
void consultarEstadoSesion();
void consultarComandos();
void enviarLecturaBackend(String endpoint, String payload);
void iniciarServidorBLE();
void procesarComandoBLE(String comando);

// --- CALLBACKS DE BLUETOOTH BLE ---
class ArachizServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    logEstado("BLE ENLAZADO", "Dispositivo Conectado", "Modo Dual Activo");
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    logEstado("BLE DESCONECTADO", "Reiniciando anuncio...", "");
    pServer->startAdvertising(); // Reiniciar anuncio para reconexiones instantáneas
  }
};

class ArachizRxCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue();
    rxValue.trim();
    if (rxValue.length() > 0) {
      logEstado("[BLE Recibido]", rxValue);
      procesarComandoBLE(rxValue);
    }
  }
};

// --- IMPLEMENTACIÓN DE FUNCIONES DE LOG DE ESTADO (ESP32 Sin Pantalla) ---
void logEstado(String l1, String l2, String l3) {
  Serial.print("[STATE] " + l1);
  if (l2 != "") Serial.print(" | " + l2);
  if (l3 != "") Serial.print(" | " + l3);
  Serial.println();
  ultimoMensaje = millis();
}

void cargarConfigWiFi() {
  EEPROM.begin(EEPROM_SIZE);
  byte configuredFlag = EEPROM.read(CONFIGURED_FLAG_ADDR);
  
  if (configuredFlag == 0xAA) {
    wifiConfig.configured = true;
    for (int i = 0; i < 64; i++) {
      wifiConfig.ssid[i] = EEPROM.read(SSID_ADDR + i);
      wifiConfig.password[i] = EEPROM.read(PASS_ADDR + i);
    }
  } else {
    wifiConfig.configured = false;
  }
}

void guardarConfigWiFi(const char* ssid, const char* pass) {
  EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < 64; i++) {
    EEPROM.write(SSID_ADDR + i, 0);
    EEPROM.write(PASS_ADDR + i, 0);
  }
  for (int i = 0; i < strlen(ssid) && i < 63; i++) {
    EEPROM.write(SSID_ADDR + i, ssid[i]);
  }
  for (int i = 0; i < strlen(pass) && i < 63; i++) {
    EEPROM.write(PASS_ADDR + i, pass[i]);
  }
  EEPROM.write(CONFIGURED_FLAG_ADDR, 0xAA);
  EEPROM.commit();
  wifiConfig.configured = true;
}

void borrarConfigWiFi() {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.write(CONFIGURED_FLAG_ADDR, 0x00);
  EEPROM.commit();
  wifiConfig.configured = false;
  logEstado("MEMORIA BORRADA", "WiFi Reset", "Reiniciando...");
  delay(1500);
  ESP.restart();
}

// ========== SERVIDOR WEB PORTAL CAUTIVO ==========
const char HTML_CONFIG[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>ARACHIZ ESP32 - Portal Dual</title>
  <style>
    :root { --primary: #4285F4; --success: #34A853; --bg: #09090b; --card: #18181b; --border: #27272a; --text: #f4f4f5; --text-muted: #a1a1aa; }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
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
    #manualInput { display: none; margin-top: 10px; }
    .alert-box { display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 14px; border-radius: 12px; font-size: 14px; margin-bottom: 20px; font-weight: 500; }
  </style>
</head>
<body>
  <div class='container'>
    <div class='logo-container'>
      <img src='/logo.png' alt='Arachiz Logo' class='logo-img'>
    </div>
    <div class='header'>
      <p>Portal de Configuración ESP32</p>
    </div>
    
    <div class='badge'>
      <span>Dual Mode: Wi-Fi + Bluetooth BLE Activo</span>
    </div>

    <div id='alertBox' class='alert-box'></div>
    
    <form id='wifiForm' onsubmit='guardarRed(event)'>
      <div class='form-group'>
        <div class='label-row'>
          <label>Red WiFi (SSID 2.4 GHz)</label>
          <button type='button' class='btn-scan' onclick='escanearRedes()' id='scanBtn'>
            <span>Escanear Redes</span>
          </button>
        </div>
        
        <div id='networkList' class='network-list'>
          <div class='network-item' style='justify-content:center; color: #a1a1aa;'>Buscando redes disponibles...</div>
        </div>

        <div id='manualInput'>
          <input type='text' id='customSsid' placeholder='Escribe el nombre del WiFi'>
        </div>
        <input type='hidden' id='finalSsid'>
      </div>

      <div class='form-group'>
        <label>Contraseña</label>
        <div class='input-wrapper' style='margin-top:8px;'>
          <input type='password' id='wifiPassword' placeholder='Contraseña de tu router o móvil' required>
          <button type='button' class='toggle-pass' onclick='togglePass()'>Ver</button>
        </div>
      </div>

      <button type='submit' class='btn-submit' id='submitBtn'>Conectar Caja Arachiz</button>
    </form>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', escanearRedes);

    function togglePass() {
      const input = document.getElementById('wifiPassword');
      const btn = document.querySelector('.toggle-pass');
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerText = 'Ocultar';
      } else {
        input.type = 'password';
        btn.innerText = 'Ver';
      }
    }

    function escanearRedes() {
      const btn = document.getElementById('scanBtn');
      const list = document.getElementById('networkList');
      const alert = document.getElementById('alertBox');
      alert.style.display = 'none';
      
      btn.disabled = true;
      list.innerHTML = "<div class='network-item' style='justify-content:center; color: #a1a1aa;'>Escaneando canales 2.4GHz...</div>";

      fetch('/scan')
        .then(res => res.json())
        .then(data => {
          list.innerHTML = '';
          if (data.length === 0) {
            list.innerHTML = "<div class='network-item' style='color:#a1a1aa;'>No se detectaron redes.</div>";
          } else {
            data.forEach(red => {
              const div = document.createElement('div');
              div.className = 'network-item';
              div.onclick = () => selectNetwork(div, red.ssid);
              let signalClass = 'signal-strong', signalText = 'Fuerte';
              if (red.rssi < -75) { signalClass = 'signal-weak'; signalText = 'Debil'; }
              else if (red.rssi < -65) { signalClass = 'signal-med'; signalText = 'Media'; }
              div.innerHTML = `<span>${red.ssid}</span><span class='signal-badge ${signalClass}'>${signalText} (${red.rssi} dBm)</span>`;
              list.appendChild(div);
            });
          }
          const manualDiv = document.createElement('div');
          manualDiv.className = 'network-item';
          manualDiv.style.color = '#60a5fa';
          manualDiv.onclick = () => selectNetwork(manualDiv, '__MANUAL__');
          manualDiv.innerHTML = "<span>+ Agregar red manual...</span>";
          list.appendChild(manualDiv);
          btn.disabled = false;
        })
        .catch(e => {
          list.innerHTML = "<div class='network-item' style='color:#f87171'>Error de lectura. Reintentar.</div>";
          btn.disabled = false;
        });
    }

    function selectNetwork(el, ssid) {
      document.querySelectorAll('.network-item').forEach(item => item.classList.remove('selected'));
      el.classList.add('selected');
      const manualDiv = document.getElementById('manualInput');
      const finalInput = document.getElementById('finalSsid');
      if (ssid === '__MANUAL__') {
        manualDiv.style.display = 'block';
        document.getElementById('customSsid').focus();
      } else {
        manualDiv.style.display = 'none';
        finalInput.value = ssid;
        document.getElementById('wifiPassword').focus();
      }
    }

    function guardarRed(e) {
      e.preventDefault();
      const alert = document.getElementById('alertBox');
      const ssid = document.getElementById('finalSsid').value || document.getElementById('customSsid').value;
      const pass = document.getElementById('wifiPassword').value;
      if (!ssid) { alert.innerText = "Selecciona o escribe el nombre del WiFi."; alert.style.display = 'block'; return; }
      
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('submitBtn').innerText = 'Conectando en nube...';

      fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(pass)}`
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          window.location.href = '/success.html';
        } else {
          alert.innerText = "Fallo de autenticación WiFi. Revisa tu clave.";
          alert.style.display = 'block';
          document.getElementById('submitBtn').disabled = false;
          document.getElementById('submitBtn').innerText = 'Reintentar Conexión';
        }
      })
      .catch(err => {
        window.location.href = '/success.html';
      });
    }
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
  <title>Arachiz ESP32 - Enlazado</title>
  <style>
    :root { --primary: #4285F4; --success: #34A853; --bg: #09090b; --card: #18181b; --border: #27272a; --text: #f4f4f5; }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { background-color: var(--bg); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; color: var(--text); }
    .container { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 36px; max-width: 440px; width: 100%; text-align: center; }
    .logo-container { background: #000000; border: 1px solid #27272a; padding: 18px 24px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .logo-img { max-height: 54px; width: auto; filter: invert(100%); display: block; }
    h1 { color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 12px; }
    p { color: #a1a1aa; font-size: 15px; line-height: 1.5; margin-bottom: 12px; }
    .box { background: rgba(66, 133, 244, 0.1); border: 1px solid rgba(66, 133, 244, 0.3); color: #60a5fa; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class='container'>
    <div class='logo-container'>
      <img src='/logo.png' alt='Arachiz Logo' class='logo-img'>
    </div>
    <h1>Conexión ESP32 Registrada</h1>
    <p>La Caja Arachiz está enlazándose a tu red inalámbrica a alta velocidad.</p>
    <div class='box'>Puedes volver a conectarte a tu internet habitual o utilizar el modo Bluetooth BLE en cualquier momento.</div>
  </div>
</body>
</html>
)rawliteral";

void iniciarPortalConfig() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect(true);
  
  IPAddress apIP(192, 168, 4, 1);
  IPAddress netMsk(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP("ARACHIZ-CONFIG", "", 1, 0, 4);
  
  dnsServer.start(DNS_PORT, "*", apIP);
  logEstado("CONFIGURAR", "WIFI: ARACHIZ-CONFIG", "O conecta por BLE");
  
  server.on("/logo.png", HTTP_GET, []() {
    server.send_P(200, "image/png", (const char*)LOGO_PNG_DATA, LOGO_PNG_SIZE);
  });
  
  server.on("/scan", HTTP_GET, []() {
    int n = WiFi.scanNetworks(false, true);
    String json = "[";
    for (int i = 0; i < n; ++i) {
      if (i > 0) json += ",";
      json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + ",\"enc\":" + String(WiFi.encryptionType(i) != WIFI_AUTH_OPEN ? "true" : "false") + "}";
    }
    json += "]";
    WiFi.scanDelete();
    server.send(200, "application/json", json);
  });
  
  server.on("/save", HTTP_POST, []() {
    String ssid = server.arg("ssid");
    String pass = server.arg("password");
    if (ssid.length() == 0) {
      server.send(400, "application/json", "{\"status\":\"error\"}");
      return;
    }
    logEstado("CONECTANDO...", ssid, "Verificando...");
    WiFi.begin(ssid.c_str(), pass.c_str());
    
    int intentos = 0;
    while (WiFi.status() != WL_CONNECTED && intentos < 14) {
      delay(500);
      intentos++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      guardarConfigWiFi(ssid.c_str(), pass.c_str());
      server.send(200, "application/json", "{\"status\":\"success\"}");
      delay(1000);
      ESP.restart();
    } else {
      WiFi.disconnect();
      server.send(401, "application/json", "{\"status\":\"error\"}");
    }
  });

  server.on("/success.html", HTTP_GET, []() { server.send_P(200, "text/html", HTML_SUCCESS); });
  server.on("/", HTTP_GET, []() { server.send_P(200, "text/html", HTML_CONFIG); });
  server.on("/generate_204", HTTP_GET, []() { server.send_P(200, "text/html", HTML_CONFIG); });
  server.on("/gen_204", HTTP_GET, []() { server.send_P(200, "text/html", HTML_CONFIG); });
  server.on("/hotspot-detect.html", HTTP_GET, []() { server.send_P(200, "text/html", HTML_CONFIG); });
  server.onNotFound([]() { server.send_P(200, "text/html", HTML_CONFIG); });
  
  server.begin();
  Serial.println("[ESP32] Portal Cautivo HTTP Activo en 192.168.4.1");
}

void iniciarServidorBLE() {
  BLEDevice::init("ARACHIZ-BLE-ESP32");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ArachizServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Característica para enviar huellas y RFID al celular (Notify)
  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );
  pTxCharacteristic->addDescriptor(new BLE2902());

  // Característica para recibir comandos desde el celular o PC (Write)
  BLECharacteristic * pRxCharacteristic = pService->createCharacteristic(
                       CHARACTERISTIC_UUID_RX,
                       BLECharacteristic::PROPERTY_WRITE
                     );
  pRxCharacteristic->setCallbacks(new ArachizRxCallbacks());

  pService->start();
  pServer->getAdvertising()->start();
  Serial.println("[BLE] Servidor GATT iniciado. Listo para emparejamiento Web Bluetooth.");
}

void procesarComandoBLE(String comando) {
  comando.trim();
  if (comando.startsWith("WIFI_SETUP:")) {
    String datos = comando.substring(11);
    int idx = datos.indexOf('|');
    if (idx != -1) {
      String newSsid = datos.substring(0, idx);
      String newPass = datos.substring(idx + 1);
      newSsid.trim();
      newPass.trim();
      logEstado("BLE -> WIFI", "Recibida Red:", newSsid);
      guardarConfigWiFi(newSsid.c_str(), newPass.c_str());
      delay(1000);
      ESP.restart();
    }
  } else if (comando == "STATUS") {
    String estado = "WIFI:" + String(WiFi.status() == WL_CONNECTED ? "ONLINE" : "OFFLINE") + ",BLE:ACTIVE,HARDWARE:ESP32";
    if (deviceConnected && pTxCharacteristic) {
      pTxCharacteristic->setValue(estado.c_str());
      pTxCharacteristic->notify();
    }
  } else {
    // Encolar comando para cuando el Arduino haga POLL y esté escuchando con SoftwareSerial
    pendingCommand = comando;
    Serial.println("[BLE -> Encolado POLL]: " + comando);
  }
}

void conectarWifi() {
  if (WiFi.status() == WL_CONNECTED || MODO_SOLO_CONEXION) return;
  if (!wifiConfig.configured) {
    iniciarPortalConfig();
    return;
  }
  
  logEstado("WIFI ESP32", "Conectando:", wifiConfig.ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiConfig.ssid, wifiConfig.password);
  
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt < 8000)) {
    delay(400);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[ESP32 Wi-Fi Conectado] IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[Fallo WiFi] Abriendo portal dual...");
    iniciarPortalConfig();
  }
}

void setup() {
  Serial.begin(115200);
  while(!Serial) delay(10);
  Serial.println("\n--- INICIANDO ARACHIZ ESP32 DUAL MASTER (SIN PANTALLA) ---");

  // Inicializar comunicación con Arduino Uno (Hardware UART2: RX2=16, TX2=17)
  arduinoSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);

  // Inicializar servidor Bluetooth BLE
  iniciarServidorBLE();

  // Cargar configuración WiFi e iniciar conexión dual
  cargarConfigWiFi();
  if (!MODO_SOLO_CONEXION) {
    conectarWifi();
  }

  persistentClient.setInsecure(); // Acepta certificados de Vercel/Render
}

void consultarEstadoSesion() {
  if (WiFi.status() != WL_CONNECTED || MODO_SOLO_CONEXION) return;
  HTTPClient http;
  http.begin(persistentClient, "https://arachiz-backend.onrender.com/api/hardware/status");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(3000);
  
  int httpCode = http.GET();
  if (httpCode > 0) {
    String payload = http.getString();
    DynamicJsonDocument doc(256);
    if (!deserializeJson(doc, payload)) {
      if (doc["reset_wifi"] == true) {
        borrarConfigWiFi();
      }
    }
  }
  http.end();
}

void consultarComandos() {
  if (WiFi.status() != WL_CONNECTED || MODO_SOLO_CONEXION) return;
  HTTPClient http;
  http.begin(persistentClient, URL_RENDER_CMD);
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(2500);
  
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(512);
    if (!deserializeJson(doc, payload)) {
      if (doc["command"].is<String>()) {
        String comando = doc["command"].as<String>();
        if (comando != "NONE" && comando.length() > 0) {
          pendingCommand = comando;
          Serial.println("[Nube -> Encolado POLL]: " + comando);
        }
      }
    }
  }
  http.end();
}

void enviarLecturaBackend(String tipo, String valor) {
  // 1. Notificar inmediatamente por Bluetooth BLE si hay móvil conectado
  if (deviceConnected && pTxCharacteristic) {
    String blePayload = "READ:" + tipo + "|" + valor;
    pTxCharacteristic->setValue(blePayload.c_str());
    pTxCharacteristic->notify();
    Serial.println("[BLE Notificado]: " + blePayload);
  }

  // 2. Enviar por Wi-Fi HTTP si el internet está online
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(persistentClient, URL_RENDER_EVENT);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", API_KEY);
    http.setTimeout(4000);
    
    String jsonBody = "{\"type\":\"" + tipo + "\",\"payload\":\"" + valor + "\"}";
    int httpCode = http.POST(jsonBody);
    Serial.println("[HTTP Envío Nube] Código: " + String(httpCode));
    http.end();
  }
}

void loop() {
  // Re-anunciar BLE tras desconexión
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  if (!wifiConfig.configured && !MODO_SOLO_CONEXION) {
    dnsServer.processNextRequest();
    server.handleClient();
  } else if (!MODO_SOLO_CONEXION && WiFi.status() != WL_CONNECTED) {
    conectarWifi();
  }

  // Consultar comandos a la nube cada 600ms en modo Wi-Fi
  static unsigned long lastCheck = 0;
  if (!MODO_SOLO_CONEXION && WiFi.status() == WL_CONNECTED && (millis() - lastCheck > 600)) {
    lastCheck = millis();
    consultarComandos();
  }

  // Escuchar lecturas del Arduino por cable UART2 (TX/RX)
  if (arduinoSerial.available()) {
    arduinoSerial.setTimeout(50);
    String msg = arduinoSerial.readStringUntil('\n');
    msg.trim();
    
    // Filtro ASCII limpio
    String limpio = "";
    for (int i = 0; i < msg.length(); i++) {
      char c = msg[i];
      if (c >= 32 && c < 127) limpio += c;
    }
    msg = limpio;
    if (msg.length() == 0) return;
    
    // El Arduino hace POLL preguntando si hay comandos pendientes en su ventana de escucha
    if (msg == "POLL") {
      if (pendingCommand.length() > 0) {
        Serial.println("[POLL] -> " + pendingCommand);
        delay(5);
        arduinoSerial.println(pendingCommand);
        pendingCommand = "";
      } else {
        delay(5);
        arduinoSerial.println("NONE");
      }
      return;
    }

    Serial.println("Arduino -> ESP32: " + msg);
    if (msg.startsWith("EVT:")) msg = msg.substring(4);
    
    if (msg.startsWith("READ_NFC:")) {
      String uid = msg.substring(9); uid.trim();
      logEstado("LECTURA RFID", "ID: " + uid, deviceConnected ? "Vía Bluetooth BLE" : "Vía Wi-Fi");
      enviarLecturaBackend("RFID", uid);
    } else if (msg.startsWith("READ_FINGER:")) {
      String id = msg.substring(12); id.trim();
      logEstado("HUELLA LEIDA", "ID: " + id, deviceConnected ? "Vía Bluetooth BLE" : "Vía Wi-Fi");
      enviarLecturaBackend("FINGERPRINT", id);
    } else if (msg.startsWith("ENROLL_SUCCESS:")) {
      String id = msg.substring(15); id.trim();
      logEstado("REGISTRO OK", "Huella ID: " + id);
      enviarLecturaBackend("ENROLL_SUCCESS", id);
    } else if (msg.startsWith("ENROLL_ERROR:")) {
      String err = msg.substring(13); err.trim();
      logEstado("ERROR REGISTRO", err);
      enviarLecturaBackend("ENROLL_ERROR", err);
    } else if (msg.startsWith("ENROLL_STEP:")) {
      String step = msg.substring(12); step.trim();
      logEstado("PASO REGISTRO", "Captura " + step + "/2 OK");
      enviarLecturaBackend("ENROLL_STEP", step);
    }
  }
}
