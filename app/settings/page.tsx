'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Navigation } from '@/components/navigation'
import { Save, AlertTriangle, Bell, Database } from 'lucide-react'

type DeviceSettings = {
  id: string
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<DeviceSettings>({
    id: '',
    device_id: 'ESP32_001',
    gas_warning_threshold: 300,
    gas_danger_threshold: 500,
    temp_warning_threshold: 35,
    temp_danger_threshold: 45,
    humidity_warning_threshold: 70,
    humidity_danger_threshold: 85,
    enable_gas_alerts: true,
    enable_temp_alerts: true,
    enable_flame_alerts: true,
    enable_buzzer: true,
    alert_cooldown_seconds: 60,
  })
  const [notifications, setNotifications] = useState({
    email: false,
    sms: false,
    push: false,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchThresholds()
  }, [])

  const fetchThresholds = async () => {
    const { data, error } = await supabase
      .from('device_settings')
      .select('*')
      .eq('device_id', 'ESP32_001')
      .single()

    if (data && !error) {
      setSettings(data)
    }
  }

  const handleSaveThresholds = async () => {
    setSaving(true)
    setMessage('')

    try {
      // First, try to update existing settings
      const { data: existing } = await supabase
        .from('device_settings')
        .select('id')
        .eq('device_id', settings.device_id)
        .single() as { data: { id: number } | null; error: any }

      let error
      
      if (existing) {
        // Update existing record
        const updateData = {
          gas_warning_threshold: settings.gas_warning_threshold,
          gas_danger_threshold: settings.gas_danger_threshold,
          temp_warning_threshold: settings.temp_warning_threshold,
          temp_danger_threshold: settings.temp_danger_threshold,
          humidity_warning_threshold: settings.humidity_warning_threshold,
          humidity_danger_threshold: settings.humidity_danger_threshold,
          enable_gas_alerts: settings.enable_gas_alerts,
          enable_temp_alerts: settings.enable_temp_alerts,
          enable_flame_alerts: settings.enable_flame_alerts,
          enable_buzzer: settings.enable_buzzer,
          alert_cooldown_seconds: settings.alert_cooldown_seconds,
        }
        const result = await (supabase as any)
          .from('device_settings')
          .update(updateData)
          .eq('device_id', settings.device_id)
        error = result.error
      } else {
        // Insert new record
        const insertData = {
          device_id: settings.device_id,
          gas_warning_threshold: settings.gas_warning_threshold,
          gas_danger_threshold: settings.gas_danger_threshold,
          temp_warning_threshold: settings.temp_warning_threshold,
          temp_danger_threshold: settings.temp_danger_threshold,
          humidity_warning_threshold: settings.humidity_warning_threshold,
          humidity_danger_threshold: settings.humidity_danger_threshold,
          enable_gas_alerts: settings.enable_gas_alerts,
          enable_temp_alerts: settings.enable_temp_alerts,
          enable_flame_alerts: settings.enable_flame_alerts,
          enable_buzzer: settings.enable_buzzer,
          alert_cooldown_seconds: settings.alert_cooldown_seconds,
        }
        const result = await (supabase as any)
          .from('device_settings')
          .insert(insertData)
        error = result.error
      }

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setMessage('✓ Settings saved successfully! ESP32 will use new thresholds on next reading.')
      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setMessage(`❌ Error saving settings: ${errorMsg}`)
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Configure your fire safety system</p>
        </div>

        <Tabs defaultValue="thresholds" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="thresholds" className="text-xs sm:text-sm">
              <AlertTriangle className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Alert </span>Thresholds
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="h-4 w-4 mr-1 sm:mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="database" className="text-xs sm:text-sm">
              <Database className="h-4 w-4 mr-1 sm:mr-2" />
              Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="thresholds">
            <Card>
              <CardHeader>
                <CardTitle>Alert Threshold Configuration</CardTitle>
                <CardDescription>
                  Set the sensor thresholds that trigger fire safety alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gas/Smoke Thresholds */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    Gas / Smoke Levels (PPM)
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gas-warning">⚠️ Warning Threshold</Label>
                      <Input
                        id="gas-warning"
                        type="number"
                        value={settings.gas_warning_threshold}
                        onChange={(e) =>
                          setSettings({ ...settings, gas_warning_threshold: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Yellow alert at this level (default: 300 PPM)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gas-danger">🚨 Danger Threshold</Label>
                      <Input
                        id="gas-danger"
                        type="number"
                        value={settings.gas_danger_threshold}
                        onChange={(e) =>
                          setSettings({ ...settings, gas_danger_threshold: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Red alert at this level (default: 500 PPM)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label>Enable Gas Alerts</Label>
                    <Switch
                      checked={settings.enable_gas_alerts}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enable_gas_alerts: checked })
                      }
                    />
                  </div>
                </div>

                {/* Temperature Thresholds */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    Temperature (°C)
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="temp-warning">⚠️ Warning Threshold</Label>
                      <Input
                        id="temp-warning"
                        type="number"
                        step="0.1"
                        value={settings.temp_warning_threshold}
                        onChange={(e) =>
                          setSettings({ ...settings, temp_warning_threshold: parseFloat(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Yellow alert at this level (default: 35°C)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temp-danger">🚨 Danger Threshold</Label>
                      <Input
                        id="temp-danger"
                        type="number"
                        step="0.1"
                        value={settings.temp_danger_threshold}
                        onChange={(e) =>
                          setSettings({ ...settings, temp_danger_threshold: parseFloat(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Red alert at this level (default: 45°C)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label>Enable Temperature Alerts</Label>
                    <Switch
                      checked={settings.enable_temp_alerts}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enable_temp_alerts: checked })
                      }
                    />
                  </div>
                </div>

                {/* Humidity Thresholds */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    Humidity (%)
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="humidity-warning">⚠️ Warning Threshold</Label>
                      <Input
                        id="humidity-warning"
                        type="number"
                        value={settings.humidity_warning_threshold}
                        onChange={(e) =>
                          setSettings({ ...settings, humidity_warning_threshold: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        High humidity warning (default: 70%)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="humidity-danger">🚨 Danger Threshold</Label>
                      <Input
                        id="humidity-danger"
                        type="number"
                        value={settings.humidity_danger_threshold}
                        onChange={(e) =>
                          setSettings({ ...settings, humidity_danger_threshold: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Critical humidity level (default: 85%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alert Settings */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Alert Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Flame Alerts</Label>
                        <p className="text-xs text-muted-foreground">Immediate alert on flame detection</p>
                      </div>
                      <Switch
                        checked={settings.enable_flame_alerts}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, enable_flame_alerts: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Buzzer</Label>
                        <p className="text-xs text-muted-foreground">Sound alarm on ESP32 device</p>
                      </div>
                      <Switch
                        checked={settings.enable_buzzer}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, enable_buzzer: checked })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cooldown">Alert Cooldown (seconds)</Label>
                      <Input
                        id="cooldown"
                        type="number"
                        value={settings.alert_cooldown_seconds}
                        onChange={(e) =>
                          setSettings({ ...settings, alert_cooldown_seconds: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum time between repeated alerts (default: 60s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-2">
                  <Label htmlFor="device-id">Device ID</Label>
                  <Input
                    id="device-id"
                    value={settings.device_id}
                    disabled
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Primary ESP32 device identifier
                  </p>
                </div>

                {message && (
                  <div className={`p-3 rounded-md ${message.includes('Error') ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700'}`}>
                    {message}
                  </div>
                )}

                <Button onClick={handleSaveThresholds} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Thresholds'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive fire safety alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via SMS (requires Twilio)
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-amber-600">
                    Note: Notification features require additional setup with Supabase Edge Functions
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
                <CardDescription>
                  Manage your Supabase database connection and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Supabase URL</Label>
                  <Input
                    value={process.env.NEXT_PUBLIC_SUPABASE_URL || ''}
                    disabled
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Realtime Status</Label>
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">Connected</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Data Management</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm">
                      Clear Old Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
