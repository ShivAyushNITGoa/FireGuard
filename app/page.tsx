'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Navigation } from '@/components/navigation'
import { Flame, Shield, Bell, BarChart3, Settings, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Flame className="h-24 w-24 text-orange-500 animate-pulse" />
              <Shield className="h-12 w-12 text-blue-500 absolute -bottom-2 -right-2" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            FireGuard
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Fire Safety & Evacuation Alert System
          </p>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Real-time monitoring, intelligent alerts, and comprehensive analytics 
            to keep your environment safe from fire hazards.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" className="text-lg px-8">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="p-6 rounded-lg border bg-card">
              <Shield className="h-12 w-12 text-blue-500 mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                24/7 sensor monitoring with instant updates every 2 seconds
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Bell className="h-12 w-12 text-orange-500 mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Smart Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Email notifications with configurable thresholds and cooldown
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <BarChart3 className="h-12 w-12 text-green-500 mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive data visualization and historical trends
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Settings className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Configurable</h3>
              <p className="text-sm text-muted-foreground">
                Customize thresholds, alerts, and system settings
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-muted-foreground">
          <p>Built with ❤️ by TheGDevelopers</p>
          <p className="text-sm mt-2">FireGuard v2.0 - Fire Safety Monitoring System</p>
        </div>
      </footer>
    </div>
  )
}
