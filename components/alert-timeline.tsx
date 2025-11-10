'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, cn } from '@/lib/utils'
import { AlertTriangle, Clock, Check } from 'lucide-react'

type Alert = {
  id: string
  time: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  acknowledged: boolean
}

export function AlertTimeline() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()

    // Subscribe to alert changes (INSERT and DELETE)
    const channel = supabase
      .channel('timeline_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          fetchAlerts() // Refresh when new alert added
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const deletedId = (payload.old as any).id
          setAlerts((prev) => prev.filter(a => a.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('id, time, message, severity, acknowledged')
      .order('time', { ascending: false })
      .limit(10)

    if (data && !error) {
      setAlerts(data)
    }
    setLoading(false)
  }

  // Removed delete and acknowledge functions - these are now only in notification dropdown

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading timeline...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Alert Timeline
        </CardTitle>
        <CardDescription>Recent fire safety events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {/* Timeline items */}
          <div className="space-y-6">
            {alerts.map((alert) => (
              <div key={alert.id} className="relative flex gap-4 items-start">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center",
                  getSeverityColor(alert.severity)
                )}>
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    {alert.acknowledged && (
                      <Badge variant="outline" className="gap-1">
                        <Check className="h-3 w-3" />
                        Acknowledged
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(alert.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
