'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Navigation } from '@/components/navigation'
import { StatsCard } from '@/components/stats-card'
import { SensorGauge } from '@/components/sensor-gauge'
import { AlertTimeline } from '@/components/alert-timeline'
import { FireRiskPredictor } from '@/components/fire-risk-predictor'
import { startThresholdMonitoring, stopThresholdMonitoring } from '@/lib/threshold-monitor'
import { Activity, AlertTriangle, Shield, Flame, Thermometer, Wind, Droplets } from 'lucide-react'

type SensorData = {
  id: string
  time: string
  gas: number
  flame: number
  temp: number
  humidity: number
  alert: boolean
  device_id?: string
  location?: string
}

type DeviceSettings = {
  gas_warning_threshold: number
  gas_danger_threshold: number
  temp_warning_threshold: number
  temp_danger_threshold: number
  humidity_warning_threshold: number
  humidity_danger_threshold: number
}

export default function AdvancedDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  const [latestData, setLatestData] = useState<SensorData | null>(null)
  const [stats, setStats] = useState({
    totalAlerts24h: 0,
    criticalAlerts: 0,
    systemUptime: 0,
    sensorsActive: 0,
    activeDevices: 0
  })
  const [thresholds, setThresholds] = useState<DeviceSettings>({
    gas_warning_threshold: 300,
    gas_danger_threshold: 500,
    temp_warning_threshold: 35,
    temp_danger_threshold: 50,
    humidity_warning_threshold: 70,
    humidity_danger_threshold: 85,
  })

  // Auth protection
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchLatestData()
    fetchStats()
    fetchThresholds()

    // Fetch data every 2 seconds
    const intervalId = setInterval(() => {
      fetchLatestData()
      fetchStats()
      fetchThresholds()
    }, 2000) // 2 seconds

    // Subscribe to real-time sensor data for immediate updates
    const sensorChannel = supabase
      .channel('sensor_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
        },
        (payload) => {
          setLatestData(payload.new as SensorData)
        }
      )
      .subscribe()

    // Start threshold monitoring service
    // This will automatically check thresholds and create alerts
    const thresholdChannel = startThresholdMonitoring()

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(sensorChannel)
      stopThresholdMonitoring(thresholdChannel)
    }
  }, [])

  // Recalculate stats when latestData changes
  useEffect(() => {
    if (latestData) {
      // Calculate stats directly without fetching
      const activeSensors = [latestData.gas, latestData.temp, latestData.humidity, latestData.flame]
        .filter(val => val !== null && val !== undefined && !isNaN(val))
        .length
      
      setStats(prev => ({
        ...prev,
        sensorsActive: activeSensors
      }))
    } else {
      setStats(prev => ({
        ...prev,
        sensorsActive: 0
      }))
    }
  }, [latestData])

  const fetchLatestData = async () => {
    const { data } = await supabase
      .from('sensor_data')
      .select('*')
      .order('time', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      // Check if data is recent (within last 60 seconds)
      const dataTime = new Date(data.time).getTime()
      const now = Date.now()
      const ageSeconds = (now - dataTime) / 1000
      
      if (ageSeconds > 60) {
        // Data is stale (device offline), clear it
        setLatestData(null)
      } else {
        // Data is fresh, show it
        setLatestData(data)
      }
    } else {
      setLatestData(null)
    }
  }

  const fetchThresholds = async () => {
    const { data } = await supabase
      .from('device_settings')
      .select('gas_warning_threshold, gas_danger_threshold, temp_warning_threshold, temp_danger_threshold, humidity_warning_threshold, humidity_danger_threshold')
      .eq('device_id', 'ESP32_001')
      .single()

    if (data) {
      setThresholds(data)
    }
  }

  const fetchStats = async () => {
    // Get alerts from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: alertsData } = await supabase
      .from('alerts')
      .select('severity')
      .gte('time', twentyFourHoursAgo)

    // Get active devices based on recent sensor data (within last 60 seconds)
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recentData } = await supabase
      .from('sensor_data')
      .select('device_id')
      .gte('time', sixtySecondsAgo)

    // Count unique devices with recent data
    const uniqueDevices = new Set(recentData?.map(d => d.device_id) || [])
    const activeDevices = uniqueDevices.size

    // Calculate system uptime (100% if any device is active, 0% if none)
    const uptimePercentage = activeDevices > 0 ? 100 : 0

    // Count active sensors from latest data
    const activeSensors = latestData ? 
      [latestData.gas, latestData.temp, latestData.humidity, latestData.flame]
        .filter(val => val !== null && val !== undefined && !isNaN(val))
        .length : 0

    setStats({
      totalAlerts24h: alertsData?.length || 0,
      criticalAlerts: alertsData?.filter(a => a.severity === 'critical').length || 0,
      systemUptime: Number(uptimePercentage.toFixed(1)),
      sensorsActive: activeSensors,
      activeDevices: activeDevices
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Advanced Fire Safety Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time monitoring with AI-powered analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Active Devices"
            value={stats.activeDevices}
            icon={Shield}
            description={stats.activeDevices > 0 ? "Online and monitoring" : "No devices online"}
            iconClassName={stats.activeDevices > 0 ? "text-green-500" : "text-gray-400"}
          />
          <StatsCard
            title="Alerts (24h)"
            value={stats.totalAlerts24h}
            icon={AlertTriangle}
            description="Total incidents"
            iconClassName="text-orange-500"
            trend={{ value: 15, isPositive: false }}
          />
          <StatsCard
            title="Critical Alerts"
            value={stats.criticalAlerts}
            icon={Flame}
            description="Requiring immediate action"
            iconClassName="text-red-500"
          />
          <StatsCard
            title="Active Sensors"
            value={stats.sensorsActive}
            icon={Activity}
            description="Currently monitoring"
            iconClassName="text-blue-500"
          />
        </div>

        {/* Sensor Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SensorGauge
            title="Gas / Smoke Level"
            value={latestData?.gas ?? null}
            maxValue={1000}
            unit="PPM"
            icon={Wind}
            thresholdWarning={thresholds.gas_warning_threshold}
            thresholdDanger={thresholds.gas_danger_threshold}
            iconColor="text-purple-500"
          />
          <SensorGauge
            title="Temperature"
            value={latestData?.temp ?? null}
            maxValue={100}
            unit="°C"
            icon={Thermometer}
            thresholdWarning={thresholds.temp_warning_threshold}
            thresholdDanger={thresholds.temp_danger_threshold}
            iconColor="text-red-500"
          />
          <SensorGauge
            title="Humidity"
            value={latestData?.humidity ?? null}
            maxValue={100}
            unit="%"
            icon={Droplets}
            thresholdWarning={thresholds.humidity_warning_threshold}
            thresholdDanger={thresholds.humidity_danger_threshold}
            iconColor="text-blue-500"
          />
          <SensorGauge
            title="Flame Detection"
            value={latestData?.flame !== null && latestData?.flame !== undefined ? (latestData.flame === 0 ? 100 : 0) : null}
            maxValue={100}
            unit="%"
            icon={Flame}
            thresholdWarning={50}
            thresholdDanger={75}
            iconColor="text-orange-500"
          />
        </div>

        {/* Fire Risk Prediction & Alert Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FireRiskPredictor />
          <AlertTimeline />
        </div>
      </main>
    </div>
  )
}
