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
#define MQ2_PIN 34          // ADC1_CH6 (Analog input)
#define FLAME_PIN 35        // ADC1_CH7 (Digital input)
#define DHT_PIN 4           // GPIO4 (Digital I/O) - Use with 10K pull-up resistor
#define BUZZER_PIN 5        // GPIO5 (Digital output)
#define LED_PIN 2           // GPIO2 (Built-in LED)
#define BATTERY_PIN 36      // ADC1_CH0 (Analog input - optional)

// Sensor configuration
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Timing
#define SENSOR_READ_INTERVAL 5000    // 5 seconds
#define HEALTH_REPORT_INTERVAL 60000 // 1 minute
#define WATCHDOG_TIMEOUT 30          // 30 seconds

// Thresholds
#define GAS_THRESHOLD 400
#define TEMP_THRESHOLD 45.0
#define BATTERY_LOW_THRESHOLD 3.3

// ==================== GLOBAL VARIABLES ====================
unsigned long lastSensorRead = 0;
unsigned long lastHealthReport = 0;
unsigned long bootTime = 0;
int errorCount = 0;
int consecutiveErrors = 0;

// Calibration offsets
float gasOffset = 0.0;
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

// Gas sensor status
bool gasWorking = false;
float lastGoodGas = 0.0;

// Flame sensor status
bool flameWorking = false;

// New constants for DHT handling
const int DHT_INIT_ATTEMPTS = 3;
const int DHT_READ_RETRIES = 1;        // extra retry on failure
const int DHT_FAILURE_LIMIT = 10;      // mark sensor dead after this many consecutive failures

// ==================== FORWARD DECLARATIONS ====================
void connectWiFi();
void performCalibration();
void sendHealthReport();
void updateHealthMetrics();
void sendToSupabase(float gas, int flame, float temp, float humidity, bool alert, String message, String severity);
void sendAlert(float gas, int flame, float temp, String message, String severity);
void sendEnvironmentalData(float humidity);
void triggerBuzzer();
void blinkLED(int times);
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
  delay(1000);
  
  printBanner();
  
  // Initialize pins (analog pins don't need OUTPUT/INPUT set for ADC but harmless)
  pinMode(MQ2_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BATTERY_PIN, INPUT);
  
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
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
  
  // Test MQ-2 gas sensor
  Serial.println("Testing MQ-2 gas sensor...");
  delay(1000);
  int gasTest1 = analogRead(MQ2_PIN);
  delay(500);
  int gasTest2 = analogRead(MQ2_PIN);
  
  // Check if sensor is connected (should read > 0 and vary slightly)
  if (gasTest1 > 50 || gasTest2 > 50) {
    Serial.println("✓ MQ-2 sensor detected");
    Serial.printf("   Reading: %d PPM\n", gasTest1);
    gasWorking = true;
    lastGoodGas = gasTest1;
  } else {
    Serial.println("⚠ MQ-2 sensor not detected (readings too low)");
    Serial.println("   Sensor may not be connected or needs warm-up time");
    Serial.println("   System will send null for gas data");
    gasWorking = false;
  }
  
  // Test Flame sensor
  // NOTE: Flame sensors are unreliable for auto-detection
  // Set flameWorking = true ONLY if you have a flame sensor physically connected
  // By default, we assume NO flame sensor to avoid false detections
  Serial.println("Testing Flame sensor...");
  
  // CONFIGURATION: Set this to true if you have a flame sensor connected
  const bool FLAME_SENSOR_INSTALLED = false;  // Change to true if sensor connected
  
  if (FLAME_SENSOR_INSTALLED) {
    delay(500);
    int flameTest = digitalRead(FLAME_PIN);
    Serial.println("✓ Flame sensor configured as INSTALLED");
    Serial.printf("   Current reading: %s\n", flameTest == LOW ? "FLAME DETECTED" : "Clear");
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
void loop() {
  unsigned long currentMillis = millis();
  
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
  
  delay(100);
}

// ==================== SENSOR FUNCTIONS ====================
void readAndSendSensorData() {
  Serial.println("\n📊 Reading sensors...");
  
  // Read sensors
  int gasRaw = 0;
  bool gasDataValid = false;
  
  if (gasWorking) {
    gasRaw = analogRead(MQ2_PIN);
    // Validate reading (should be reasonable range)
    if (gasRaw > 0 && gasRaw < 4095) {
      gasDataValid = true;
      lastGoodGas = gasRaw;
    } else {
      Serial.println("⚠ MQ-2 reading out of range");
    }
  }
  
  // Read flame sensor only if working
  int flameRaw = -1;  // -1 indicates no sensor
  if (flameWorking) {
    flameRaw = digitalRead(FLAME_PIN);
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
  float gas = NAN;
  if (gasDataValid) {
    gas = gasRaw + gasOffset;
  }
  
  float displayedTemp = NAN;
  float displayedHumidity = NAN;
  if (dhtDataValid) {
    displayedTemp = temp + tempOffset;
    displayedHumidity = humidity;
  }
  
  // Display readings
  if (gasDataValid) {
    Serial.printf("  Gas: %.0f PPM\n", gas);
  } else {
    Serial.println("  Gas: N/A (MQ-2 not working)");
  }
  
  if (dhtDataValid) {
    Serial.printf("  Temp: %.1f°C\n", displayedTemp);
    Serial.printf("  Humidity: %.1f%%\n", displayedHumidity);
  } else {
    Serial.println("  Temp: N/A (DHT11 not working)");
    Serial.println("  Humidity: N/A (DHT11 not working)");
  }
  
  // Display flame status
  if (flameRaw == -1) {
    Serial.println("  Flame: N/A (sensor not working)");
  } else if (flameRaw == LOW) {
    Serial.println("  Flame: DETECTED");
  } else {
    Serial.println("  Flame: Clear");
  }
  
  // Check for alerts
  bool alertTriggered = false;
  String alertMessage = "";
  String severity = "low";
  
  // Only check flame if sensor is working
  if (flameWorking && flameRaw == LOW) {
    alertTriggered = true;
    alertMessage = "🔥 FLAME DETECTED!";
    severity = "critical";
  } else if (!isnan(gas) && gas > GAS_THRESHOLD && !isnan(displayedTemp) && displayedTemp > TEMP_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠ High gas and temperature detected!";
    severity = "high";
  } else if (!isnan(gas) && gas > GAS_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠ High gas level detected!";
    severity = "medium";
  } else if (!isnan(displayedTemp) && displayedTemp > TEMP_THRESHOLD) {
    alertTriggered = true;
    alertMessage = "⚠ High temperature detected!";
    severity = "medium";
  }
  
  // Trigger local alert
  if (alertTriggered) {
    Serial.println("\n🚨 ALERT: " + alertMessage);
    triggerBuzzer();
  }
  
  // Send to Supabase; send NAN as null by using JSON null when appropriate
  sendToSupabase(gas, flameRaw, displayedTemp, displayedHumidity, alertTriggered, alertMessage, severity);
}

// sendToSupabase and related functions unchanged except they will receive NANs which we handle by sending nulls
void sendToSupabase(float gas, int flame, float temp, float humidity, 
                    bool alert, String message, String severity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    return;
  }
  
  HTTPClient http;
  
  // Send sensor data
  String sensorUrl = String(supabaseUrl) + "/rest/v1/sensor_data";
  http.begin(sensorUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  
  // Only send gas if valid (not NAN)
  if (!isnan(gas)) {
    doc["gas"] = gas;
  } else {
    doc["gas"] = nullptr;
  }
  
  // Only send flame if sensor is working (flame != -1)
  if (flame != -1) {
    doc["flame"] = flame;
  } else {
    doc["flame"] = nullptr;
  }
  
  // Only send temp/humidity if valid (not NAN)
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
  
  doc["alert"] = alert;
  doc["location"] = LOCATION;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  Serial.println("📤 Sending to Supabase...");
  Serial.println("URL: " + sensorUrl);
  Serial.println("Payload: " + jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("✓ Sensor data sent (HTTP %d)\n", httpCode);
    Serial.println("Response: " + response);
  } else {
    Serial.printf("❌ Sensor data failed: %s\n", http.errorToString(httpCode).c_str());
    errorCount++;
  }
  http.end();
  
  // Send alert if triggered
  if (alert) {
    sendAlert(gas, flame, temp, message, severity);
  }
  
  // Send environmental data
  sendEnvironmentalData(humidity);
}

void sendAlert(float gas, int flame, float temp, String message, String severity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected - alert not sent");
    return;
  }

  HTTPClient http;
  String alertUrl = String(supabaseUrl) + "/rest/v1/alerts";
  
  http.begin(alertUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  if (!isnan(gas)) doc["gas"] = gas; else doc["gas"] = nullptr;
  if (flame != -1) doc["flame"] = flame; else doc["flame"] = nullptr;
  if (!isnan(temp)) doc["temp"] = temp; else doc["temp"] = nullptr;
  doc["message"] = message;
  doc["severity"] = severity;
  doc["location"] = LOCATION;
  doc["acknowledged"] = false;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("✓ Alert sent (HTTP %d)\n", httpCode);
  } else {
    Serial.printf("❌ Alert failed: %s\n", http.errorToString(httpCode).c_str());
  }
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
  doc["cpu_usage"] = cpuUsage;
  doc["memory_usage"] = memoryUsage;
  doc["wifi_signal"] = wifiSignal;
  doc["battery_voltage"] = batteryVoltage;
  doc["uptime_seconds"] = (millis() - bootTime) / 1000;
  doc["error_count"] = errorCount;
  doc["firmware_version"] = FIRMWARE_VERSION;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("✓ Health report sent (HTTP %d)\n", httpCode);
  }
  http.end();
}

void sendEnvironmentalData(float humidity) {
  // Only send environmental data if humidity is valid
  if (WiFi.status() != WL_CONNECTED || isnan(humidity)) return;
  
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
  
  http.POST(jsonData);
  http.end();
}

// ==================== CALIBRATION ====================
void performCalibration() {
  Serial.println("\n🔧 Performing sensor calibration...");
  
  float gasSum = 0;
  float tempSum = 0;
  int tempValidSamples = 0;
  int samples = 10;
  
  for (int i = 0; i < samples; i++) {
    // Only read gas sensor if it's working
    if (gasWorking) {
      gasSum += analogRead(MQ2_PIN);
    }
    
    // Read DHT temperature sample but check validity
    float t = dht.readTemperature();
    if (!isnan(t)) {
      tempSum += t;
      tempValidSamples++;
    }
    delay(100);
  }
  
  float gasBaseline = gasSum / samples;
  float tempBaseline = (tempValidSamples > 0) ? (tempSum / tempValidSamples) : NAN;
  
  // Only apply gas offset if sensor is working (baseline > 50)
  if (gasWorking && gasBaseline > 50) {
    gasOffset = 0.0; // No offset needed for MQ-2, use raw values
  } else {
    gasOffset = 0.0; // Sensor not working, no offset
  }
  
  // If we have a valid temp baseline, compute offset to align lastGoodTemp -> baseline (or zero)
  if (!isnan(tempBaseline)) {
    tempOffset = 0.0; // leave as 0 unless you want to correct to known ref
  } else {
    tempOffset = 0.0; // no reliable baseline
  }
  
  Serial.printf("✓ Calibration complete\n");
  if (gasWorking) {
    Serial.printf("  Gas baseline: %.1f PPM (offset: %.1f)\n", gasBaseline, gasOffset);
  } else {
    Serial.printf("  Gas sensor not detected - no calibration\n");
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
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
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
