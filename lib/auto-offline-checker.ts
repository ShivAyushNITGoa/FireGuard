// Auto Offline Detection - Runs in Web App Background
// This checks every 10 seconds and marks devices offline after 1 minute of no data

import { supabase } from './supabase/client'

let intervalId: NodeJS.Timeout | null = null

/**
 * Marks devices as offline if they haven't sent data in 1 minute (60 seconds)
 */
export async function markStaleDevicesOffline() {
  try {
    const { error } = await supabase.rpc('mark_stale_devices_offline')
    
    if (error) {
      console.error('Error marking stale devices offline:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Failed to mark stale devices offline:', error)
    return false
  }
}

/**
 * Start auto-offline detection
 * Call this once when your app loads
 */
export function startAutoOfflineDetection() {
  // Don't start if already running
  if (intervalId) {
    console.log('Auto-offline detection already running')
    return
  }

  console.log('Starting auto-offline detection...')
  
  // DON'T run immediately on page load - wait first
  // This prevents marking devices offline right after refresh
  
  // Run every 10 seconds for more responsive updates (but not immediately)
  intervalId = setInterval(() => {
    markStaleDevicesOffline()
  }, 10000) // 10 seconds

  console.log('Auto-offline detection started (will run in 10 seconds)')
}

/**
 * Stop auto-offline detection
 * Call this when component unmounts
 */
export function stopAutoOfflineDetection() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('Auto-offline detection stopped')
  }
}

/**
 * Check device status based on last_seen timestamp
 * This is a client-side check for immediate UI feedback
 * Device is online if data received within 1 minute, otherwise offline
 */
export function getDeviceStatus(lastSeen: string | Date): 'online' | 'offline' {
  const lastSeenDate = new Date(lastSeen)
  const now = new Date()
  const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000
  
  // 1 minute threshold as requested
  if (diffSeconds < 60) return 'online'  // < 60 seconds = online
  return 'offline'                        // >= 60 seconds = offline
}
