'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Cpu, MapPin, Clock, Plus, Power, Settings, ExternalLink, HardDrive, Wifi, Battery, Activity, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { startAutoOfflineDetection, stopAutoOfflineDetection, getDeviceStatus } from '@/lib/auto-offline-checker'

type Device = {
  id: string
  name: string
  location: string
  device_id: string
  status: 'online' | 'offline'
  last_seen: string
  created_at: string
}

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

export default function DevicesPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceHealth, setDeviceHealth] = useState<Map<string, DeviceHealth>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
    fetchDeviceHealth()

    // Start auto-offline detection
    startAutoOfflineDetection()

    // Subscribe to device status changes
    const channel = supabase
      .channel('device_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
        },
        () => {
          fetchDevices()
        }
      )
      .subscribe()

    // Subscribe to device health updates
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
      supabase.removeChannel(channel)
      supabase.removeChannel(healthChannel)
      stopAutoOfflineDetection()
    }
  }, [])

  const fetchDevices = async () => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && !error) {
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

  const getStatusBadge = (status: string, lastSeen: string) => {
    // Use client-side check for immediate feedback (1-minute threshold)
    const clientStatus = getDeviceStatus(lastSeen)
    const displayStatus = clientStatus || status
    
    switch (displayStatus) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>
      default:
        return <Badge variant="secondary">Offline</Badge>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p>Loading devices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Devices</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage your connected fire safety devices</p>
          </div>
          <Button onClick={() => alert('Devices auto-register when powered on with proper Supabase credentials configured in firmware')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>

        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Cpu className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Devices Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first ESP32 device to start monitoring
              </p>
              <Button onClick={() => alert('Devices auto-register when powered on with proper Supabase credentials configured in firmware')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {devices.map((device) => {
              const health = deviceHealth.get(device.device_id)
              const healthScore = getHealthScore(health)
              const healthStatus = getHealthStatus(healthScore)

              return (
                <Card key={device.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Cpu className="h-5 w-5 text-primary" />
                          <span>{device.name}</span>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {device.device_id}
                        </CardDescription>
                      </div>
                      {getStatusBadge(device.status, device.last_seen)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Location and Last Seen */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{device.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Last seen: {formatDate(device.last_seen)}
                        </span>
                      </div>
                    </div>

                    {/* Health Score */}
                    {health && (
                      <>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Health Score</span>
                            <span className={`text-lg font-bold ${healthStatus.color}`}>
                              {healthScore}%
                            </span>
                          </div>
                          <Progress value={healthScore} className="h-2" />
                          <p className={`text-xs mt-1 ${healthStatus.color}`}>{healthStatus.label}</p>
                        </div>

                        {/* System Metrics */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Zap className="h-3 w-3" />
                              CPU
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={health.cpu_usage} className="h-1 flex-1" />
                              <span className="font-medium w-10 text-right text-xs">{health.cpu_usage.toFixed(0)}%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <HardDrive className="h-3 w-3" />
                              Memory
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={health.memory_usage} className="h-1 flex-1" />
                              <span className="font-medium w-10 text-right text-xs">{health.memory_usage.toFixed(0)}%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Wifi className="h-3 w-3" />
                              WiFi
                            </div>
                            <div className="text-xs font-medium">{health.wifi_signal} dBm</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Battery className="h-3 w-3" />
                              Battery
                            </div>
                            <div className="text-xs font-medium">{health.battery_voltage.toFixed(2)}V</div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
                          <div>
                            <div className="text-muted-foreground">Uptime</div>
                            <div className="font-medium">{formatUptime(health.uptime_seconds)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Errors</div>
                            <div className="font-medium">{health.error_count}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">FW</div>
                            <div className="font-medium">{health.firmware_version}</div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (health) {
                            alert(`Diagnostics for ${device.name}:\n\nCPU: ${health.cpu_usage.toFixed(1)}%\nMemory: ${health.memory_usage.toFixed(1)}%\nWiFi: ${health.wifi_signal} dBm\nBattery: ${health.battery_voltage.toFixed(2)}V\nUptime: ${formatUptime(health.uptime_seconds)}\nErrors: ${health.error_count}`)
                          } else {
                            alert('No health data available yet')
                          }
                        }}
                      >
                        <Activity className="h-4 w-4 mr-1" />
                        Diagnostics
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.location.href = `/settings?device=${device.device_id}`}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Device Setup Instructions</CardTitle>
            <CardDescription>How to add a new ESP32 device</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Flash the firmware to your ESP32-S3 board</li>
              <li>Configure WiFi credentials in the firmware</li>
              <li>Set Supabase URL and API key</li>
              <li>Connect sensors (MQ-2, Flame, DHT22)</li>
              <li>Power on the device - it will auto-register</li>
            </ol>
            <div className="mt-4">
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => window.open('https://github.com/ShivAyushNITGoa/FireGuard/tree/main/firmware', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View firmware documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
