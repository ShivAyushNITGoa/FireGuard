# 🔧 ESP32-S3 WROOM-1 Board Specifications

## ⭐ ALL CODE IS ESP32-S3 ONLY

**IMPORTANT:** All firmware code in this project is designed **exclusively for ESP32-S3 WROOM-1**.

### NOT Compatible With:
- ❌ Arduino Uno
- ❌ Arduino Nano
- ❌ Arduino Mega
- ❌ Regular ESP32 (ESP32-WROOM-32)
- ❌ ESP32-C3
- ❌ Any other microcontroller

---

## 📋 Hardware Specifications

### Processor
- **Chip**: ESP32-S3 WROOM-1
- **CPU**: Xtensa 32-bit LX7 dual-core
- **Clock Speed**: 240 MHz (configurable)
- **Architecture**: 32-bit RISC

### Memory
- **SRAM**: 384 KB (internal)
- **Flash**: 8 MB (or 16 MB variant)
- **PSRAM**: Optional (not used in FireGuard)
- **ROM**: 384 KB

### Connectivity
- **WiFi**: 802.11 b/g/n (2.4 GHz)
- **Bluetooth**: 5.0 LE
- **USB**: Native USB-C (CDC Serial)

### Analog & Digital I/O
- **GPIO Pins**: 45 total
- **ADC Channels**: 12 (12-bit resolution)
- **DAC Channels**: 2 (8-bit resolution)
- **SPI**: 4 interfaces
- **I2C**: 2 interfaces
- **UART**: 3 interfaces

### Power
- **Operating Voltage**: 3.0V - 3.6V (typical 3.3V)
- **Current Draw**: 80-160 mA (WiFi active)
- **Sleep Current**: <10 µA (deep sleep)

---

## 🔌 GPIO Pin Configuration (FireGuard)

| Pin | Function | Type | Voltage | Notes |
|-----|----------|------|---------|-------|
| GPIO1 | MQ135 Smoke | ADC Input | 3.3V | Analog smoke sensor |
| GPIO2 | Flame IR | Digital Input | 3.3V | 3-pin IR flame sensor |
| GPIO3 | Battery | ADC Input | 3.3V | Battery voltage monitor |
| GPIO4 | DHT11 Data | Digital I/O | 3.3V | Requires 10K pull-up |
| GPIO5 | Buzzer | Digital Output | 3.3V | Active high |
| GPIO15 | Warning LED | Digital Output | 3.3V | Yellow/Green LED |
| GPIO16 | Alert LED | Digital Output | 3.3V | Red LED |

---

## 🛠️ Arduino IDE Configuration

### Board Selection
```
Tools → Board → ESP32 → ESP32-S3 Dev Module
```

### Required Settings
```
Board:              ESP32-S3 Dev Module
Upload Speed:       921600 baud (or 115200 if fails)
Flash Size:         4MB
Flash Mode:         DIO
Flash Frequency:    80 MHz
CPU Frequency:      240 MHz
Core Debug Level:   None
PSRAM:              Disabled
Partition Scheme:   Default 4MB with spiffs
USB CDC On Boot:    Enabled ⭐ IMPORTANT
USB Firmware MSC:   Disabled
USB DFU On Boot:    Disabled
```

### Serial Configuration
```
Baud Rate:    115200
Data Bits:    8
Stop Bits:    1
Parity:       None
Flow Control: None
```

---

## 📦 Required Libraries

### Built-in (No Installation Needed)
- `WiFi.h` - WiFi connectivity
- `HTTPClient.h` - HTTP requests
- `esp_system.h` - System functions
- `esp32-hal.h` - Hardware abstraction layer

### External (Install via Arduino IDE)

#### 1. ArduinoJson (by Benoit Blanchon)
```
Version: 6.x or higher
Search: "ArduinoJson"
Used for: JSON serialization/deserialization
```

#### 2. DHT sensor library (by Adafruit)
```
Version: 1.4.x or higher
Search: "DHT"
Used for: DHT11 temperature/humidity sensor
```

#### 3. Adafruit Unified Sensor (by Adafruit)
```
Version: 1.1.x or higher
Search: "Adafruit Unified Sensor"
Used for: DHT library dependency
```

### Installation Steps
1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search for each library name
4. Click **Install** for each one
5. Restart Arduino IDE

---

## 🚀 Upload Process

### Step 1: Connect ESP32-S3
- Use USB-C cable (not Micro-USB!)
- Connect to computer
- Wait 2-3 seconds for driver installation

### Step 2: Verify Connection
- Windows: Device Manager → Ports (COM & LPT)
- Should show "USB Serial Device" or "CH340"
- Note the COM port number (e.g., COM3)

### Step 3: Configure Arduino IDE
1. **Tools → Board → ESP32 → ESP32-S3 Dev Module**
2. **Tools → Port → Select your COM port**
3. **Tools → Upload Speed → 921600**
4. **Tools → USB CDC On Boot → Enabled**

### Step 4: Upload Code
1. Click **Upload** button (→ arrow icon)
2. Wait for "Done uploading" message
3. Takes 30-60 seconds typically

### Step 5: Monitor Output
1. Open Serial Monitor (**Ctrl+Shift+M**)
2. Set baud rate to **115200**
3. Click **Reset** button on ESP32-S3
4. Output should appear immediately

---

## 📊 Expected Startup Output

```
🔥 FIREGUARD STARTING UP...
✓ Serial initialized at 115200 baud

📋 Board Information:
  Chip Model: ESP32-S3
  Chip Revision: 0
  CPU Cores: 2
  CPU Frequency: 240 MHz
  Free Heap: 385000 bytes
  Total Heap: 400000 bytes

✓ ESP32-S3 board detected!

=================================
FireGuard Advanced - ESP32-S3
Fire Safety Monitoring System
By TheGDevelopers
Version: 3.0.0
=================================

🌡️ Initializing DHT11 sensor...
Testing DHT11 sensor (3 attempts)...
  Attempt 1/3: ✓ Success!
   Temperature: 25.5°C
   Humidity: 60.0%

✓ System ready!
```

---

## 🔋 Power Supply Requirements

### Recommended Power Supply
- **Input Voltage**: 5V DC
- **Current Capacity**: 2A minimum
- **Type**: Regulated DC power supply
- **Connector**: USB-C (native) or external 5V

### Component Power Draw
| Component | Voltage | Current | Notes |
|-----------|---------|---------|-------|
| ESP32-S3 | 3.3V | 80-160 mA | Main processor |
| WiFi | 3.3V | 80-120 mA | When transmitting |
| DHT11 | 3.3V | 0.5-2.5 mA | Temperature/humidity |
| MQ135 | 5V | 150-200 mA | Smoke sensor (HIGH!) |
| Flame IR | 3.3V | 20-50 mA | Flame detection |
| Buzzer | 5V | 30-100 mA | Audio alert |
| LEDs | 3.3V | 10-20 mA | Status indicators |

**Total Peak Current**: ~500-600 mA (WiFi + MQ135 + Buzzer)

---

## 🔍 Troubleshooting

### Issue: "Board not found"
**Solution:**
1. Check USB cable is connected
2. Verify Device Manager shows COM port
3. Reinstall ESP32 board package
4. Try different USB port on computer

### Issue: "Upload failed" or "Timed out"
**Solution:**
1. Hold **BOOT** button while uploading
2. Try lower upload speed (115200)
3. Verify board is "ESP32-S3 Dev Module" (not regular ESP32)
4. Check USB cable quality

### Issue: "No Serial output"
**Solution:**
1. Verify baud rate is **115200**
2. Click **Reset** button on ESP32-S3
3. Enable "USB CDC On Boot" in Tools menu
4. Try different USB port

### Issue: "Library not found"
**Solution:**
1. Install missing library from Manage Libraries
2. Restart Arduino IDE
3. Verify library version is compatible

### Issue: "Garbage characters in Serial Monitor"
**Solution:**
1. Baud rate is wrong - set to **115200**
2. Click Reset button on ESP32-S3
3. Try different USB port

---

## ✅ Code Compatibility

| Code File | Board | Status | Notes |
|-----------|-------|--------|-------|
| DHT11_Minimal.ino | ESP32-S3 | ✅ Compatible | No libraries |
| DHT11_With_Library.ino | ESP32-S3 | ✅ Compatible | Requires DHT |
| DHT11_Simple_Test.ino | ESP32-S3 | ✅ Compatible | Fancy output |
| FireGuard_ESP32_Advanced.ino | ESP32-S3 | ✅ Compatible | Full system |
| Arduino Uno | ❌ NOT Compatible | Code uses ESP32-S3 features |
| Regular ESP32 | ⚠️ Partial | Not tested, may fail |

---

## 📚 Useful Resources

- [ESP32-S3 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf)
- [ESP32-S3 Pinout](https://github.com/AmeraGS/esp32-s3-devkitc-1-pinout)
- [Arduino ESP32 Documentation](https://docs.espressif.com/projects/arduino-esp32/en/latest/)
- [Adafruit DHT Library](https://github.com/adafruit/DHT-sensor-library)
- [ArduinoJson Documentation](https://arduinojson.org/)

---

## 🎯 Quick Checklist

Before uploading code:
- [ ] ESP32-S3 board connected via USB-C
- [ ] Arduino IDE installed
- [ ] ESP32 board support installed
- [ ] DHT library installed
- [ ] Board set to "ESP32-S3 Dev Module"
- [ ] Port set to correct COM port
- [ ] Baud rate set to 115200
- [ ] USB CDC On Boot enabled
- [ ] Upload Speed set to 921600

After uploading:
- [ ] "Done uploading" message appears
- [ ] Serial Monitor shows output
- [ ] Board information displays correctly
- [ ] "ESP32-S3 board detected!" message appears

---

## 🚀 Next Steps

1. **Upload DHT11_Minimal.ino** → Verify Serial works
2. **Upload DHT11_With_Library.ino** → Verify DHT11 works
3. **Upload FireGuard_ESP32_Advanced.ino** → Full system test
4. **Monitor Serial output** → Verify all sensors working
5. **Check Supabase** → Verify data is being sent

Good luck! 🎉
