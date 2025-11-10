import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getAlertSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'high':
      return 'destructive'
    case 'medium':
      return 'warning'
    case 'low':
      return 'default'
    default:
      return 'default'
  }
}

export function getDeviceStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'success'
    case 'offline':
      return 'secondary'
    case 'error':
      return 'destructive'
    default:
      return 'default'
  }
}

export function calculateAlertSeverity(
  gas: number,
  flame: number,
  temp: number,
  thresholds: { gas: number; flame: number; temp: number }
): 'low' | 'medium' | 'high' | 'critical' {
  const gasExcess = (gas - thresholds.gas) / thresholds.gas
  const flameExcess = flame === 0 ? 1 : 0 // Flame detected (LOW/0 means flame present)
  const tempExcess = (temp - thresholds.temp) / thresholds.temp

  const maxExcess = Math.max(gasExcess, flameExcess, tempExcess)

  if (maxExcess >= 0.5 || flameExcess === 1) return 'critical'
  if (maxExcess >= 0.3) return 'high'
  if (maxExcess >= 0.1) return 'medium'
  return 'low'
}

export function formatSensorValue(type: string, value: number): string {
  switch (type) {
    case 'gas':
      return `${value} ppm`
    case 'temp':
      return `${value.toFixed(1)}°C`
    case 'humidity':
      return `${value.toFixed(1)}%`
    case 'flame':
      return value === 0 ? 'Detected' : 'Clear'
    default:
      return String(value)
  }
}
