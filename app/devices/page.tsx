'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/navigation'
import { Cpu, MapPin, Clock, Plus, Power, Settings } from 'lucide-react'
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

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()

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

    return () => {
      supabase.removeChannel(channel)
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
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Devices</h1>
            <p className="text-muted-foreground">Manage your ESP32 fire safety devices</p>
          </div>
          <Button>
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
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
                <CardContent>
                  <div className="space-y-3">
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

                    <div className="pt-4 flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Power className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              <Button variant="link" className="p-0">
                View firmware documentation →
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
