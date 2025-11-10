'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Settings
} from 'lucide-react'

type DeviceHealth = {
  device_id: string
  cpu_usage: number
  memory_usage: number
  wifi_signal: number
  battery_voltage: number
  uptime_seconds: number
  error_count: number
  firmware_version: string
  timestamp: string
}

type Device = {
  device_id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'error'
  last_seen: string
}

export default function AdvancedDeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceHealth, setDeviceHealth] = useState<Map<string, DeviceHealth>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
    fetchDeviceHealth()

    // Subscribe to real-time health updates
    const healthChannel = supabase
      .channel('device_health_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_health',
        },
        (payload) => {
          const newHealth = payload.new as DeviceHealth
          setDeviceHealth(prev => new Map(prev).set(newHealth.device_id, newHealth))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(healthChannel)
    }
  }, [])

  const fetchDevices = async () => {
    const { data } = await supabase
      .from('devices')
      .select('*')
      .order('name')

    if (data) {
      setDevices(data)
    }
    setLoading(false)
  }

  const fetchDeviceHealth = async () => {
    const { data } = await supabase
      .from('device_health')
      .select('*')
      .order('timestamp', { ascending: false }) as { data: DeviceHealth[] | null; error: any }

    if (data) {
      const healthMap = new Map<string, DeviceHealth>()
      data.forEach(health => {
        if (!healthMap.has(health.device_id)) {
          healthMap.set(health.device_id, health)
        }
      })
      setDeviceHealth(healthMap)
    }
  }

  const getHealthScore = (health: DeviceHealth | undefined): number => {
    if (!health) return 0
    
    let score = 100
    
    // CPU penalty
    if (health.cpu_usage > 80) score -= 20
    else if (health.cpu_usage > 60) score -= 10
    
    // Memory penalty
    if (health.memory_usage > 80) score -= 20
    else if (health.memory_usage > 60) score -= 10
    
    // WiFi penalty
    if (health.wifi_signal < -80) score -= 20
    else if (health.wifi_signal < -70) score -= 10
    
    // Battery penalty
    if (health.battery_voltage < 3.3) score -= 20
    else if (health.battery_voltage < 3.5) score -= 10
    
    // Error penalty
    if (health.error_count > 10) score -= 15
    else if (health.error_count > 5) score -= 5
    
    return Math.max(score, 0)
  }

  const getHealthStatus = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' }
    if (score >= 60) return { label: 'Good', color: 'text-blue-600' }
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600' }
    return { label: 'Poor', color: 'text-red-600' }
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Advanced Device Management
          </h1>
          <p className="text-muted-foreground">Monitor and manage ESP32 devices with real-time health metrics</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading devices...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {devices.map(device => {
              const health = deviceHealth.get(device.device_id)
              const healthScore = getHealthScore(health)
              const healthStatus = getHealthStatus(healthScore)

              return (
                <Card key={device.device_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Cpu className="h-5 w-5" />
                          {device.name}
                        </CardTitle>
                        <CardDescription>{device.location}</CardDescription>
                      </div>
                      <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                        {device.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Health Score */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Health Score</span>
                        <span className={`text-2xl font-bold ${healthStatus.color}`}>
                          {healthScore}%
                        </span>
                      </div>
                      <Progress value={healthScore} className="h-2" />
                      <p className={`text-xs mt-1 ${healthStatus.color}`}>{healthStatus.label}</p>
                    </div>

                    {health && (
                      <>
                        {/* System Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* CPU Usage */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Zap className="h-4 w-4" />
                              CPU Usage
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={health.cpu_usage} className="h-1.5 flex-1" />
                              <span className="text-sm font-medium w-12 text-right">
                                {health.cpu_usage.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Memory Usage */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <HardDrive className="h-4 w-4" />
                              Memory
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={health.memory_usage} className="h-1.5 flex-1" />
                              <span className="text-sm font-medium w-12 text-right">
                                {health.memory_usage.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* WiFi Signal */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Wifi className="h-4 w-4" />
                              WiFi Signal
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={Math.min(100, Math.max(0, (health.wifi_signal + 100) * 2))} 
                                className="h-1.5 flex-1" 
                              />
                              <span className="text-sm font-medium w-12 text-right">
                                {health.wifi_signal} dBm
                              </span>
                            </div>
                          </div>

                          {/* Battery */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Battery className="h-4 w-4" />
                              Battery
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={Math.min(100, (health.battery_voltage / 4.2) * 100)} 
                                className="h-1.5 flex-1" 
                              />
                              <span className="text-sm font-medium w-12 text-right">
                                {health.battery_voltage.toFixed(2)}V
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                              <Clock className="h-3 w-3" />
                              Uptime
                            </div>
                            <div className="text-sm font-medium">
                              {formatUptime(health.uptime_seconds)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                              <AlertTriangle className="h-3 w-3" />
                              Errors
                            </div>
                            <div className="text-sm font-medium">
                              {health.error_count}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                              <Settings className="h-3 w-3" />
                              Version
                            </div>
                            <div className="text-sm font-medium">
                              {health.firmware_version}
                            </div>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex gap-2 pt-2">
                          {health.cpu_usage < 70 && health.memory_usage < 70 && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Optimal Performance
                            </Badge>
                          )}
                          {health.error_count > 5 && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Errors Detected
                            </Badge>
                          )}
                          {health.battery_voltage < 3.5 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <Battery className="h-3 w-3 mr-1" />
                              Low Battery
                            </Badge>
                          )}
                        </div>
                      </>
                    )}

                    {!health && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No health data available</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Activity className="h-4 w-4 mr-1" />
                        Diagnostics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {devices.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Cpu className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Devices Found</h3>
              <p className="text-muted-foreground mb-4">
                Add your first ESP32 device to start monitoring
              </p>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
