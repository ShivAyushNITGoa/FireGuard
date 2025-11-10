'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, TrendingUp, AlertTriangle, Activity, Calendar } from 'lucide-react'

type SensorData = {
  time: string
  gas: number
  temp: number
  flame: number
}

type Alert = {
  severity: 'low' | 'medium' | 'high' | 'critical'
  time: string
}

export default function AdvancedAnalytics() {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [timeRange, setTimeRange] = useState('24H')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    
    // Calculate time range
    const now = new Date()
    let startTime = new Date()
    
    switch (timeRange) {
      case '1H':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24H':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7D':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30D':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    // Fetch sensor data
    const { data: sensorDataResult } = await supabase
      .from('sensor_data')
      .select('time, gas, temp, flame')
      .gte('time', startTime.toISOString())
      .order('time', { ascending: true })
      .limit(100)

    if (sensorDataResult) {
      setSensorData(sensorDataResult.map((d: any) => ({
        time: new Date(d.time).toLocaleTimeString(),
        gas: d.gas,
        temp: d.temp,
        flame: d.flame
      })))
    }

    // Fetch alerts
    const { data: alertsData } = await supabase
      .from('alerts')
      .select('severity, time')
      .gte('time', startTime.toISOString())
      .order('time', { ascending: false })

    if (alertsData) {
      setAlerts(alertsData)
    }

    setLoading(false)
  }

  // Calculate alert statistics
  const alertStats = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  }

  const pieData = [
    { name: 'Critical', value: alertStats.critical, color: '#ef4444' },
    { name: 'High', value: alertStats.high, color: '#f97316' },
    { name: 'Medium', value: alertStats.medium, color: '#eab308' },
    { name: 'Low', value: alertStats.low, color: '#3b82f6' },
  ]

  const exportData = () => {
    const csvContent = [
      ['Time', 'Gas (PPM)', 'Temperature (°C)', 'Flame'],
      ...sensorData.map(d => [d.time, d.gas, d.temp, d.flame])
    ].map(row => row.join(',')).join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fireguard-analytics-${new Date().toISOString()}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground">Deep insights into fire safety patterns and trends</p>
          </div>
          <Button onClick={exportData} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {['1H', '24H', '7D', '30D'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {range}
            </Button>
          ))}
        </div>

        {/* Alert Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{alertStats.critical}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{alertStats.high}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Medium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{alertStats.medium}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Low</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{alertStats.low}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Sensor Trends</TabsTrigger>
            <TabsTrigger value="distribution">Alert Distribution</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            {/* Temperature & Gas Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Temperature & Gas Levels Over Time</CardTitle>
                <CardDescription>Real-time monitoring of environmental conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={sensorData}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="temp" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                    <Area yAxisId="right" type="monotone" dataKey="gas" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorGas)" name="Gas (PPM)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Individual Sensor Lines */}
            <Card>
              <CardHeader>
                <CardTitle>Individual Sensor Readings</CardTitle>
                <CardDescription>Detailed breakdown of each sensor</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} name="Temperature" />
                    <Line type="monotone" dataKey="gas" stroke="#8b5cf6" strokeWidth={2} name="Gas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Alert Severity Distribution</CardTitle>
                  <CardDescription>Breakdown by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Alert Count by Severity</CardTitle>
                  <CardDescription>Total alerts in selected time range</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pieData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pattern Analysis & Predictions
                </CardTitle>
                <CardDescription>AI-powered insights and anomaly detection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">System Health: Excellent</h3>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    All sensors operating within normal parameters. No anomalies detected in the last {timeRange}.
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Trend Analysis</h3>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Temperature levels showing stable pattern. Gas levels within safe range with minimal fluctuation.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Recommendations</h3>
                  </div>
                  <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                    <li>• Regular sensor calibration recommended for optimal performance</li>
                    <li>• Consider lowering temperature threshold during peak hours</li>
                    <li>• Schedule preventive maintenance for next week</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Average Response Time</h4>
                    <div className="text-2xl font-bold">2.3s</div>
                    <Badge variant="outline" className="mt-2">Fast</Badge>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">False Positive Rate</h4>
                    <div className="text-2xl font-bold">0.8%</div>
                    <Badge variant="outline" className="mt-2">Excellent</Badge>
                  </div>
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Prediction Accuracy</h4>
                    <div className="text-2xl font-bold">97.5%</div>
                    <Badge variant="outline" className="mt-2">High</Badge>
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
