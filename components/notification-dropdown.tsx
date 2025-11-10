'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, AlertTriangle, CheckCircle2, X, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Alert = {
  id: string
  time: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  acknowledged: boolean
}

export function NotificationDropdown() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchRecentAlerts()

    // Subscribe to alert changes (INSERT and DELETE)
    const channel = supabase
      .channel('notification_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev].slice(0, 10))
          setUnreadCount((prev) => prev + 1)
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
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRecentAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('id, time, message, severity, acknowledged')
      .order('time', { ascending: false })
      .limit(10) as { data: Alert[] | null; error: any }

    if (data && !error) {
      setAlerts(data)
      setUnreadCount(data.filter(a => !a.acknowledged).length)
    }
  }

  const markAllAsRead = async () => {
    const unacknowledgedIds = alerts.filter(a => !a.acknowledged).map(a => a.id)
    
    if (unacknowledgedIds.length === 0) return

    await supabase
      .from('alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() } as any)
      .in('id', unacknowledgedIds)

    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
    setUnreadCount(0)
  }

  const deleteAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent dropdown from closing
    
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)

    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const deleteAllAlerts = async () => {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (!error) {
      setAlerts([])
      setUnreadCount(0)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'medium':
        return 'text-yellow-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 text-xs"
              >
                Mark all read
              </Button>
            )}
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAllAlerts}
                className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            No alerts. System is secure.
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {alerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !alert.acknowledged ? 'bg-accent/50' : ''
                }`}
              >
                <div className="flex items-start space-x-2 w-full">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(alert.time)}
                      </p>
                      <Badge
                        variant={
                          alert.severity === 'critical' || alert.severity === 'high'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteAlert(alert.id, e)}
                    className="h-6 w-6 p-0 hover:bg-red-50"
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
