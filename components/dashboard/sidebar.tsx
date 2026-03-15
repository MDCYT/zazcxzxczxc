'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { MapPin, ListChecks, LogOut, BarChart3 } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  const navItems = [
    { href: '/dashboard', label: 'Resumen', icon: BarChart3 },
    { href: '/dashboard/map', label: 'Mapa', icon: MapPin },
    { href: '/dashboard/devices', label: 'Dispositivos', icon: ListChecks },
  ]

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">GPS Tracking</h2>
        <p className="text-xs text-muted-foreground mt-1">Gestion de dispositivos</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <button className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </button>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="px-2 py-2 rounded-md bg-secondary">
          <p className="text-xs font-medium text-muted-foreground">Sesion iniciada como</p>
          <p className="text-sm font-semibold text-foreground truncate">{user?.username}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesion
        </Button>
      </div>
    </aside>
  )
}
