'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Activity, AlertTriangle, Calendar } from 'lucide-react'

type SensorReading = {
  time: string
  gas: number
  temp: number
  humidity: number
  flame: number
}

type Alert = {
  severity: 'critical' | 'high' | 'medium' | 'low'
}

type AlertStats = {
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

export default function AnalyticsPage() {
  const [sensorData, setSensorData] = useState<SensorReading[]>([])
  const [alertStats, setAlertStats] = useState<AlertStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  })
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)

    // Calculate time range
    const now = new Date()
    const startTime = new Date()
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1)
        break
      case '24h':
        startTime.setHours(now.getHours() - 24)
        break
      case '7d':
        startTime.setDate(now.getDate() - 7)
        break
      case '30d':
        startTime.setDate(now.getDate() - 30)
        break
    }

    // Fetch ALL sensor data in the time range
    const { data: sensors, error: sensorError } = await supabase
      .from('sensor_data')
      .select('time, gas, temp, humidity, flame')
      .gte('time', startTime.toISOString())
      .order('time', { ascending: true })  // Oldest to newest for chart

    if (sensors && !sensorError) {
      setSensorData(sensors)
    }

    // Fetch alert statistics
    const { data: alerts, error: alertError } = await supabase
      .from('alerts')
      .select('severity')
      .gte('time', startTime.toISOString()) as { data: Alert[] | null; error: any }

    if (alerts && !alertError) {
      const stats: AlertStats = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      }
      setAlertStats(stats)
    }

    setLoading(false)
  }, [timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatChartData = () => {
    return sensorData.map(d => {
      const date = new Date(d.time)
      let timeLabel = ''
      
      // Format based on time range
      if (timeRange === '1h' || timeRange === '24h') {
        // Show time only for short ranges
        timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      } else {
        // Show date and time for longer ranges
        timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                   ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
      
      return {
        time: timeLabel,
        Gas: d.gas ?? 0,
        Temperature: d.temp ?? 0,
        Humidity: d.humidity ?? 0,
        Flame: d.flame === 0 ? 100 : 0,
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Historical data analysis and insights</p>
        </div>
          
        <div className="flex items-center justify-between mb-8">
          <div>
          </div>
          
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="1h">1H</TabsTrigger>
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {timeRange === '24h' ? 'Last 24 hours' : `Last ${timeRange}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{alertStats.critical}</div>
              <p className="text-xs text-muted-foreground">
                {alertStats.critical > 0 ? 'Immediate attention required' : 'None'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{alertStats.high}</div>
              <p className="text-xs text-muted-foreground">High severity alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sensorData.length}</div>
              <p className="text-xs text-muted-foreground">Sensor readings collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Sensor Readings</CardTitle>
              <CardDescription>Temperature, Gas, and Humidity over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading chart...</p>
                </div>
              ) : sensorData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available for this time range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                  <AreaChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Temperature"
                      stroke="#ef4444"
                      fill="#fca5a5"
                      name="Temperature (°C)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Gas"
                      stroke="#8b5cf6"
                      fill="#c4b5fd"
                      name="Gas (PPM)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Humidity"
                      stroke="#3b82f6"
                      fill="#93c5fd"
                      name="Humidity (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sensor Trends</CardTitle>
              <CardDescription>Individual sensor readings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading chart...</p>
                </div>
              ) : sensorData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available for this time range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Gas"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="Gas (PPM)"
                    />
                    <Line
                      type="monotone"
                      dataKey="Temperature"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      name="Temperature (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="Humidity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Humidity (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flame Detection Events</CardTitle>
              <CardDescription>Timeline of flame sensor activations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading chart...</p>
                </div>
              ) : sensorData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available for this time range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} ticks={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => value === 100 ? 'FLAME DETECTED' : 'No Flame'}
                    />
                    <Legend />
                    <Area
                      type="stepAfter"
                      dataKey="Flame"
                      stroke="#ff0000"
                      fill="#ff4444"
                      name="Flame Detected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  🔥 <strong>Flame Detection:</strong> Red spikes indicate flame sensor activation. 
                  Any detection triggers an immediate critical alert.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Distribution</CardTitle>
              <CardDescription>Breakdown by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    <span className="text-sm">Critical</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{alertStats.critical}</span>
                    <span className="text-sm text-muted-foreground">
                      ({alertStats.total > 0 ? ((alertStats.critical / alertStats.total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-orange-500" />
                    <span className="text-sm">High</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{alertStats.high}</span>
                    <span className="text-sm text-muted-foreground">
                      ({alertStats.total > 0 ? ((alertStats.high / alertStats.total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-yellow-500" />
                    <span className="text-sm">Medium</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{alertStats.medium}</span>
                    <span className="text-sm text-muted-foreground">
                      ({alertStats.total > 0 ? ((alertStats.medium / alertStats.total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                    <span className="text-sm">Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{alertStats.low}</span>
                    <span className="text-sm text-muted-foreground">
                      ({alertStats.total > 0 ? ((alertStats.low / alertStats.total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
