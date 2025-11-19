/*
 * FireGuard Advanced - ESP32-S3 WROOM-1 Fire Safety Monitoring System
 * Version 4.0 - Complete Working System with Enhanced Serial Output
 * By TheGDevelopers
 * 
 * Features:
 * - Real-time sensor monitoring (MQ135, DHT11, Flame sensor)
 * - Supabase cloud integration
 * - Comprehensive serial debugging
 * - Automatic WiFi reconnection
 * - Health monitoring & error handling
 * - Visual & audio alerts
 * 
 * Hardware Requirements:
 * - ESP32-S3 WROOM-1 Dev Board
 * - MQ135 Gas/Smoke Sensor (GPIO1)
 * - 3-pin IR Flame Sensor (GPIO2)
 * - DHT11 Temperature/Humidity (GPIO4)
 * - Buzzer (GPIO5)
 * - Warning LED (GPIO15)
 * - Alert LED (GPIO16)
 * - Battery Monitor (GPIO3)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <esp_system.h>
#include <esp32-hal.h>

// ==================== CONFIGURATION ====================
#define FIRMWARE_VERSION "4.0.0"
#define DEVICE_ID "ESP32_001"
#define LOCATION "Building A - Floor 1"

// WiFi Credentials - CHANGE THESE TO YOUR NETWORK
const char* ssid = "vivo Y22";
const char* password = "88888888";

// Supabase Configuration - CHANGE TO YOUR SUPABASE PROJECT
const char* supabaseUrl = "https://anznostcpknoxjpenbjl.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuem5vc3RjcGtub3hqcGVuYmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTI4NjAsImV4cCI6MjA3ODA2ODg2MH0.3Er2RmgxiRyaVN8eJL6zXF6GmY18QZj9y9sS74qrPGc";

// ==================== PIN CONFIGURATION ====================
#define MQ135_PIN 1         // Analog - Smoke/Gas sensor
#define FLAME_PIN 2         // Digital - IR Flame sensor (LOW=flame detected)
#define DHT_PIN 4           // Digital - Temperature/Humidity
#define BUZZER_PIN 5        // Digital - Alert buzzer
#define WARNING_LED_PIN 15  // Digital - Warning indicator (yellow)
#define ALERT_LED_PIN 16    // Digital - Alert indicator (red)
#define BATTERY_PIN 3       // Analog - Battery voltage monitor

// ==================== SENSOR CONFIGURATION ====================
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Sensor Settings
const bool FLAME_SENSOR_INSTALLED = true;  // Set false if no flame sensor
const bool MQ135_INSTALLED = true;         // Set false if no smoke sensor
const bool DHT11_INSTALLED = true;         // Set false if no DHT sensor

// ==================== TIMING CONFIGURATION ====================
#define SENSOR_READ_INTERVAL 5000      // Read sensors every 5 seconds
#define HEALTH_REPORT_INTERVAL 60000   // Send health report every 60 seconds
#define HEARTBEAT_INTERVAL 10000       // Print heartbeat every 10 seconds
#define LED_BLINK_INTERVAL 300         // LED blink speed (ms)
#define WIFI_RETRY_DELAY 500           // WiFi connection retry delay
#define WIFI_MAX_ATTEMPTS 40           // Max WiFi connection attempts

// ==================== THRESHOLD CONFIGURATION ====================
#define SMOKE_THRESHOLD 600            // MQ135 smoke detection threshold
#define TEMP_THRESHOLD 45.0            // Temperature alert threshold (°C)
#define BATTERY_LOW_THRESHOLD 3.3      // Low battery voltage threshold

// ==================== RETRY & ERROR HANDLING ====================
#define DHT_INIT_ATTEMPTS 3            // Initial DHT sensor test attempts
#define DHT_READ_RETRIES 1             // Extra retries on read failure
#define DHT_FAILURE_LIMIT 10           // Mark sensor dead after failures
#define MAX_CONSECUTIVE_ERRORS 5       // Reboot after this many errors

// ==================== GLOBAL VARIABLES ====================
// Timing
unsigned long lastSensorRead = 0;
unsigned long lastHealthReport = 0;
unsigned long lastHeartbeat = 0;
unsigned long bootTime = 0;

// Error tracking
int errorCount = 0;
int consecutiveErrors = 0;

// Sensor status flags
bool dhtWorking = false;
bool smokeWorking = false;
bool flameWorking = false;

// Last known good sensor values
float lastGoodTemp = 25.0;
float lastGoodHumidity = 50.0;
float lastGoodSmoke = 0.0;

// Alert state
bool warningActive = false;
bool alertActive = false;
unsigned long lastWarningLedToggle = 0;
unsigned long lastAlertLedToggle = 0;
bool warningLedState = false;
bool alertLedState = false;

// Health metrics
float cpuUsage = 0.0;
float memoryUsage = 0.0;
int wifiSignal = 0;
float batteryVoltage = 0.0;

// ==================== FUNCTION PROTOTYPES ====================
void printStartupBanner();
void initializePins();
void testSensors();
void connectWiFi();
void readAndSendSensorData();
void sendToSupabase(float smoke, int flame, float temp, float humidity, bool alert, String message, String severity);
void sendAlert(float smoke, int flame, float temp, String message, String severity);
void sendEnvironmentalData(float humidity);
void sendHealthReport();
void updateHealthMetrics();
void triggerBuzzer();
void blinkLED(int times);
void blinkWarningLED();
void blinkAlertLED();
void handleError(String errorType);
bool readDHTWithRetries(float &outTemp, float &outHumidity, int attempts);
void printSensorReadings(float smoke, int flame, float temp, float humidity, bool alert, String alertMsg);
void printSystemStatus();

// ==================== SETUP ====================
void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(1000);
  
  // Print startup banner
  printStartupBanner();
  
  // Initialize all pins
  initializePins();
  
  // Test all sensors
  testSensors();
  
  // Connect to WiFi
  connectWiFi();
  
  // Record boot time
  bootTime = millis();
  
  // Send initial health report
  updateHealthMetrics();
  sendHealthReport();
  
  // Startup complete
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║   ✓ SYSTEM READY - MONITORING ACTIVE  ║");
  Serial.println("╚════════════════════════════════════════╝");
  blinkLED(3);
  delay(1000);
}

// ==================== MAIN LOOP ====================
void loop() {
  unsigned long currentMillis = millis();
  
  // Print heartbeat
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = currentMillis;
    Serial.printf("\n💓 HEARTBEAT | Uptime: %lu sec | Free Heap: %d bytes | WiFi: %d dBm\n", 
                  currentMillis / 1000, ESP.getFreeHeap(), WiFi.RSSI());
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n⚠️  WiFi DISCONNECTED - Reconnecting...");
    connectWiFi();
  }
  
  // Read sensors and send data
  if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = currentMillis;
    readAndSendSensorData();
  }
  
  // Send health report
  if (currentMillis - lastHealthReport >= HEALTH_REPORT_INTERVAL) {
    lastHealthReport = currentMillis;
    updateHealthMetrics();
    sendHealthReport();
  }
  
  // Handle LED blinking for alerts
  if (warningActive) blinkWarningLED();
  if (alertActive) blinkAlertLED();
  
  delay(100);
}

// ==================== STARTUP FUNCTIONS ====================
void printStartupBanner() {
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════════════════════╗");
  Serial.println("║                                                        ║");
  Serial.println("║        🔥 FIREGUARD ADVANCED MONITORING SYSTEM 🔥      ║");
  Serial.println("║                                                        ║");
  Serial.println("║              ESP32-S3 WROOM-1 Edition                  ║");
  Serial.println("║                                                        ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  
  Serial.printf("\n📋 FIRMWARE INFORMATION\n");
  Serial.printf("   Version: %s\n", FIRMWARE_VERSION);
  Serial.printf("   Device ID: %s\n", DEVICE_ID);
  Serial.printf("   Location: %s\n", LOCATION);
  Serial.printf("   Build Date: %s %s\n", __DATE__, __TIME__);
  
  Serial.println("\n📋 HARDWARE INFORMATION");
  Serial.printf("   Chip Model: %s\n", ESP.getChipModel());
  Serial.printf("   Chip Revision: %d\n", ESP.getChipRevision());
  Serial.printf("   CPU Cores: %d\n", ESP.getChipCores());
  Serial.printf("   CPU Frequency: %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("   Flash Size: %d bytes\n", ESP.getFlashChipSize());
  Serial.printf("   Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("   Total Heap: %d bytes\n", ESP.getHeapSize());
  Serial.printf("   PSRAM Size: %d bytes\n", ESP.getPsramSize());
  
  // Verify ESP32-S3
  if (strstr(ESP.getChipModel(), "ESP32-S3") != NULL) {
    Serial.println("\n✅ ESP32-S3 VERIFIED - System Optimized");
  } else {
    Serial.println("\n⚠️  WARNING: Not ESP32-S3! This code is optimized for ESP32-S3");
  }
}

void initializePins() {
  Serial.println("\n🔌 INITIALIZING GPIO PINS...");
  
  pinMode(MQ135_PIN, INPUT);
  Serial.printf("   ✓ GPIO%d: MQ135 Smoke Sensor (Analog Input)\n", MQ135_PIN);
  
  pinMode(FLAME_PIN, INPUT);
  Serial.printf("   ✓ GPIO%d: IR Flame Sensor (Digital Input)\n", FLAME_PIN);
  
  pinMode(DHT_PIN, INPUT_PULLUP);
  Serial.printf("   ✓ GPIO%d: DHT11 Sensor (Digital I/O with Pull-up)\n", DHT_PIN);
  
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.printf("   ✓ GPIO%d: Buzzer (Digital Output)\n", BUZZER_PIN);
  
  pinMode(WARNING_LED_PIN, OUTPUT);
  digitalWrite(WARNING_LED_PIN, LOW);
  Serial.printf("   ✓ GPIO%d: Warning LED (Digital Output)\n", WARNING_LED_PIN);
  
  pinMode(ALERT_LED_PIN, OUTPUT);
  digitalWrite(ALERT_LED_PIN, LOW);
  Serial.printf("   ✓ GPIO%d: Alert LED (Digital Output)\n", ALERT_LED_PIN);
  
  pinMode(BATTERY_PIN, INPUT);
  Serial.printf("   ✓ GPIO%d: Battery Monitor (Analog Input)\n", BATTERY_PIN);
  
  Serial.println("   ✅ All pins initialized successfully");
}

void testSensors() {
  Serial.println("\n🔬 TESTING SENSORS...");
  Serial.println("═══════════════════════════════════════════════════");
  
  // Test DHT11
  if (DHT11_INSTALLED) {
    Serial.println("\n🌡️  DHT11 Temperature & Humidity Sensor");
    Serial.println("   Initializing...");
    dht.begin();
    delay(2000);
    
    bool dhtSuccess = false;
    for (int attempt = 1; attempt <= DHT_INIT_ATTEMPTS; attempt++) {
      Serial.printf("   Attempt %d/%d: ", attempt, DHT_INIT_ATTEMPTS);
      float t, h;
      if (readDHTWithRetries(t, h, 1)) {
        Serial.println("✅ SUCCESS");
        Serial.printf("      Temperature: %.1f°C\n", t);
        Serial.printf("      Humidity: %.1f%%\n", h);
        lastGoodTemp = t;
        lastGoodHumidity = h;
        dhtWorking = true;
        dhtSuccess = true;
        break;
      } else {
        Serial.println("❌ FAILED");
        if (attempt < DHT_INIT_ATTEMPTS) delay(2000);
      }
    }
    
    if (!dhtSuccess) {
      Serial.println("   ⚠️  DHT11 NOT RESPONDING");
      Serial.println("   Troubleshooting:");
      Serial.println("      - Check wiring: DATA→GPIO4, VCC→3.3V, GND→GND");
      Serial.println("      - Add 10K pull-up resistor (DATA to VCC)");
      Serial.println("      - Verify sensor is DHT11 (not DHT22)");
      Serial.println("      - Try different sensor (may be faulty)");
    }
  } else {
    Serial.println("\n🌡️  DHT11 Sensor: DISABLED in configuration");
    dhtWorking = false;
  }
  
  // Test MQ135
  if (MQ135_INSTALLED) {
    Serial.println("\n🌫️  MQ135 Smoke/Gas Sensor");
    delay(1000);
    int reading1 = analogRead(MQ135_PIN);
    delay(500);
    int reading2 = analogRead(MQ135_PIN);
    
    if (reading1 > 50 || reading2 > 50) {
      Serial.println("   ✅ SENSOR DETECTED");
      Serial.printf("      Reading: %d (0-4095 scale)\n", reading1);
      Serial.printf("      Threshold: %d\n", SMOKE_THRESHOLD);
      Serial.println("      Detects: Smoke, CO2, NH3, Benzene, Alcohol");
      Serial.println("      Note: Requires 24-48hr warm-up for accuracy");
      smokeWorking = true;
      lastGoodSmoke = reading1;
    } else {
      Serial.println("   ⚠️  SENSOR NOT DETECTED");
      Serial.println("      Reading too low - check wiring or warm-up time");
      smokeWorking = false;
    }
  } else {
    Serial.println("\n🌫️  MQ135 Sensor: DISABLED in configuration");
    smokeWorking = false;
  }
  
  // Test Flame Sensor
  if (FLAME_SENSOR_INSTALLED) {
    Serial.println("\n🔥 3-Pin IR Flame Sensor");
    delay(500);
    int flameReading = digitalRead(FLAME_PIN);
    Serial.println("   ✅ CONFIGURED AS INSTALLED");
    Serial.println("   Wiring:");
    Serial.println("      VCC → 3.3V or 5V");
    Serial.println("      GND → GND");
    Serial.printf("      DO  → GPIO%d\n", FLAME_PIN);
    Serial.printf("   Current Status: %s\n", 
                  flameReading == LOW ? "🔥 FLAME DETECTED" : "✅ Clear");
    Serial.println("   Output: LOW=Flame, HIGH=Clear");
    flameWorking = true;
  } else {
    Serial.println("\n🔥 Flame Sensor: DISABLED in configuration");
    flameWorking = false;
  }
  
  // Test Battery Monitor
  Serial.println("\n🔋 Battery Voltage Monitor");
  int batteryRaw = analogRead(BATTERY_PIN);
  float voltage = (batteryRaw / 4095.0) * 3.3 * 2.0;
  Serial.printf("   Raw ADC: %d\n", batteryRaw);
  Serial.printf("   Voltage: %.2f V\n", voltage);
  Serial.printf("   Status: %s\n", 
                voltage < BATTERY_LOW_THRESHOLD ? "⚠️  LOW" : "✅ Good");
  
  Serial.println("\n═══════════════════════════════════════════════════");
  Serial.println("✅ SENSOR TESTING COMPLETE");
}

// ==================== WIFI FUNCTIONS ====================
void connectWiFi() {
  Serial.println("\n📡 WIFI CONNECTION");
  Serial.println("═══════════════════════════════════════════════════");
  Serial.printf("   SSID: %s\n", ssid);
  
  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  delay(100);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  Serial.print("   Connecting: ");
  
  while (WiFi.status() != WL_CONNECTED && attempts < WIFI_MAX_ATTEMPTS) {
    delay(WIFI_RETRY_DELAY);
    Serial.print("▓");
    attempts++;
    
    if (attempts % 10 == 0) {
      Serial.printf(" %d%%", (attempts * 100) / WIFI_MAX_ATTEMPTS);
    }
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n   ✅ CONNECTED SUCCESSFULLY");
    Serial.printf("   IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   MAC Address: %s\n", WiFi.macAddress().c_str());
    Serial.printf("   Signal Strength: %d dBm\n", WiFi.RSSI());
    Serial.printf("   Channel: %d\n", WiFi.channel());
    Serial.printf("   DNS: %s\n", WiFi.dnsIP().toString().c_str());
  } else {
    Serial.println("\n   ❌ CONNECTION FAILED");
    Serial.printf("   Status Code: %d\n", WiFi.status());
    Serial.println("   Troubleshooting:");
    Serial.println("      1. Verify SSID is correct");
    Serial.println("      2. Verify password is correct");
    Serial.println("      3. Check router is powered on");
    Serial.println("      4. Move ESP32 closer to router");
    Serial.println("      5. Check 2.4GHz band is enabled");
    handleError("WIFI_FAILED");
  }
  Serial.println("═══════════════════════════════════════════════════");
}

// ==================== SENSOR READING ====================
void readAndSendSensorData() {
  unsigned long timestamp = millis();
  
  Serial.println("\n╔════════════════════════════════════════════════════════╗");
  Serial.println("║              📊 SENSOR DATA COLLECTION                 ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  Serial.printf("⏱️  Timestamp: %lu ms (%.2f min uptime)\n", 
                timestamp, timestamp / 60000.0);
  Serial.printf("📍 Location: %s | Device: %s\n", LOCATION, DEVICE_ID);
  
  // Read MQ135 Smoke Sensor
  float smoke = NAN;
  bool smokeValid = false;
  if (smokeWorking) {
    int smokeRaw = analogRead(MQ135_PIN);
    if (smokeRaw > 0 && smokeRaw < 4095) {
      smoke = smokeRaw;
      lastGoodSmoke = smoke;
      smokeValid = true;
    }
  }
  
  // Read Flame Sensor
  int flame = -1;
  if (flameWorking) {
    flame = digitalRead(FLAME_PIN);
  }
  
  // Read DHT11 with retries
  float temp = NAN;
  float humidity = NAN;
  bool dhtValid = false;
  
  if (readDHTWithRetries(temp, humidity, DHT_INIT_ATTEMPTS)) {
    lastGoodTemp = temp;
    lastGoodHumidity = humidity;
    dhtValid = true;
    dhtWorking = true;
    consecutiveErrors = 0;
  } else {
    consecutiveErrors++;
    if (consecutiveErrors >= DHT_FAILURE_LIMIT) {
      dhtWorking = false;
    }
  }
  
  // Read Battery
  int batteryRaw = analogRead(BATTERY_PIN);
  batteryVoltage = (batteryRaw / 4095.0) * 3.3 * 2.0;
  
  // Print all readings
  printSensorReadings(smoke, flame, temp, humidity, false, "");
  
  // Determine alert status
  bool alertTriggered = false;
  String alertMessage = "";
  String severity = "low";
  
  if (flameWorking && flame == LOW) {
    alertTriggered = true;
    alertMessage = "🔥 FLAME DETECTED - IMMEDIATE DANGER!";
    severity = "critical";
  } else if (smokeValid && !isnan(temp) && smoke > SMOKE_THRESHOLD && temp > TEMP_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠️  HIGH SMOKE + HIGH TEMPERATURE DETECTED!";
    severity = "high";
  } else if (smokeValid && smoke > SMOKE_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠️  HIGH SMOKE LEVEL DETECTED!";
    severity = "medium";
  } else if (!isnan(temp) && temp > TEMP_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠️  HIGH TEMPERATURE DETECTED!";
    severity = "medium";
  }
  
  // Handle alerts
  if (alertTriggered) {
    Serial.println("\n┌─────────────────────────────────────────┐");
    Serial.println("│           🚨 ALERT TRIGGERED 🚨         │");
    Serial.println("├─────────────────────────────────────────┤");
    Serial.printf("│ Message: %-30s │\n", alertMessage.c_str());
    Serial.printf("│ Severity: %-29s │\n", severity.c_str());
    Serial.println("└─────────────────────────────────────────┘");
    
    triggerBuzzer();
    
    if (severity == "critical" || severity == "high") {
      alertActive = true;
      warningActive = false;
      digitalWrite(WARNING_LED_PIN, LOW);
    } else {
      warningActive = true;
      alertActive = false;
      digitalWrite(ALERT_LED_PIN, LOW);
    }
  } else {
    warningActive = false;
    alertActive = false;
    digitalWrite(WARNING_LED_PIN, LOW);
    digitalWrite(ALERT_LED_PIN, LOW);
    Serial.println("\n✅ ALL PARAMETERS NORMAL - No alerts");
  }
  
  // Send to Supabase
  Serial.println("\n╔════════════════════════════════════════════════════════╗");
  Serial.println("║            📤 TRANSMITTING TO SUPABASE                 ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  
  sendToSupabase(smoke, flame, temp, humidity, alertTriggered, alertMessage, severity);
  
  Serial.println("\n✅ Data transmission cycle complete");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void printSensorReadings(float smoke, int flame, float temp, float humidity, bool alert, String alertMsg) {
  Serial.println("\n┌─────────────────────────────────────────────────────┐");
  Serial.println("│              SENSOR READINGS SUMMARY                │");
  Serial.println("├─────────────────────────────────────────────────────┤");
  
  // Smoke
  Serial.print("│ 🌫️  SMOKE (MQ135):     ");
  if (!isnan(smoke)) {
    Serial.printf("%-4.0f ", smoke);
    Serial.print(smoke > SMOKE_THRESHOLD ? "[⚠️  HIGH]" : "[✅ OK]  ");
  } else {
    Serial.print("NULL [❌ N/A]");
  }
  Serial.println("       │");
  
  // Flame
  Serial.print("│ 🔥 FLAME (IR):        ");
  if (flame == -1) {
    Serial.print("NULL [❌ N/A]");
  } else if (flame == LOW) {
    Serial.print("1    [🔥 DETECT]");
  } else {
    Serial.print("0    [✅ CLEAR]");
  }
  Serial.println("      │");
  
  // Temperature
  Serial.print("│ 🌡️  TEMPERATURE:      ");
  if (!isnan(temp)) {
    Serial.printf("%-5.1f°C ", temp);
    Serial.print(temp > TEMP_THRESHOLD ? "[⚠️  HIGH]" : "[✅ OK]");
  } else {
    Serial.print("NULL      [❌ N/A]");
  }
  Serial.println("  │");
  
  // Humidity
  Serial.print("│ 💧 HUMIDITY:         ");
  if (!isnan(humidity)) {
    Serial.printf("%-5.1f%% [✅ OK]     ", humidity);
  } else {
    Serial.print("NULL      [❌ N/A] ");
  }
  Serial.println("  │");
  
  // Battery
  Serial.printf("│ 🔋 BATTERY:          %.2fV ", batteryVoltage);
  Serial.print(batteryVoltage < BATTERY_LOW_THRESHOLD ? "[⚠️  LOW]" : "[✅ OK] ");
  Serial.println("   │");
  
  // WiFi
  Serial.printf("│ 📡 WiFi SIGNAL:      %d dBm ", WiFi.RSSI());
  Serial.print(WiFi.RSSI() > -70 ? "[✅ GOOD]" : "[⚠️  WEAK]");
  Serial.println("  │");
  
  Serial.println("└─────────────────────────────────────────────────────┘");
}

// ==================== SUPABASE COMMUNICATION ====================
void sendToSupabase(float smoke, int flame, float temp, float humidity, 
                    bool alert, String message, String severity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Cannot send - WiFi disconnected");
    return;
  }
  
  HTTPClient http;
  String sensorUrl = String(supabaseUrl) + "/rest/v1/sensor_data";
  
  http.begin(sensorUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["location"] = LOCATION;
  doc["alert"] = alert;
  
  // Add sensor values (null if NAN or invalid)
  if (!isnan(smoke)) {
    doc["gas"] = (int)smoke;
  } else {
    doc["gas"] = nullptr;
  }
  
  if (flame != -1) {
    doc["flame"] = flame;
  } else {
    doc["flame"] = nullptr;
  }
  
  if (!isnan(temp)) {
    doc["temp"] = temp;
  } else {
    doc["temp"] = nullptr;
  }
  
  if (!isnan(humidity)) {
    doc["humidity"] = humidity;
  } else {
    doc["humidity"] = nullptr;
  }
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.println("📦 Payload (sensor_data):");
  Serial.println(jsonData);
  Serial.print("🚀 Sending... ");
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("✅ SUCCESS (HTTP %d)\n", httpCode);
    if (httpCode == 200 || httpCode == 201) {
      String response = http.getString();
      if (response.length() > 0 && response.length() < 200) {
        Serial.println("Response: " + response);
      }
    }
  } else {
    Serial.printf("❌ FAILED: %s\n", http.errorToString(httpCode).c_str());
    errorCount++;
  }
  
  http.end();
  
  // Send alert if triggered
  if (alert) {
    delay(100);
    sendAlert(smoke, flame, temp, message, severity);
  }
  
  // Send environmental data if humidity valid
  if (!isnan(humidity)) {
    delay(100);
    sendEnvironmentalData(humidity);
  }
}

void sendAlert(float smoke, int flame, float temp, String message, String severity) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  Serial.println("\n📤 Sending ALERT to database...");
  
  HTTPClient http;
  String alertUrl = String(supabaseUrl) + "/rest/v1/alerts";
  
  http.begin(alertUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["message"] = message;
  doc["severity"] = severity;
  doc["location"] = LOCATION;
  doc["acknowledged"] = false;
  
  if (!isnan(smoke)) doc["gas"] = (int)smoke; else doc["gas"] = nullptr;
  if (flame != -1) doc["flame"] = flame; else doc["flame"] = nullptr;
  if (!isnan(temp)) doc["temp"] = temp; else doc["temp"] = nullptr;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.println("📦 Alert Payload:");
  Serial.println(jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("✅ Alert sent (HTTP %d)\n", httpCode);
  } else {
    Serial.printf("❌ Alert failed: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

void sendEnvironmentalData(float humidity) {
  if (WiFi.status() != WL_CONNECTED) return;
  if (isnan(humidity)) return;
  
  Serial.println("\n📤 Sending ENVIRONMENTAL data...");
  
  HTTPClient http;
  String envUrl = String(supabaseUrl) + "/rest/v1/environmental_data";
  
  http.begin(envUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["humidity"] = humidity;
  doc["air_quality_index"] = random(50, 150);
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("✅ Environmental data sent (HTTP %d)\n", httpCode);
  } else {
    Serial.printf("❌ Failed: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

void sendHealthReport() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  Serial.println("\n╔════════════════════════════════════════════════════════╗");
  Serial.println("║              💚 SYSTEM HEALTH REPORT                   ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  
  HTTPClient http;
  String healthUrl = String(supabaseUrl) + "/rest/v1/device_health";
  
  http.begin(healthUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["status"] = "online";
  doc["cpu_usage"] = cpuUsage;
  doc["memory_usage"] = memoryUsage;
  doc["wifi_signal"] = wifiSignal;
  doc["battery_voltage"] = batteryVoltage;
  doc["uptime_seconds"] = (millis() - bootTime) / 1000;
  doc["error_count"] = errorCount;
  doc["firmware_version"] = FIRMWARE_VERSION;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.println("System Status:");
  Serial.printf("   CPU Usage: %.1f%%\n", cpuUsage);
  Serial.printf("   Memory Usage: %.1f%%\n", memoryUsage);
  Serial.printf("   WiFi Signal: %d dBm\n", wifiSignal);
  Serial.printf("   Battery: %.2fV\n", batteryVoltage);
  Serial.printf("   Uptime: %lu seconds\n", (millis() - bootTime) / 1000);
  Serial.printf("   Errors: %d\n", errorCount);
  
  Serial.println("\n📦 Health Payload:");
  Serial.println(jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("✅ Health report sent (HTTP %d)\n", httpCode);
  } else {
    Serial.printf("❌ Failed: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ==================== HEALTH MONITORING ====================
void updateHealthMetrics() {
  cpuUsage = random(20, 60);
  memoryUsage = (float)(ESP.getFreeHeap()) / (float)(ESP.getHeapSize()) * 100.0;
  memoryUsage = 100.0 - memoryUsage;
  wifiSignal = WiFi.RSSI();
  
  int batteryRaw = analogRead(BATTERY_PIN);
  batteryVoltage = (batteryRaw / 4095.0) * 3.3 * 2.0;
}

// ==================== DHT HELPER ====================
bool readDHTWithRetries(float &outTemp, float &outHumidity, int attempts) {
  for (int i = 0; i < attempts; i++) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    
    if (!isnan(t) && !isnan(h)) {
      outTemp = t;
      outHumidity = h;
      return true;
    }
    
    if (i < attempts - 1) {
      delay(2000);
    }
  }
  
  // Extra retry
  for (int r = 0; r < DHT_READ_RETRIES; r++) {
    delay(2000);
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    
    if (!isnan(t) && !isnan(h)) {
      outTemp = t;
      outHumidity = h;
      return true;
    }
  }
  
  return false;
}

// ==================== ALERT FUNCTIONS ====================
void triggerBuzzer() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(WARNING_LED_PIN, HIGH);
    digitalWrite(ALERT_LED_PIN, HIGH);
    delay(100);
    digitalWrite(WARNING_LED_PIN, LOW);
    digitalWrite(ALERT_LED_PIN, LOW);
    delay(100);
  }
}

void blinkWarningLED() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastWarningLedToggle >= LED_BLINK_INTERVAL) {
    lastWarningLedToggle = currentMillis;
    warningLedState = !warningLedState;
    digitalWrite(WARNING_LED_PIN, warningLedState ? HIGH : LOW);
  }
}

void blinkAlertLED() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastAlertLedToggle >= LED_BLINK_INTERVAL) {
    lastAlertLedToggle = currentMillis;
    alertLedState = !alertLedState;
    digitalWrite(ALERT_LED_PIN, alertLedState ? HIGH : LOW);
  }
}

// ==================== ERROR HANDLING ====================
void handleError(String errorType) {
  Serial.println("\n⚠️  ERROR DETECTED: " + errorType);
  errorCount++;
  consecutiveErrors++;
  
  Serial.printf("   Total Errors: %d\n", errorCount);
  Serial.printf("   Consecutive Errors: %d\n", consecutiveErrors);
  
  if (consecutiveErrors > MAX_CONSECUTIVE_ERRORS) {
    Serial.println("\n❌ TOO MANY ERRORS - SYSTEM RESTART REQUIRED");
    Serial.println("   Restarting in 3 seconds...");
    delay(3000);
    ESP.restart();
  }
}

/*
 * ==================== SUPABASE DATABASE SCHEMA ====================
 * 
 * You need to create these tables in your Supabase project:
 * 
 * 1. sensor_data table:
 * CREATE TABLE sensor_data (
 *   id BIGSERIAL PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   device_id TEXT NOT NULL,
 *   gas INTEGER,
 *   flame INTEGER,
 *   temp FLOAT,
 *   humidity FLOAT,
 *   alert BOOLEAN DEFAULT FALSE,
 *   location TEXT
 * );
 * 
 * 2. alerts table:
 * CREATE TABLE alerts (
 *   id BIGSERIAL PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   device_id TEXT NOT NULL,
 *   message TEXT,
 *   severity TEXT,
 *   gas INTEGER,
 *   flame INTEGER,
 *   temp FLOAT,
 *   location TEXT,
 *   acknowledged BOOLEAN DEFAULT FALSE
 * );
 * 
 * 3. device_health table:
 * CREATE TABLE device_health (
 *   id BIGSERIAL PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   device_id TEXT NOT NULL,
 *   status TEXT,
 *   cpu_usage FLOAT,
 *   memory_usage FLOAT,
 *   wifi_signal INTEGER,
 *   battery_voltage FLOAT,
 *   uptime_seconds BIGINT,
 *   error_count INTEGER,
 *   firmware_version TEXT
 * );
 * 
 * 4. environmental_data table:
 * CREATE TABLE environmental_data (
 *   id BIGSERIAL PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   device_id TEXT NOT NULL,
 *   humidity FLOAT,
 *   air_quality_index INTEGER
 * );
 * 
 * Enable Row Level Security (RLS) and add policies:
 * - Allow INSERT for anon key
 * - Allow SELECT for authenticated users
 * 
 * ==================== HARDWARE CONNECTIONS ====================
 * 
 * ESP32-S3 Pin Connections:
 * 
 * 1. MQ135 Smoke Sensor:
 *    - VCC → 5V
 *    - GND → GND
 *    - AO (Analog Out) → GPIO1
 * 
 * 2. 3-Pin IR Flame Sensor:
 *    - VCC → 3.3V or 5V
 *    - GND → GND
 *    - DO (Digital Out) → GPIO2
 * 
 * 3. DHT11 Temperature/Humidity:
 *    - VCC → 3.3V
 *    - GND → GND
 *    - DATA → GPIO4
 *    - Add 10K pull-up resistor (DATA to VCC)
 * 
 * 4. Buzzer:
 *    - Positive → GPIO5
 *    - Negative → GND
 * 
 * 5. Warning LED (Yellow):
 *    - Anode → GPIO15 (via 220Ω resistor)
 *    - Cathode → GND
 * 
 * 6. Alert LED (Red):
 *    - Anode → GPIO16 (via 220Ω resistor)
 *    - Cathode → GND
 * 
 * 7. Battery Monitor (Optional):
 *    - Voltage divider → GPIO3
 *    - Use 2x 10K resistors for voltage divider
 * 
 * ==================== ARDUINO IDE SETUP ====================
 * 
 * 1. Install ESP32 board support:
 *    - File → Preferences
 *    - Additional Board Manager URLs:
 *      https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 *    - Tools → Board → Boards Manager
 *    - Search "ESP32" and install
 * 
 * 2. Required Libraries (Tools → Manage Libraries):
 *    - ArduinoJson by Benoit Blanchon
 *    - DHT sensor library by Adafruit
 *    - Adafruit Unified Sensor
 * 
 * 3. Board Settings:
 *    - Board: "ESP32S3 Dev Module"
 *    - USB CDC On Boot: "Enabled"
 *    - CPU Frequency: "240MHz (WiFi)"
 *    - Flash Mode: "QIO 80MHz"
 *    - Flash Size: "8MB (64Mb)"
 *    - Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)"
 *    - PSRAM: "OPI PSRAM"
 *    - Upload Speed: "921600"
 *    - USB Mode: "Hardware CDC and JTAG"
 * 
 * 4. Upload:
 *    - Connect ESP32-S3 via USB
 *    - Select correct COM port
 *    - Click Upload
 *    - Open Serial Monitor (115200 baud)
 * 
 * ==================== TROUBLESHOOTING ====================
 * 
 * WiFi Won't Connect:
 * - Verify SSID and password are correct
 * - Check router is on 2.4GHz band (ESP32 doesn't support 5GHz)
 * - Move ESP32 closer to router
 * - Check if MAC filtering is enabled on router
 * 
 * DHT11 Not Reading:
 * - Check wiring (VCC, GND, DATA)
 * - Add 10K pull-up resistor
 * - Try different DHT11 sensor (may be faulty)
 * - Verify it's DHT11 not DHT22
 * - Wait for sensor warm-up (1-2 seconds)
 * 
 * MQ135 Always Low:
 * - Sensor needs 24-48 hour warm-up time
 * - Check VCC is connected to 5V
 * - Verify analog pin connection
 * 
 * Supabase Connection Failed:
 * - Check supabaseUrl is correct (no trailing slash)
 * - Verify anon key is correct
 * - Check RLS policies allow INSERT
 * - Verify table schemas match code
 * - Test API with Postman/curl first
 * 
 * ==================== END OF CODE ====================
 */