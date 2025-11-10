'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SensorGaugeProps {
  title: string
  value: number | null | undefined
  maxValue: number
  unit: string
  icon: LucideIcon
  thresholdWarning: number
  thresholdDanger: number
  iconColor?: string
}

export function SensorGauge({
  title,
  value,
  maxValue,
  unit,
  icon: Icon,
  thresholdWarning,
  thresholdDanger,
  iconColor = "text-blue-500"
}: SensorGaugeProps) {
  // Check if value is null or undefined
  const isDataAvailable = value !== null && value !== undefined && !isNaN(value)
  const safeValue = isDataAvailable ? value : 0
  
  const percentage = Math.min((safeValue / maxValue) * 100, 100)
  
  const getColor = () => {
    if (!isDataAvailable) return 'bg-gray-400'
    if (safeValue >= thresholdDanger) return 'bg-red-500'
    if (safeValue >= thresholdWarning) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatus = () => {
    if (!isDataAvailable) return 'N/A'
    if (safeValue >= thresholdDanger) return 'DANGER'
    if (safeValue >= thresholdWarning) return 'WARNING'
    return 'NORMAL'
  }

  const getStatusColor = () => {
    if (!isDataAvailable) return 'text-gray-500 dark:text-gray-400'
    if (safeValue >= thresholdDanger) return 'text-red-600 dark:text-red-400'
    if (safeValue >= thresholdWarning) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconColor)} />
            {title}
          </span>
          <span className={cn("text-xs font-bold", getStatusColor())}>
            {getStatus()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Value Display */}
        <div className="text-center">
          {isDataAvailable ? (
            <>
              <div className="text-4xl font-bold">{safeValue.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">{unit}</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-bold text-gray-400">N/A</div>
              <div className="text-xs text-muted-foreground">Sensor Unavailable</div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              getColor(),
              !isDataAvailable && "opacity-50"
            )}
            style={{ width: isDataAvailable ? `${percentage}%` : '0%' }}
          />
        </div>

        {/* Threshold Indicators */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span className="text-yellow-600">⚠ {thresholdWarning}</span>
          <span className="text-red-600">🚨 {thresholdDanger}</span>
          <span>{maxValue}</span>
        </div>
      </CardContent>
    </Card>
  )
}
