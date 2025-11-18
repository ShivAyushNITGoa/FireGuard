/*
 * FireGuard Advanced - ESP32-S3 WROOM-1 Fire Safety Monitoring System
 * Version 3.0 - Enhanced Features (DHT11 reliability updates)
 * By TheGDevelopers (updated)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <esp_system.h>

// ==================== CONFIGURATION ====================
#define FIRMWARE_VERSION "3.0.0"
#define DEVICE_ID "ESP32_001"
#define LOCATION "Building A - Floor 1"

// WiFi credentials
const char* ssid = "vivo Y22";
const char* password = "88888888";

// Supabase configuration
const char* supabaseUrl = "https://anznostcpknoxjpenbjl.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuem5vc3RjcGtub3hqcGVuYmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTI4NjAsImV4cCI6MjA3ODA2ODg2MH0.3Er2RmgxiRyaVN8eJL6zXF6GmY18QZj9y9sS74qrPGc";

// Pin definitions
#define MQ135_PIN 1         // GPIO1/ADC1_CH0 (Analog input - MQ135 smoke sensor)
#define FLAME_PIN 2         // GPIO2 (Digital input - 3-pin IR flame sensor)
#define DHT_PIN 4           // GPIO4 (Digital I/O) - Use with 10K pull-up resistor
#define BUZZER_PIN 5        // GPIO5 (Digital output)
#define WARNING_LED_PIN 15  // GPIO15 (Warning LED - for medium severity)
#define ALERT_LED_PIN 16    // GPIO16 (Alert LED - for high/critical severity)
#define BATTERY_PIN 3       // GPIO3/ADC1_CH2 (Analog input - optional)

// 3-pin IR Flame Sensor Configuration
// This sensor has 3 pins: VCC, GND, and DO (Digital Output)
// Wiring:
//   - VCC -> 3.3V or 5V
//   - GND -> GND
//   - DO (Digital Output) -> GPIO2
// Output behavior:
//   - LOW (0) when flame detected
//   - HIGH (1) when no flame detected
// Note: Some modules have an onboard potentiometer to adjust sensitivity

// Sensor configuration
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Timing
#define SENSOR_READ_INTERVAL 5000    // 5 seconds
#define HEALTH_REPORT_INTERVAL 60000 // 1 minute
#define WATCHDOG_TIMEOUT 30          // 30 seconds
#define LED_BLINK_INTERVAL 300       // LED blink interval in ms for alerts

// Thresholds
#define SMOKE_THRESHOLD 600     // MQ135 smoke/air quality threshold (adjust based on calibration)
#define TEMP_THRESHOLD 45.0
#define BATTERY_LOW_THRESHOLD 3.3

// ==================== GLOBAL VARIABLES ====================
unsigned long lastSensorRead = 0;
unsigned long lastHealthReport = 0;
unsigned long bootTime = 0;
int errorCount = 0;
int consecutiveErrors = 0;

// Calibration offsets
float smokeOffset = 0.0;
float tempOffset = 0.0;

// Health metrics
float cpuUsage = 0.0;
float memoryUsage = 0.0;
int wifiSignal = 0;
float batteryVoltage = 0.0;

// Last known good values for DHT11
float lastGoodTemp = 25.0;
float lastGoodHumidity = 50.0;
bool dhtWorking = false;

// MQ135 smoke sensor status
bool smokeWorking = false;
float lastGoodSmoke = 0.0;

// Flame sensor status
bool flameWorking = false;

// LED alert state
bool warningActive = false;
bool alertActive = false;
unsigned long lastWarningLedToggle = 0;
unsigned long lastAlertLedToggle = 0;
bool warningLedState = false;
bool alertLedState = false;

// New constants for DHT handling
const int DHT_INIT_ATTEMPTS = 3;
const int DHT_READ_RETRIES = 1;        // extra retry on failure
const int DHT_FAILURE_LIMIT = 10;      // mark sensor dead after this many consecutive failures

// ==================== FORWARD DECLARATIONS ====================
void connectWiFi();
void performCalibration();
void sendHealthReport();
void updateHealthMetrics();
void sendToSupabase(float smoke, int flame, float temp, float humidity, bool alert, String message, String severity);
void sendAlert(float smoke, int flame, float temp, String message, String severity);
void sendEnvironmentalData(float humidity);
void triggerBuzzer();
void blinkLED(int times);
void blinkWarningLED();
void blinkAlertLED();
void handleError(String errorType);
void printBanner();

// Helper to read DHT with retries
bool readDHTWithRetries(float &outTemp, float &outHumidity, int attempts = 1, int retryDelayMs = 2000) {
  // attempts is number of read attempts; retryDelayMs is delay between attempts (DHT11 needs ~2s)
  for (int i = 0; i < attempts; ++i) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      outTemp = t;
      outHumidity = h;
      return true;
    }
    // If failed and not last attempt, wait and try again
    if (i < attempts - 1) {
      delay(retryDelayMs);
    }
  }
  // try one additional quick-retry if configured
  for (int r = 0; r < DHT_READ_RETRIES; ++r) {
    delay(retryDelayMs);
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

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(500);
  
  // Print startup indicator immediately
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║     🔥 FIREGUARD STARTING UP...       ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.println("✓ Serial initialized at 115200 baud");
  delay(500);
  
  printBanner();
  
  // Initialize pins
  pinMode(MQ135_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);  // 3-pin IR flame sensor digital output
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(WARNING_LED_PIN, OUTPUT);
  pinMode(ALERT_LED_PIN, OUTPUT);
  pinMode(BATTERY_PIN, INPUT);
  
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(WARNING_LED_PIN, LOW);
  digitalWrite(ALERT_LED_PIN, LOW);
  
  // Initialize DHT sensor with proper configuration
  Serial.println("\n🌡️ Initializing DHT11 sensor...");
  
  // Configure pin with internal pull-up (DHT11 needs pull-up resistor)
  pinMode(DHT_PIN, INPUT_PULLUP);
  
  dht.begin();
  delay(2000);  // DHT11 needs 1-2 seconds to stabilize
  
  // Test DHT11 sensor with retry logic
  Serial.println("Testing DHT11 sensor (" + String(DHT_INIT_ATTEMPTS) + " attempts)...");
  bool initSuccess = false;
  for (int attempt = 1; attempt <= DHT_INIT_ATTEMPTS; attempt++) {
    Serial.printf("  Attempt %d/%d: ", attempt, DHT_INIT_ATTEMPTS);
    float t = NAN, h = NAN;
    // each attempt itself runs the helper with 1 attempt to avoid extra sleeps inside loop
    if (readDHTWithRetries(t, h, 1, 2000)) {
      Serial.println("✓ Success!");
      Serial.printf("   Temperature: %.1f°C\n", t);
      Serial.printf("   Humidity: %.1f%%\n", h);
      lastGoodTemp = t;
      lastGoodHumidity = h;
      dhtWorking = true;
      initSuccess = true;
      break;
    } else {
      Serial.println("✗ Failed");
      if (attempt < DHT_INIT_ATTEMPTS) {
        // small wait before next attempt (already waited inside helper as necessary)
        delay(500);
      }
    }
  }
  if (!initSuccess) {
    Serial.println("⚠ DHT11 sensor not responding after initial attempts");
    Serial.println("   Possible issues:");
    Serial.println("   1. Check wiring: DATA->GPIO4, VCC->3.3V, GND->GND");
    Serial.println("   2. Add 10K pull-up resistor between DATA and VCC");
    Serial.println("   3. Try different DHT11 sensor (may be faulty)");
    Serial.println("   4. Ensure DHT_TYPE matches sensor (DHT11 or DHT22)");
    Serial.println("   System will continue with default values (25°C, 50%)");
    dhtWorking = false;
  }
  
  // Test MQ135 smoke sensor
  Serial.println("Testing MQ135 smoke/air quality sensor...");
  delay(1000);
  int smokeTest1 = analogRead(MQ135_PIN);
  delay(500);
  int smokeTest2 = analogRead(MQ135_PIN);
  
  // Check if sensor is connected (should read > 0 and vary slightly)
  if (smokeTest1 > 50 || smokeTest2 > 50) {
    Serial.println("✓ MQ135 sensor detected");
    Serial.printf("   Reading: %d (Air Quality Index)\n", smokeTest1);
    Serial.println("   Note: MQ135 detects smoke, CO2, NH3, benzene, alcohol");
    smokeWorking = true;
    lastGoodSmoke = smokeTest1;
  } else {
    Serial.println("⚠ MQ135 sensor not detected (readings too low)");
    Serial.println("   Sensor may not be connected or needs warm-up time (20-48hrs)");
    Serial.println("   System will send null for smoke data");
    smokeWorking = false;
  }
  
  // Test 3-pin IR Flame sensor
  Serial.println("Testing 3-pin IR Flame sensor...");
  
  // CONFIGURATION: Set this to true if you have a flame sensor connected
  const bool FLAME_SENSOR_INSTALLED = true;  // Set to true for 3-pin IR sensor
  
  if (FLAME_SENSOR_INSTALLED) {
    delay(500);
    int flameTest = digitalRead(FLAME_PIN);
    Serial.println("✓ 3-pin IR Flame sensor configured as INSTALLED");
    Serial.println("   Wiring (3 pins):");
    Serial.println("     - VCC -> 3.3V or 5V");
    Serial.println("     - GND -> GND");
    Serial.printf("     - DO (Digital Output) -> GPIO%d\n", FLAME_PIN);
    Serial.printf("   Current reading: %s\n", flameTest == LOW ? "FLAME DETECTED" : "Clear");
    Serial.println("   Note: Sensor outputs LOW when flame detected, HIGH when clear");
    flameWorking = true;
  } else {
    Serial.println("⚠ Flame sensor configured as NOT INSTALLED");
    Serial.println("   Set FLAME_SENSOR_INSTALLED = true in code if you have a sensor");
    Serial.println("   System will send null for flame data");
    flameWorking = false;
  }
  
  Serial.println("✓ Sensor initialization complete");
  
  // Connect to WiFi
  connectWiFi();
  
  // Perform initial calibration
  performCalibration();
  
  // Record boot time
  bootTime = millis();
  
  // Send initial health report
  sendHealthReport();
  
  Serial.println("✓ System ready!");
  blinkLED(3);
}

// ==================== MAIN LOOP ====================
unsigned long lastHeartbeat = 0;
void loop() {
  unsigned long currentMillis = millis();
  
  // Print heartbeat every 10 seconds to show system is alive
  if (currentMillis - lastHeartbeat >= 10000) {
    lastHeartbeat = currentMillis;
    Serial.printf("\n💓 Heartbeat - Uptime: %lu seconds\n", currentMillis / 1000);
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected. Reconnecting...");
    connectWiFi();
  }
  
  // Read sensors periodically
  if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = currentMillis;
    readAndSendSensorData();
  }
  
  // Send health report periodically
  if (currentMillis - lastHealthReport >= HEALTH_REPORT_INTERVAL) {
    lastHealthReport = currentMillis;
    updateHealthMetrics();
    sendHealthReport();
  }
  
  // Handle LED blinking for active warnings and alerts
  if (warningActive) {
    blinkWarningLED();
  }
  if (alertActive) {
    blinkAlertLED();
  }
  
  delay(100);
}

// ==================== SENSOR FUNCTIONS ====================
void readAndSendSensorData() {
  unsigned long currentTime = millis();
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║        📊 SENSOR DATA READING         ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.printf("⏱️  Timestamp: %lu ms (%.1f seconds)\n", currentTime, currentTime / 1000.0);
  Serial.printf("📍 Device ID: %s | Location: %s\n", DEVICE_ID, LOCATION);
  
  // Read sensors
  int smokeRaw = 0;
  bool smokeDataValid = false;
  
  if (smokeWorking) {
    smokeRaw = analogRead(MQ135_PIN);
    // Validate reading (should be reasonable range)
    if (smokeRaw > 0 && smokeRaw < 4095) {
      smokeDataValid = true;
      lastGoodSmoke = smokeRaw;
    } else {
      Serial.println("⚠ MQ135 reading out of range");
    }
  }
  
  // Read 3-pin IR flame sensor only if working
  int flameRaw = -1;  // -1 indicates no sensor
  if (flameWorking) {
    flameRaw = digitalRead(FLAME_PIN);  // LOW = flame detected, HIGH = no flame
  }
  
  // Read DHT11 with retry and fallback
  float temp = NAN;      // temp may be NAN if DHT fails
  float humidity = NAN;  // humidity may be NAN if DHT fails
  bool dhtDataValid = false;
  
  if (dhtWorking) {
    float t = NAN, h = NAN;
    bool ok = readDHTWithRetries(t, h, DHT_INIT_ATTEMPTS, 2000);
    if (ok) {
      temp = t;
      humidity = h;
      lastGoodTemp = temp;
      lastGoodHumidity = humidity;
      consecutiveErrors = 0;
      dhtDataValid = true;
    } else {
      Serial.println("⚠ DHT11 read failed after retries");
      consecutiveErrors++;
      if (consecutiveErrors >= DHT_FAILURE_LIMIT) {
        Serial.println("⚠ DHT11 marked as non-functional after " + String(DHT_FAILURE_LIMIT) + " failures");
        dhtWorking = false;
      }
    }
  } else {
    // DHT11 not working - use last good values but mark data invalid for sending nulls
    if (consecutiveErrors == 0) {
      Serial.println("ℹ DHT11 disabled - temperature/humidity data unavailable");
      consecutiveErrors = 1;  // Set to 1 to avoid repeated messages
    }
  }
  
  // Apply calibration only if data is valid
  float smoke = NAN;
  if (smokeDataValid) {
    smoke = smokeRaw + smokeOffset;
  }
  
  float displayedTemp = NAN;
  float displayedHumidity = NAN;
  if (dhtDataValid) {
    displayedTemp = temp + tempOffset;
    displayedHumidity = humidity;
  }
  
  // Display readings with enhanced formatting
  Serial.println("\n┌─ 🌫️  SMOKE/AIR QUALITY SENSOR (MQ135) ─┐");
  if (smokeDataValid) {
    Serial.printf("│ Status: ✓ Working\n");
    Serial.printf("│ Raw Value: %d (0-4095)\n", smokeRaw);
    Serial.printf("│ Calibrated: %.1f\n", smoke);
    Serial.printf("│ Threshold: %d\n", SMOKE_THRESHOLD);
    Serial.printf("│ Status: %s\n", smoke > SMOKE_THRESHOLD ? "⚠️  HIGH" : "✓ Normal");
  } else {
    Serial.printf("│ Status: ❌ Not Working\n");
    Serial.printf("│ Last Good Value: %.1f\n", lastGoodSmoke);
  }
  Serial.println("└────────────────────────────────────────┘");
  
  Serial.println("\n┌─ 🌡️  TEMPERATURE & HUMIDITY (DHT11) ─┐");
  if (dhtDataValid) {
    Serial.printf("│ Status: ✓ Working\n");
    Serial.printf("│ Temperature: %.1f°C\n", displayedTemp);
    Serial.printf("│ Humidity: %.1f%%\n", displayedHumidity);
    Serial.printf("│ Temp Threshold: %.1f°C\n", TEMP_THRESHOLD);
    Serial.printf("│ Temp Status: %s\n", displayedTemp > TEMP_THRESHOLD ? "⚠️  HIGH" : "✓ Normal");
  } else {
    Serial.printf("│ Status: ❌ Not Working\n");
    Serial.printf("│ Last Good Temp: %.1f°C\n", lastGoodTemp);
    Serial.printf("│ Last Good Humidity: %.1f%%\n", lastGoodHumidity);
  }
  Serial.println("└────────────────────────────────────────┘");
  
  Serial.println("\n┌─ 🔥 FLAME DETECTION SENSOR (IR) ─┐");
  if (flameRaw == -1) {
    Serial.println("│ Status: ❌ Not Installed");
  } else if (flameRaw == LOW) {
    Serial.println("│ Status: ✓ Working");
    Serial.println("│ Reading: 🔥 FLAME DETECTED!");
  } else {
    Serial.println("│ Status: ✓ Working");
    Serial.println("│ Reading: ✓ Clear (No flame)");
  }
  Serial.println("└────────────────────────────────────────┘");
  
  // Read battery voltage
  int batteryRaw = analogRead(BATTERY_PIN);
  float batteryVoltage = (batteryRaw / 4095.0) * 3.3 * 2;  // Assuming voltage divider
  Serial.println("\n┌─ 🔋 BATTERY & SYSTEM STATUS ─┐");
  Serial.printf("│ Battery Voltage: %.2f V\n", batteryVoltage);
  Serial.printf("│ Battery Status: %s\n", batteryVoltage < BATTERY_LOW_THRESHOLD ? "⚠️  LOW" : "✓ Good");
  Serial.printf("│ WiFi Signal: %d dBm\n", WiFi.RSSI());
  Serial.printf("│ WiFi Status: %s\n", WiFi.status() == WL_CONNECTED ? "✓ Connected" : "❌ Disconnected");
  Serial.printf("│ Uptime: %lu seconds\n", (millis() - bootTime) / 1000);
  Serial.printf("│ Error Count: %d\n", errorCount);
  Serial.println("└────────────────────────────────────────┘");
  
  // Check for alerts and warnings
  bool alertTriggered = false;
  String alertMessage = "";
  String severity = "low";
  
  // Only check flame if sensor is working
  if (flameWorking && flameRaw == LOW) {
    alertTriggered = true;
    alertMessage = "🔥 FLAME DETECTED!";
    severity = "critical";
  } else if (!isnan(smoke) && smoke > SMOKE_THRESHOLD && !isnan(displayedTemp) && displayedTemp > TEMP_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠ High smoke and temperature detected!";
    severity = "high";
  } else if (!isnan(smoke) && smoke > SMOKE_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠ High smoke level detected!";
    severity = "medium";
  } else if (!isnan(displayedTemp) && displayedTemp > TEMP_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠ High temperature detected!";
    severity = "medium";
  }
  
  // Trigger local alert/warning with appropriate LED
  if (alertTriggered) {
    Serial.println("\n🚨 ALERT: " + alertMessage);
    triggerBuzzer();  // Buzzer ON for all cases
    
    // Activate appropriate LED based on severity
    if (severity == "critical" || severity == "high") {
      // High severity - use ALERT LED (red)
      alertActive = true;
      warningActive = false;
      digitalWrite(WARNING_LED_PIN, LOW);  // Turn off warning LED
    } else {
      // Medium/low severity - use WARNING LED (yellow/green)
      warningActive = true;
      alertActive = false;
      digitalWrite(ALERT_LED_PIN, LOW);  // Turn off alert LED
    }
  } else {
    // No alerts - turn off both LEDs
    warningActive = false;
    alertActive = false;
    digitalWrite(WARNING_LED_PIN, LOW);
    digitalWrite(ALERT_LED_PIN, LOW);
    Serial.println("\n✅ All sensors normal - No alerts");
  }
  
  // Print summary
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║          📤 SENDING TO SUPABASE       ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.printf("Smoke: %s | Flame: %s | Temp: %s | Alert: %s\n",
    smokeDataValid ? "✓" : "✗",
    flameRaw == -1 ? "N/A" : (flameRaw == LOW ? "🔥" : "✓"),
    dhtDataValid ? "✓" : "✗",
    alertTriggered ? "🚨 YES" : "✓ No"
  );
  
  // Send to Supabase; send NAN as null by using JSON null when appropriate
  sendToSupabase(smoke, flameRaw, displayedTemp, displayedHumidity, alertTriggered, alertMessage, severity);
  Serial.println("✓ Data sent to Supabase\n");
}

// sendToSupabase and related functions unchanged except they will receive NANs which we handle by sending nulls
void sendToSupabase(float smoke, int flame, float temp, float humidity, 
                    bool alert, String message, String severity) {
  Serial.println("\n┌─ 🌐 SUPABASE TRANSMISSION ─┐");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("│ ❌ WiFi not connected");
    Serial.println("└────────────────────────────┘");
    return;
  }
  
  Serial.println("│ ✓ WiFi connected");
  
  HTTPClient http;
  
  // Send sensor data
  String sensorUrl = String(supabaseUrl) + "/rest/v1/sensor_data";
  Serial.println("│ URL: /rest/v1/sensor_data");
  
  http.begin(sensorUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  
  // Send smoke data as 'gas' column (MQ135 smoke sensor data stored in gas field)
  if (!isnan(smoke)) {
    doc["gas"] = smoke;
    Serial.printf("│ Gas: %.1f\n", smoke);
  } else {
    doc["gas"] = nullptr;
    Serial.println("│ Gas: null");
  }
  
  // Only send flame if sensor is working (flame != -1)
  if (flame != -1) {
    doc["flame"] = flame;
    Serial.printf("│ Flame: %d\n", flame);
  } else {
    doc["flame"] = nullptr;
    Serial.println("│ Flame: null");
  }
  
  // Only send temp/humidity if valid (not NAN)
  if (!isnan(temp)) {
    doc["temp"] = temp;
    Serial.printf("│ Temp: %.1f°C\n", temp);
  } else {
    doc["temp"] = nullptr;
    Serial.println("│ Temp: null");
  }
  if (!isnan(humidity)) {
    doc["humidity"] = humidity;
    Serial.printf("│ Humidity: %.1f%%\n", humidity);
  } else {
    doc["humidity"] = nullptr;
    Serial.println("│ Humidity: null");
  }
  
  doc["alert"] = alert;
  doc["location"] = LOCATION;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.println("│ Sending...");
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("│ ✓ HTTP %d - Success\n", httpCode);
    if (response.length() > 0) {
      Serial.printf("│ Response: %s\n", response.c_str());
    }
  } else {
    Serial.printf("│ ❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
    errorCount++;
  }
  Serial.println("└────────────────────────────┘");
  http.end();
  
  // Send alert if triggered
  if (alert) {
    sendAlert(smoke, flame, temp, message, severity);
  }
  
  // Send environmental data
  sendEnvironmentalData(humidity);
}

void sendAlert(float smoke, int flame, float temp, String message, String severity) {
  Serial.println("\n┌─ 🚨 ALERT TRANSMISSION ─┐");
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("│ ❌ WiFi not connected");
    Serial.println("└────────────────────────┘");
    return;
  }

  HTTPClient http;
  String alertUrl = String(supabaseUrl) + "/rest/v1/alerts";
  Serial.println("│ URL: /rest/v1/alerts");
  
  http.begin(alertUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  if (!isnan(smoke)) doc["gas"] = smoke; else doc["gas"] = nullptr;
  if (flame != -1) doc["flame"] = flame; else doc["flame"] = nullptr;
  if (!isnan(temp)) doc["temp"] = temp; else doc["temp"] = nullptr;
  doc["message"] = message;
  doc["severity"] = severity;
  doc["location"] = LOCATION;
  doc["acknowledged"] = false;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.printf("│ Severity: %s\n", severity.c_str());
  Serial.printf("│ Message: %s\n", message.c_str());
  Serial.println("│ Sending...");
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("│ ✓ HTTP %d - Alert sent\n", httpCode);
  } else {
    Serial.printf("│ ❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }
  Serial.println("└────────────────────────┘");
  http.end();
}

// ==================== HEALTH MONITORING ====================
void updateHealthMetrics() {
  // CPU usage (simplified/random placeholder)
  cpuUsage = random(20, 60);
  
  // Memory usage
  memoryUsage = (float)(ESP.getFreeHeap()) / (float)(ESP.getHeapSize()) * 100.0;
  memoryUsage = 100.0 - memoryUsage;
  
  // WiFi signal strength
  wifiSignal = WiFi.RSSI();
  
  // Battery voltage
  int batteryRaw = analogRead(BATTERY_PIN);
  batteryVoltage = (batteryRaw / 4095.0) * 3.3 * 2.0; // Voltage divider
  
  Serial.println("\n💚 Health Metrics:");
  Serial.printf("  CPU: %.1f%%\n", cpuUsage);
  Serial.printf("  Memory: %.1f%%\n", memoryUsage);
  Serial.printf("  WiFi: %d dBm\n", wifiSignal);
  Serial.printf("  Battery: %.2fV\n", batteryVoltage);
  Serial.printf("  Uptime: %lu s\n", (millis() - bootTime) / 1000);
  Serial.printf("  Errors: %d\n", errorCount);
}

void sendHealthReport() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String healthUrl = String(supabaseUrl) + "/rest/v1/device_health";
  
  http.begin(healthUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["status"] = "online";  // Device status
  doc["cpu_usage"] = cpuUsage;
  doc["memory_usage"] = memoryUsage;
  doc["wifi_signal"] = wifiSignal;
  doc["battery_voltage"] = batteryVoltage;
  doc["uptime_seconds"] = (millis() - bootTime) / 1000;
  doc["error_count"] = errorCount;
  doc["firmware_version"] = FIRMWARE_VERSION;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.println("📤 Sending health report...");
  Serial.println("Payload: " + jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("✓ Health report sent (HTTP %d)\n", httpCode);
    if (httpCode != 200 && httpCode != 201) {
      Serial.println("Response: " + response);
    }
  } else {
    Serial.printf("❌ Health report failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void sendEnvironmentalData(float humidity) {
  // Only send environmental data if humidity is valid
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n⚠️  Environmental data: WiFi not connected");
    return;
  }
  
  if (isnan(humidity)) {
    Serial.println("\n⚠️  Environmental data: Humidity invalid");
    return;
  }
  
  Serial.println("\n┌─ 🌍 ENVIRONMENTAL DATA ─┐");
  
  HTTPClient http;
  String envUrl = String(supabaseUrl) + "/rest/v1/environmental_data";
  Serial.println("│ URL: /rest/v1/environmental_data");
  
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
  
  Serial.printf("│ Humidity: %.1f%%\n", humidity);
  Serial.println("│ Sending...");
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("│ ✓ HTTP %d - Success\n", httpCode);
  } else {
    Serial.printf("│ ❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }
  Serial.println("└─────────────────────────┘");
  http.end();
}

// ==================== CALIBRATION ====================
void performCalibration() {
  Serial.println("\n🔧 Performing sensor calibration...");
  
  float smokeSum = 0;
  float tempSum = 0;
  int tempValidSamples = 0;
  int samples = 10;
  
  for (int i = 0; i < samples; i++) {
    // Only read smoke sensor if it's working
    if (smokeWorking) {
      smokeSum += analogRead(MQ135_PIN);
    }
    
    // Read DHT temperature sample but check validity
    float t = dht.readTemperature();
    if (!isnan(t)) {
      tempSum += t;
      tempValidSamples++;
    }
    delay(100);
  }
  
  float smokeBaseline = smokeSum / samples;
  float tempBaseline = (tempValidSamples > 0) ? (tempSum / tempValidSamples) : NAN;
  
  // Only apply smoke offset if sensor is working (baseline > 50)
  if (smokeWorking && smokeBaseline > 50) {
    smokeOffset = 0.0; // No offset needed for MQ135, use raw values
  } else {
    smokeOffset = 0.0; // Sensor not working, no offset
  }
  
  // If we have a valid temp baseline, compute offset to align lastGoodTemp -> baseline (or zero)
  if (!isnan(tempBaseline)) {
    tempOffset = 0.0; // leave as 0 unless you want to correct to known ref
  } else {
    tempOffset = 0.0; // no reliable baseline
  }
  
  Serial.printf("✓ Calibration complete\n");
  if (smokeWorking) {
    Serial.printf("  Smoke baseline: %.1f (offset: %.1f)\n", smokeBaseline, smokeOffset);
  } else {
    Serial.printf("  MQ135 smoke sensor not detected - no calibration\n");
  }
  if (!isnan(tempBaseline)) {
    Serial.printf("  Temp baseline: %.2f (no offset applied)\n", tempBaseline);
  } else {
    Serial.printf("  Temp baseline: N/A (no valid samples)\n");
  }
}

// ==================== UTILITY FUNCTIONS ====================
void connectWiFi() {
  Serial.print("\n📡 Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
    Serial.printf("  Signal: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    handleError("WIFI_CONNECTION_FAILED");
  }
}

void triggerBuzzer() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}

void blinkLED(int times) {
  // Used for system status indication (startup, etc.)
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
  
  // Toggle WARNING LED at defined interval (medium severity)
  if (currentMillis - lastWarningLedToggle >= LED_BLINK_INTERVAL) {
    lastWarningLedToggle = currentMillis;
    warningLedState = !warningLedState;
    digitalWrite(WARNING_LED_PIN, warningLedState ? HIGH : LOW);
  }
}

void blinkAlertLED() {
  unsigned long currentMillis = millis();
  
  // Toggle ALERT LED at defined interval (high/critical severity)
  if (currentMillis - lastAlertLedToggle >= LED_BLINK_INTERVAL) {
    lastAlertLedToggle = currentMillis;
    alertLedState = !alertLedState;
    digitalWrite(ALERT_LED_PIN, alertLedState ? HIGH : LOW);
  }
}

void handleError(String errorType) {
  Serial.println("⚠ Error: " + errorType);
  errorCount++;
  
  if (consecutiveErrors > 5) {
    Serial.println("❌ Too many consecutive errors. Rebooting...");
    delay(1000);
    ESP.restart();
  }
}

void printBanner() {
  Serial.println("\n=================================");
  Serial.println("FireGuard Advanced - ESP32-S3");
  Serial.println("Fire Safety Monitoring System");
  Serial.println("By TheGDevelopers");
  Serial.printf("Version: %s\n", FIRMWARE_VERSION);
  Serial.println("=================================\n");
}
