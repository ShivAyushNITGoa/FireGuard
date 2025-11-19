'use client'

import Link from 'next/link'
import { Flame, Github, Mail, Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-lg font-bold">FireGuard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Advanced fire safety monitoring and alert system for real-time protection.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-muted-foreground hover:text-primary transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/devices" className="text-muted-foreground hover:text-primary transition-colors">
                  Devices
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-muted-foreground hover:text-primary transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://github.com/ShivAyushNITGoa/FireGuard" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/ShivAyushNITGoa/FireGuard" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="https://github.com/ShivAyushNITGoa/FireGuard" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="https://github.com/ShivAyushNITGoa/FireGuard" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:thegdevelopers@gmail.com" className="hover:text-primary transition-colors">
                  thegdevelopers@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Github className="h-4 w-4" />
                <a href="https://github.com/ShivAyushNITGoa/FireGuard" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} FireGuard. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by{' '}
              <span className="font-semibold text-primary">TheGDevelopers</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
