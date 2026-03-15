'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiClient, Device } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatUpdatedAgo } from '@/lib/time'

const LeafletMap = dynamic(() => import('@/components/dashboard/leaflet-map').then(m => ({ default: m.LeafletMap })), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-secondary rounded-lg flex items-center justify-center">Loading map...</div>,
})

export default function MapPage() {
  const { token } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiClient.setToken(token)
    }
  }, [token])

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoading(true)
        const devicesData = await apiClient.getLatestPositions()
        setDevices(devicesData)
      } catch (error) {
        console.error('Failed to load devices for map', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()

    // Refresh positions every 30 seconds
    const interval = setInterval(loadDevices, 30000)
    return () => clearInterval(interval)
  }, [])

  const statusLabel = (status: Device['status']) => (status === 'online' ? 'En linea' : 'Fuera de linea')

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Mapa</h1>
        <p className="text-muted-foreground">Ubicacion en tiempo real de todos tus dispositivos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Cargando mapa...</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <LeafletMap devices={devices} onDeviceClick={setSelectedDevice} />
            </Card>
          )}
        </div>

        {/* Lista de dispositivos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Dispositivos ({devices.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {devices.map((device) => (
              <Card
                key={device.trackerID}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedDevice?.trackerID === device.trackerID
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setSelectedDevice(device)}
              >
                <div className="space-y-1">
                  <p className="font-semibold text-sm line-clamp-1">{device.name}</p>
                  <div className="flex items-center justify-between text-xs gap-2">
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                      {statusLabel(device.status)}
                    </Badge>
                    <span className="font-mono">{device.speed} km/h</span>
                  </div>
                  <p className="text-xs opacity-80">
                    {formatUpdatedAgo(device.timestamp)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Detalle del dispositivo seleccionado */}
      {selectedDevice && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">{selectedDevice.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">ID del tracker</p>
              <p className="font-mono text-sm">{selectedDevice.trackerID}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge variant={selectedDevice.status === 'online' ? 'default' : 'secondary'}>
                {statusLabel(selectedDevice.status)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Velocidad</p>
              <p className="font-semibold">{selectedDevice.speed} km/h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Coordenadas</p>
              <p className="font-mono text-xs">
                {selectedDevice.latitude !== undefined && selectedDevice.longitude !== undefined
                  ? `${selectedDevice.latitude.toFixed(4)}, ${selectedDevice.longitude.toFixed(4)}`
                  : 'Sin ubicacion'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
