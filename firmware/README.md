# ESP32 Firmware - FireGuard

## Overview
This firmware enables ESP32-S3 to read fire safety sensors and send data to Supabase in real-time.

## Hardware Requirements
- **ESP32-S3 WROOM-1 DevKitC-1**
- **MQ-2 Gas/Smoke Sensor** (Analog output)
- **Flame IR Sensor Module** (Digital output)
- **DHT11** Temperature & Humidity Sensor
- **Buzzer** (5V active buzzer recommended)
- **Breadboard and jumper wires**

## Pin Connections

### MQ-2 Gas Sensor
```
MQ-2 VCC  -> ESP32 5V (or 3.3V if module supports it)
MQ-2 GND  -> ESP32 GND
MQ-2 AOUT -> ESP32 GPIO34 (ADC1_6)
```

### Flame Sensor
```
Flame VCC -> ESP32 3.3V
Flame GND -> ESP32 GND
Flame SIG -> ESP32 GPIO35
```

### DHT11
```
DHT11 VCC  -> ESP32 3.3V
DHT11 GND  -> ESP32 GND
DHT11 DATA -> ESP32 GPIO4
```

### Buzzer
```
Buzzer (+) -> ESP32 GPIO5
Buzzer (-) -> ESP32 GND
```

## Software Setup

### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

### 2. Install ESP32 Board Support
1. Open Arduino IDE
2. Go to **File > Preferences**
3. Add this URL to **Additional Board Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools > Board > Board Manager**
5. Search for "esp32" and install **esp32 by Espressif Systems**

### 3. Install Required Libraries
Go to **Sketch > Include Library > Manage Libraries** and install:
- **DHT sensor library** by Adafruit
- **Adafruit Unified Sensor** (dependency for DHT)
- **ArduinoJson** by Benoit Blanchon (v6.x)

### 4. Configure the Firmware
Open `FireGuard_ESP32.ino` and update:

```cpp
// WiFi Credentials
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";

// Supabase Configuration
const char* SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const char* SUPABASE_ANON_KEY = "your-anon-key-here";

// Device Information (optional)
const char* DEVICE_ID = "ESP32_001";
const char* DEVICE_LOCATION = "Building A - Floor 1";
```

### 5. Upload to ESP32
1. Connect ESP32 via USB
2. Select **Tools > Board > ESP32 Arduino > ESP32S3 Dev Module**
3. Select **Tools > Port** (e.g., COM3 on Windows, /dev/ttyUSB0 on Linux)
4. Click **Upload** button

## Testing

### Serial Monitor
1. Open **Tools > Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   =================================
   FireGuard - ESP32-S3
   Fire Safety Monitoring System
   =================================
   
   [WIFI] Connecting to YourWiFi...
   [WIFI] Connected!
   [WIFI] IP Address: 192.168.1.100
   [SUPABASE] Testing connection...
   [SUPABASE] Connection OK
   
   [SETUP] System ready!
   Starting sensor monitoring...
   
   ----------------------------------------
   Gas: 250 ppm
   Flame: CLEAR
   Temperature: 28.5 °C
   Humidity: 65.0 %
   Alert Status: OK
   ----------------------------------------
   ```

### Calibration

#### MQ-2 Gas Sensor
1. **Preheat**: Let sensor run for 24-48 hours in clean air for accurate readings
2. **Baseline**: Note normal readings in your environment (typically 100-300 ppm)
3. **Testing**: Use lighter gas or alcohol spray to test (readings should spike)
4. **Adjust threshold** in code if needed

#### DHT11 Sensor
1. **Accuracy**: ±2°C for temperature, ±5% for humidity
2. **Sampling**: Reads every 1-2 seconds (slower than DHT22)
3. **No calibration needed**: Factory calibrated
4. **Note**: Less accurate than DHT22 but more affordable

#### Flame Sensor
1. **Sensitivity**: Adjust potentiometer on sensor module
2. **Test**: Use lighter flame at various distances
3. **Typical range**: 60cm - 100cm detection distance

## Troubleshooting

### WiFi Connection Issues
- Verify SSID and password are correct
- Check 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move closer to router

### Sensor Reading Errors
- **DHT11 errors**: Check wiring, DHT11 may need 10kΩ pull-up resistor on data line
- **DHT11 returns NaN**: Wait 2 seconds between readings, sensor needs time
- **MQ-2 not responsive**: Ensure adequate power supply (may need 5V)
- **Flame sensor always triggered**: Adjust sensitivity potentiometer

### Supabase Upload Fails
- Verify Supabase URL is correct (include `https://`)
- Check Anon Key is copied correctly (no spaces)
- Ensure firewall allows HTTPS requests
- Check Supabase project is active

### Buzzer Not Working
- Check polarity if using passive buzzer
- Active buzzers work better (require only HIGH/LOW signal)
- Verify GPIO27 can source enough current

## Power Considerations

### USB Power
- Development: USB power is sufficient
- Ensure good quality USB cable and power adapter

### Battery Power
- Use 5V power bank or LiPo battery (3.7V with voltage regulator)
- Add **10μF - 100μF capacitor** near ESP32 VIN for stability
- MQ-2 draws ~150mA when heating, consider power budget

## Next Steps

1. ✅ Upload firmware
2. ✅ Verify serial monitor output
3. ✅ Check Supabase dashboard for incoming data
4. ✅ Test alert conditions (gas, flame, temperature)
5. ✅ Calibrate sensors for your environment
6. 🔧 Add notifications (email/SMS via Supabase Edge Functions)
7. 🔧 Add battery monitoring
8. 🔧 Implement deep sleep for power saving

## Safety Warnings

⚠️ **THIS IS A LEARNING PROJECT - NOT A CERTIFIED SAFETY DEVICE**

- Do NOT use as the only fire detection system
- Always have proper smoke alarms installed
- Never leave sensors unattended during testing
- Do not connect high-voltage loads directly to ESP32
- Follow local fire safety regulations

## Support

For issues:
1. Check Serial Monitor for error messages
2. Verify wiring diagram
3. Test each sensor individually
4. Review main [README.md](../README.md)
5. Check Supabase dashboard for data

---

**Happy Building! Stay Safe!** 🔥🚒  
*Developed by TheGDevelopers*
