'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient, Event } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, AlertCircle, MapPin } from 'lucide-react'
import { formatAgo, formatDateTime, getSafeDate } from '@/lib/time'

export default function EventsPage() {
  const params = useParams()
  const routeDeviceId = params.id as string
  const [resolvedDeviceId, setResolvedDeviceId] = useState(routeDeviceId)
  const { token } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiClient.setToken(token)
    }
  }, [token])

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true)
        const myDevices = await apiClient.getDevices()
        const fromList = myDevices.find(
          (item) => item.id === routeDeviceId || item.trackerID === routeDeviceId
        )
        const deviceId = fromList?.id ?? routeDeviceId
        setResolvedDeviceId(deviceId)
        const eventsData = await apiClient.getEvents(deviceId)
        const sorted = [...eventsData].sort((a, b) => {
          const aTime = getSafeDate(a.timestamp)?.getTime() ?? 0
          const bTime = getSafeDate(b.timestamp)?.getTime() ?? 0
          return bTime - aTime
        })
        setEvents(sorted)
      } catch (error) {
        console.error('Failed to load events', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [routeDeviceId])

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType.toLowerCase().includes('overspeed')) return 'destructive'
    if (eventType.toLowerCase().includes('harsh')) return 'destructive'
    if (eventType.toLowerCase().includes('offline')) return 'secondary'
    return 'default'
  }

  const getEventLabel = (eventType: string) => {
    const normalized = eventType.toLowerCase()
    if (normalized === 'ignition_on') return 'Encendido activado'
    if (normalized === 'ignition_off') return 'Encendido apagado'
    if (normalized === 'battery_connected') return 'Bateria conectada'
    if (normalized === 'battery_disconnected') return 'Bateria desconectada'
    return eventType.replaceAll('_', ' ')
  }

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <Link href={`/dashboard/device/${resolvedDeviceId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dispositivo
          </Button>
        </Link>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Eventos y alertas</h1>
          <p className="text-muted-foreground">Historial de eventos registrados para este dispositivo</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando eventos...</p>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No hay eventos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className={`hover:shadow-md transition-shadow border-l-4 ${
                event.type.toLowerCase().includes('overspeed') ||
                event.type.toLowerCase().includes('harsh')
                  ? 'border-l-destructive'
                  : 'border-l-primary'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <AlertCircle
                      className={`h-5 w-5 ${
                        event.type.toLowerCase().includes('overspeed') ||
                        event.type.toLowerCase().includes('harsh')
                          ? 'text-destructive'
                          : 'text-primary'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-balance">{getEventLabel(event.type)}</h3>
                      <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                        Alerta
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="flex flex-col sm:flex-row gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-semibold">Hora:</span>{' '}
                        {formatDateTime(event.timestamp)}
                      </div>
                      {event.latitude !== undefined && event.longitude !== undefined && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="font-mono">
                            {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                      <div className="ml-auto">
                        {formatAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
