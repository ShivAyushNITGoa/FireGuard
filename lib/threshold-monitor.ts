// Threshold Monitor Service
// Monitors sensor data and creates alerts based on user-configured thresholds
// Runs in the background of the web app

import { supabase } from './supabase/client'

type SensorData = {
  id: string
  device_id: string
  gas: number | null
  temp: number | null
  humidity: number | null
  flame: number | null
  time: string
}

type DeviceSettings = {
  device_id: string
  gas_warning_threshold: number
  gas_danger_threshold: number
  temp_warning_threshold: number
  temp_danger_threshold: number
  humidity_warning_threshold: number
  humidity_danger_threshold: number
  enable_gas_alerts: boolean
  enable_temp_alerts: boolean
  enable_flame_alerts: boolean
  enable_buzzer: boolean
  alert_cooldown_seconds: number
}

type AlertRecord = {
  device_id: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  gas?: number
  temp?: number
  humidity?: number
  flame?: number
}

// Track last alert time per device to implement cooldown
const lastAlertTime: Record<string, number> = {}

/**
 * Check sensor data against thresholds and create alerts if needed
 */
export async function checkThresholds(sensorData: SensorData) {
  try {
    // Fetch device settings
    const { data: settings, error: settingsError } = await supabase
      .from('device_settings')
      .select('*')
      .eq('device_id', sensorData.device_id)
      .single() as { data: DeviceSettings | null; error: any }

    if (settingsError || !settings) {
      console.warn('No settings found for device:', sensorData.device_id)
      return
    }

    // Check cooldown period
    const now = Date.now()
    const lastAlert = lastAlertTime[sensorData.device_id] || 0
    const cooldownMs = settings.alert_cooldown_seconds * 1000

    if (now - lastAlert < cooldownMs) {
      // Still in cooldown period, skip alert
      return
    }

    // Analyze sensor data and determine if alert is needed
    const alerts: AlertRecord[] = []

    // Check flame sensor (CRITICAL)
    if (
      settings.enable_flame_alerts &&
      sensorData.flame !== null &&
      sensorData.flame === 0 // LOW means flame detected
    ) {
      const sensorReadings = [
        sensorData.gas !== null ? `Gas: ${sensorData.gas} PPM` : null,
        sensorData.temp !== null ? `Temp: ${sensorData.temp}°C` : null,
        sensorData.humidity !== null ? `Humidity: ${sensorData.humidity}%` : null
      ].filter(Boolean).join(', ')
      
      alerts.push({
        device_id: sensorData.device_id,
        message: `🔥 FLAME DETECTED! [${sensorReadings}]`,
        severity: 'critical',
        flame: sensorData.flame,
        gas: sensorData.gas ?? undefined,
        temp: sensorData.temp ?? undefined,
        humidity: sensorData.humidity ?? undefined,
      })
    }

    // Check Gas levels
    if (settings.enable_gas_alerts && sensorData.gas !== null) {
      if (sensorData.gas >= settings.gas_danger_threshold) {
        const sensorReadings = [
          sensorData.gas !== null ? `Gas: ${sensorData.gas} PPM` : null,
          sensorData.temp !== null ? `Temp: ${sensorData.temp}°C` : null,
          sensorData.humidity !== null ? `Humidity: ${sensorData.humidity}%` : null
        ].filter(Boolean).join(', ')
        
        alerts.push({
          device_id: sensorData.device_id,
          message: `🚨 CRITICAL: Gas level at ${sensorData.gas} PPM [${sensorReadings}]`,
          severity: 'critical',
          gas: sensorData.gas,
          temp: sensorData.temp ?? undefined,
          humidity: sensorData.humidity ?? undefined,
        })
      } else if (sensorData.gas >= settings.gas_warning_threshold) {
        const sensorReadings = [
          sensorData.gas !== null ? `Gas: ${sensorData.gas} PPM` : null,
          sensorData.temp !== null ? `Temp: ${sensorData.temp}°C` : null,
          sensorData.humidity !== null ? `Humidity: ${sensorData.humidity}%` : null
        ].filter(Boolean).join(', ')
        
        alerts.push({
          device_id: sensorData.device_id,
          message: `⚠️ WARNING: Gas level elevated [${sensorReadings}]`,
          severity: 'medium',
          gas: sensorData.gas,
          temp: sensorData.temp ?? undefined,
          humidity: sensorData.humidity ?? undefined,
        })
      }
    }

    // Check Temperature
    if (settings.enable_temp_alerts && sensorData.temp !== null) {
      if (sensorData.temp >= settings.temp_danger_threshold) {
        const sensorReadings = [
          sensorData.gas !== null ? `Gas: ${sensorData.gas} PPM` : null,
          sensorData.temp !== null ? `Temp: ${sensorData.temp}°C` : null,
          sensorData.humidity !== null ? `Humidity: ${sensorData.humidity}%` : null
        ].filter(Boolean).join(', ')
        
        alerts.push({
          device_id: sensorData.device_id,
          message: `🚨 CRITICAL: High temperature detected [${sensorReadings}]`,
          severity: 'critical',
          gas: sensorData.gas ?? undefined,
          temp: sensorData.temp,
          humidity: sensorData.humidity ?? undefined,
        })
      } else if (sensorData.temp >= settings.temp_warning_threshold) {
        const sensorReadings = [
          sensorData.gas !== null ? `Gas: ${sensorData.gas} PPM` : null,
          sensorData.temp !== null ? `Temp: ${sensorData.temp}°C` : null,
          sensorData.humidity !== null ? `Humidity: ${sensorData.humidity}%` : null
        ].filter(Boolean).join(', ')
        
        alerts.push({
          device_id: sensorData.device_id,
          message: `⚠️ WARNING: Temperature elevated [${sensorReadings}]`,
          severity: 'medium',
          gas: sensorData.gas ?? undefined,
          temp: sensorData.temp,
          humidity: sensorData.humidity ?? undefined,
        })
      }
    }

    // Check Humidity
    if (sensorData.humidity !== null) {
      if (sensorData.humidity >= settings.humidity_danger_threshold) {
        const sensorReadings = [
          sensorData.gas !== null ? `Gas: ${sensorData.gas} PPM` : null,
          sensorData.temp !== null ? `Temp: ${sensorData.temp}°C` : null,
          sensorData.humidity !== null ? `Humidity: ${sensorData.humidity}%` : null
        ].filter(Boolean).join(', ')
        
        alerts.push({
          device_id: sensorData.device_id,
          message: `🚨 CRITICAL: High humidity [${sensorReadings}]`,
          severity: 'high',
          gas: sensorData.gas ?? undefined,
          temp: sensorData.temp ?? undefined,
          humidity: sensorData.humidity,
        })
      } else if (sensorData.humidity >= settings.humidity_warning_threshold) {
        const sensorReadings = [
          sensorData.gas !== null ? `Gas: ${sensorData.gas} PPM` : null,
          sensorData.temp !== null ? `Temp: ${sensorData.temp}°C` : null,
          sensorData.humidity !== null ? `Humidity: ${sensorData.humidity}%` : null
        ].filter(Boolean).join(', ')
        
        alerts.push({
          device_id: sensorData.device_id,
          message: `⚠️ WARNING: Humidity elevated [${sensorReadings}]`,
          severity: 'medium',
          gas: sensorData.gas ?? undefined,
          temp: sensorData.temp ?? undefined,
          humidity: sensorData.humidity,
        })
      }
    }

    // Combined critical condition: High gas + high temp
    if (
      settings.enable_gas_alerts &&
      settings.enable_temp_alerts &&
      sensorData.gas !== null &&
      sensorData.temp !== null &&
      sensorData.gas >= settings.gas_danger_threshold &&
      sensorData.temp >= settings.temp_danger_threshold
    ) {
      alerts.push({
        device_id: sensorData.device_id,
        message: `🔥 EXTREME DANGER: High gas (${sensorData.gas} PPM) AND high temperature (${sensorData.temp}°C) detected!`,
        severity: 'critical',
        gas: sensorData.gas,
        temp: sensorData.temp,
        humidity: sensorData.humidity ?? undefined,
      })
    }

    // Insert alerts into database
    if (alerts.length > 0) {
      // Take the highest severity alert
      const criticalAlert = alerts.find(a => a.severity === 'critical')
      const alertToSend = criticalAlert || alerts[0]

      const { error: alertError } = await supabase
        .from('alerts')
        .insert({
          device_id: alertToSend.device_id,
          message: alertToSend.message,
          severity: alertToSend.severity,
          gas: alertToSend.gas,
          temp: alertToSend.temp,
          humidity: alertToSend.humidity,
          flame: alertToSend.flame,
          time: new Date().toISOString(),
        } as any)

      if (alertError) {
        console.error('Error creating alert:', alertError)
      } else {
        // Update last alert time
        lastAlertTime[sensorData.device_id] = now
        console.log('✓ Alert created:', alertToSend.message)
      }
    }
  } catch (error) {
    console.error('Error in threshold monitoring:', error)
  }
}

/**
 * Start monitoring sensor data in real-time
 */
export function startThresholdMonitoring() {
  console.log('🔍 Starting threshold monitoring service...')

  // Subscribe to new sensor data
  const channel = supabase
    .channel('threshold_monitor')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_data',
      },
      (payload) => {
        const sensorData = payload.new as SensorData
        checkThresholds(sensorData)
      }
    )
    .subscribe()

  console.log('✓ Threshold monitoring active')

  return channel
}

/**
 * Stop monitoring
 */
export function stopThresholdMonitoring(channel: any) {
  if (channel) {
    supabase.removeChannel(channel)
    console.log('✓ Threshold monitoring stopped')
  }
}
