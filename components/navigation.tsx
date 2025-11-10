'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Flame, LayoutDashboard, Settings, BarChart3, Cpu, Home, LogOut, User } from 'lucide-react'
import { NotificationDropdown } from '@/components/notification-dropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

const routes = [
  {
    label: 'Home',
    icon: Home,
    href: '/',
  },
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
  },
  {
    label: 'Devices',
    icon: Cpu,
    href: '/devices',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold">FireGuard</h1>
                <p className="text-xs text-muted-foreground">By TheGDevelopers</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === route.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <NotificationDropdown />
            
            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
