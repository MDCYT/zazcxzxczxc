'use client'

import { useEffect, useState } from 'react'
import { apiClient, Device, Event } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { DeviceCard } from '@/components/dashboard/device-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Activity } from 'lucide-react'
import { formatAgo } from '@/lib/time'

export default function DashboardPage() {
  const { token } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiClient.setToken(token)
    }
  }, [token])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [devicesBase, devicesMap] = await Promise.all([
          apiClient.getDevices(),
          apiClient.getLatestPositions().catch(() => []),
        ])

        const byId = new Map(devicesMap.map((item) => [item.id, item]))
        const byTracker = new Map(devicesMap.map((item) => [item.trackerID, item]))

        const devicesData = devicesBase.map((item) => {
          const latest = byId.get(item.id) ?? byTracker.get(item.trackerID)
          return latest
            ? {
                ...item,
                latitude: latest.latitude,
                longitude: latest.longitude,
                speed: latest.speed,
                status: latest.status,
                timestamp: latest.timestamp,
              }
            : item
        })

        setDevices(devicesData)

        // Load latest events from all devices
        if (devicesData.length > 0) {
          const allEvents: Event[] = []
          for (const device of devicesData.slice(0, 3)) {
            try {
              const deviceEvents = await apiClient.getEvents(device.id)
              allEvents.push(...deviceEvents.slice(0, 2))
            } catch {
              // Skip errors for individual device events
            }
          }
          setEvents(allEvents.slice(0, 5))
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const onlineCount = devices.filter((d) => d.status === 'online').length
  const offlineCount = devices.filter((d) => d.status === 'offline').length

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Resumen</h1>
        <p className="text-muted-foreground">Vista general en tiempo real de tus dispositivos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{devices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En linea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fuera de linea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{offlineCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Devices Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tus dispositivos</h2>
          {devices.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">Aun no tienes dispositivos registrados</p>
          )}
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando dispositivos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Eventos recientes</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                    <Activity className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-balance">{event.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatAgo(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
