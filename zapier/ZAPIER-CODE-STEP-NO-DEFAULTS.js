// ============================================================================
// FireGuard Zapier Code Step - NO DEFAULTS VERSION
// Missing values remain blank
// ============================================================================

// Get webhook data using Zapier placeholders
const device_id = '{{step_1.device_id}}';
const message = '{{step_1.message}}';
const severity = '{{step_1.severity}}';
const temp = '{{step_1.temp}}';
const gas = '{{step_1.gas}}';
const humidity = '{{step_1.humidity}}';
const flame = '{{step_1.flame}}';
const location = '{{step_1.location}}';
const email = '{{step_1.email}}';
const time = '{{step_1.time}}';
const alert_id = '{{step_1.alert_id}}' || '{{step_1.id}}';

console.log('=== ZAPIER CODE STEP DEBUG ===');
console.log('Device:', device_id);
console.log('Message:', message);
console.log('Severity:', severity);
console.log('Temp:', temp);
console.log('Gas:', gas);
console.log('Humidity:', humidity);
console.log('Flame:', flame);

// Severity color and emoji mappings
const severityColors = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#F59E0B',
  low: '#10B981'
};

const severityEmojis = {
  critical: '🚨',
  high: '⚠️',
  medium: '⚡',
  low: 'ℹ️'
};

// Format timestamp
let timestamp = '';
if (time) {
  try {
    const dt = new Date(time);
    if (!isNaN(dt)) {
      timestamp = dt.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    }
  } catch (e) {
    timestamp = time;
  }
}

// Parse sensor values - keep blank if missing
let temperatureText = '';
if (temp && temp !== 'null' && temp !== '') {
  const tempNum = parseFloat(temp);
  if (!isNaN(tempNum)) {
    temperatureText = `${tempNum.toFixed(1)}°C`;
  }
}

let gasText = '';
if (gas && gas !== 'null' && gas !== '') {
  const gasNum = parseFloat(gas);
  if (!isNaN(gasNum)) {
    gasText = `${gasNum.toFixed(0)} AQI`;
  }
}

let humidityText = '';
if (humidity && humidity !== 'null' && humidity !== '') {
  const humidityNum = parseFloat(humidity);
  if (!isNaN(humidityNum)) {
    humidityText = `${humidityNum.toFixed(1)}%`;
  }
}

// Determine temperature severity class
let tempClass = 'normal';
if (temp && temp !== 'null' && temp !== '') {
  const tempNum = parseFloat(temp);
  if (!isNaN(tempNum)) {
    if (tempNum > 45) tempClass = 'critical';
    else if (tempNum > 35) tempClass = 'warning';
  }
}

// Determine gas severity class
let gasClass = 'normal';
if (gas && gas !== 'null' && gas !== '') {
  const gasNum = parseFloat(gas);
  if (!isNaN(gasNum)) {
    if (gasNum > 600) gasClass = 'critical';
    else if (gasNum > 400) gasClass = 'warning';
  }
}

// Determine flame status - keep blank if missing
let flameStatus = '';
let flameClass = 'normal';
if (flame && flame !== 'null' && flame !== '') {
  const flameNum = parseInt(flame, 10);
  if (!isNaN(flameNum)) {
    if (flameNum === 0) {
      flameStatus = '🔥 DETECTED';
      flameClass = 'critical';
    } else {
      flameStatus = '✓ Clear';
      flameClass = 'normal';
    }
  }
}

// Safety instructions - only for critical/high alerts
let safetyInstructions = '';
if (severity === 'critical' || severity === 'high') {
  safetyInstructions = `
    <div class="safety-section">
      <div class="safety-title">
        <span class="safety-title-icon">⚠️</span>
        Immediate Actions Required
      </div>
      <ul class="safety-list">
        <li>Evacuate if safe</li>
        <li>Call emergency services</li>
        <li>Alert occupants</li>
        <li>Use extinguisher only if trained</li>
      </ul>
    </div>
  `;
}

// Return formatted data for email template
return {
  // Severity formatting
  severity_color: severityColors[severity] || '#6B7280',
  severity_emoji: severityEmojis[severity] || '🔔',
  severity: severity,
  
  // Alert details
  message: message,
  timestamp: timestamp,
  location: location,
  device_id: device_id,
  alert_id: alert_id,
  
  // Sensor readings - blank if missing
  temperature: temperatureText,
  temp_class: tempClass,
  gas_reading: gasText,
  gas_class: gasClass,
  humidity: humidityText,
  
  // Flame detection - blank if missing
  flame_status: flameStatus,
  flame_class: flameClass,
  
  // Safety info - only for high/critical
  safety_instructions: safetyInstructions,
  
  // SMS variables (for future SMS integration)
  sms_var1: `${(severity || 'ALERT').toUpperCase()} - ${message}`,
  sms_var2: `Dev ${device_id} @ ${location} ${temperatureText}`,
  
  // URLs
  dashboard_url: 'https://fireguard.thegdevelopers.online/dashboard',
  settings_url: 'https://fireguard.thegdevelopers.online/settings',
  
  // Email recipient
  email: email
};
