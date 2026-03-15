'use client'

import Link from 'next/link'
import { Device } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Zap, Battery } from 'lucide-react'
import { formatUpdatedAgo } from '@/lib/time'

export function DeviceCard({ device }: { device: Device }) {
  const isOnline = device.status === 'online'
  const hasCoordinates = device.latitude !== undefined && device.longitude !== undefined

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{device.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{device.trackerID}</p>
          </div>
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? 'En linea' : 'Fuera de linea'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Ubicacion</p>
              <p className="font-mono text-xs">
                {hasCoordinates
                  ? `${device.latitude.toFixed(4)}, ${device.longitude.toFixed(4)}`
                  : 'Sin ubicacion'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Velocidad</p>
              <p className="font-semibold">{device.speed} km/h</p>
            </div>
          </div>
        </div>

        {device.battery !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Battery className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Bateria</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-1">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${device.battery}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium">{device.battery}%</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {formatUpdatedAgo(device.timestamp)}
        </p>

        <Link href={`/dashboard/device/${device.id}`}>
          <Button size="sm" className="w-full" variant="outline">
            Ver detalle
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
