'use client'

import { useEffect, useState } from 'react'
import { apiClient, Device } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { DeviceCard } from '@/components/dashboard/device-card'

export default function DevicesPage() {
  const { token } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
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
      } catch (error) {
        console.error('Failed to load devices', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Dispositivos</h1>
        <p className="text-muted-foreground">Gestiona y monitorea todos tus dispositivos GPS</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando dispositivos...</p>
      ) : devices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Aun no tienes dispositivos registrados</p>
          <p className="text-sm text-muted-foreground">
            Registra un nuevo dispositivo con el ID de tracker para empezar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  )
}
