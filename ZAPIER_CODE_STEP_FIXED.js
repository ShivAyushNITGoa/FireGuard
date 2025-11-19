// Get alert data from webhook
const alert = inputData;

// Determine if it's an alert or warning
const severity = (alert.severity || 'low').toLowerCase();
const isAlert = ['critical', 'high'].includes(severity);
const isWarning = ['medium', 'low'].includes(severity);

// Severity emoji and color mapping
const severityMap = {
  'critical': { emoji: '🚨', color: '#DC2626', type: 'Alert' },
  'high': { emoji: '⚠️', color: '#EA580C', type: 'Alert' },
  'medium': { emoji: '⚡', color: '#F59E0B', type: 'Warning' },
  'low': { emoji: 'ℹ️', color: '#10B981', type: 'Warning' }
};

const { emoji, color, type } = severityMap[severity] || { emoji: '🔔', color: '#6B7280', type: 'Alert' };

// Format timestamp - USE ALERT TIME, NOT CURRENT TIME
const timestamp = alert.time 
  ? new Date(alert.time).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'  // IST timezone
    })
  : new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

// Return formatted data
return {
  alert_type: type,
  severity: severity.toUpperCase(),
  severity_emoji: emoji,
  severity_color: color,
  message: alert.message || 'Alert triggered',
  device_id: alert.device_id || 'Unknown Device',
  location: alert.location || 'Building A - Floor 1',
  email: alert.email || 'admin@fireguard.com',
  timestamp: timestamp,  // ACTUAL alert time, not current time
  dashboard_url: 'https://fireguard.thegdevelopers.online/dashboard',
  settings_url: 'https://fireguard.thegdevelopers.online/settings',
  company_url: 'https://thegdevelopers.info/',
  company_name: 'The GDevelopers',
  system_name: 'FireGuard: Fire Safety & Evacuation Alert System'
};
