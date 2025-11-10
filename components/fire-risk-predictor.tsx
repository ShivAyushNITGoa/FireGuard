'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, AlertTriangle, Shield, Brain, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type FireRiskPrediction = {
  id: string
  device_id: string
  predicted_at: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  contributing_factors: {
    gas?: number
    temp?: number
    flame?: number
  }
  confidence_score: number
  prediction_window_hours: number
}

export function FireRiskPredictor() {
  const [predictions, setPredictions] = useState<FireRiskPrediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredictions()

    // Subscribe to new predictions
    const predictionChannel = supabase
      .channel('prediction_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fire_risk_predictions',
        },
        (payload) => {
          setPredictions(prev => [payload.new as FireRiskPrediction, ...prev].slice(0, 5))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(predictionChannel)
    }
  }, [])

  const fetchPredictions = async () => {
    const { data } = await supabase
      .from('fire_risk_predictions')
      .select('*')
      .order('predicted_at', { ascending: false })
      .limit(5)

    if (data) {
      setPredictions(data)
    }
    setLoading(false)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      default:
        return 'bg-green-500'
    }
  }

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      case 'high':
        return 'text-orange-600 dark:text-orange-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-green-600 dark:text-green-400'
    }
  }

  const latestPrediction = predictions[0]

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analyzing fire risk...</p>
        </CardContent>
      </Card>
    )
  }

  if (!latestPrediction) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No predictions available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: getRiskColor(latestPrediction.risk_level).replace('bg-', '#') }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Fire Risk Prediction
        </CardTitle>
        <CardDescription>
          Machine learning-powered risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Risk Score */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Current Risk Level</span>
            <Badge variant={latestPrediction.risk_level === 'critical' || latestPrediction.risk_level === 'high' ? 'destructive' : 'secondary'}>
              {latestPrediction.risk_level.toUpperCase()}
            </Badge>
          </div>
          
          <div className="relative">
            <Progress value={latestPrediction.risk_score} className="h-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">
                {latestPrediction.risk_score.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Safe</span>
            <span>Moderate</span>
            <span>High Risk</span>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Prediction Confidence</span>
          </div>
          <span className="text-lg font-bold text-blue-600">
            {latestPrediction.confidence_score.toFixed(1)}%
          </span>
        </div>

        {/* Contributing Factors */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Contributing Factors
          </h4>
          <div className="space-y-2">
            {latestPrediction.contributing_factors.gas !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Gas Level</span>
                <span className="font-medium">{latestPrediction.contributing_factors.gas} PPM</span>
              </div>
            )}
            {latestPrediction.contributing_factors.temp !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Temperature</span>
                <span className="font-medium">{latestPrediction.contributing_factors.temp.toFixed(1)}°C</span>
              </div>
            )}
            {latestPrediction.contributing_factors.flame !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flame Detection</span>
                <span className="font-medium">
                  {latestPrediction.contributing_factors.flame === 0 ? 'Detected' : 'Clear'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Window */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>
            Prediction valid for next {latestPrediction.prediction_window_hours} hour(s)
          </span>
        </div>

        {/* Risk Assessment */}
        <div className={cn(
          "p-4 rounded-lg border-l-4",
          latestPrediction.risk_level === 'critical' && "bg-red-50 dark:bg-red-950 border-red-500",
          latestPrediction.risk_level === 'high' && "bg-orange-50 dark:bg-orange-950 border-orange-500",
          latestPrediction.risk_level === 'medium' && "bg-yellow-50 dark:bg-yellow-950 border-yellow-500",
          latestPrediction.risk_level === 'low' && "bg-green-50 dark:bg-green-950 border-green-500"
        )}>
          <h4 className={cn("font-semibold mb-1", getRiskTextColor(latestPrediction.risk_level))}>
            {latestPrediction.risk_level === 'critical' && '🚨 Critical Risk Detected'}
            {latestPrediction.risk_level === 'high' && '⚠️ High Risk Alert'}
            {latestPrediction.risk_level === 'medium' && '⚡ Moderate Risk'}
            {latestPrediction.risk_level === 'low' && '✅ Low Risk - System Normal'}
          </h4>
          <p className="text-sm">
            {latestPrediction.risk_level === 'critical' && 'Immediate action required. Evacuate and contact emergency services.'}
            {latestPrediction.risk_level === 'high' && 'Elevated fire risk detected. Monitor closely and prepare for evacuation.'}
            {latestPrediction.risk_level === 'medium' && 'Conditions warrant attention. Continue monitoring.'}
            {latestPrediction.risk_level === 'low' && 'All systems operating normally. No immediate concerns.'}
          </p>
        </div>

        {/* Historical Predictions */}
        {predictions.length > 1 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Predictions</h4>
            <div className="space-y-1">
              {predictions.slice(1, 4).map((pred) => (
                <div key={pred.id} className="flex items-center justify-between text-xs p-2 bg-secondary/30 rounded">
                  <span className="text-muted-foreground">
                    {new Date(pred.predicted_at).toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pred.risk_score.toFixed(0)}%</span>
                    <Badge variant="outline" className="text-xs">
                      {pred.risk_level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
