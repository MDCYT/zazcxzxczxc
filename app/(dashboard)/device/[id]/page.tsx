'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient, Device } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { EngineControls } from '@/components/dashboard/engine-controls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, MapPin, Battery, Pencil } from 'lucide-react'
import { formatUpdatedAgo } from '@/lib/time'

export default function DeviceDetailPage() {
  const params = useParams()
  const routeDeviceId = params.id as string
  const { token } = useAuth()
  const [device, setDevice] = useState<Device | null>(null)
  const [resolvedDeviceId, setResolvedDeviceId] = useState(routeDeviceId)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editVehicleName, setEditVehicleName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (token) {
      apiClient.setToken(token)
    }
  }, [token])

  useEffect(() => {
    const loadDevice = async () => {
      try {
        setIsLoading(true)
        const myDevices = await apiClient.getDevices()
        const fromList = myDevices.find(
          (item) => item.id === routeDeviceId || item.trackerID === routeDeviceId
        )
        const deviceId = fromList?.id ?? routeDeviceId
        setResolvedDeviceId(deviceId)

        const [statusData, latestData] = await Promise.all([
          apiClient.getDeviceStatus(deviceId),
          apiClient.getLatestByDeviceId(deviceId).catch(() => null),
        ])

        const merged = {
          ...statusData,
          name: fromList?.name ?? statusData.name,
          vehicleName: fromList?.vehicleName ?? statusData.vehicleName,
          trackerID: fromList?.trackerID ?? statusData.trackerID,
          owner: fromList?.owner ?? statusData.owner,
          latitude: latestData?.latitude ?? statusData.latitude,
          longitude: latestData?.longitude ?? statusData.longitude,
          speed: latestData?.speed ?? statusData.speed,
          timestamp: latestData?.timestamp ?? statusData.timestamp,
        }

        setDevice(merged)
        setEditName(merged.name)
        setEditVehicleName(merged.vehicleName ?? '')
      } catch (error) {
        console.error('Failed to load device', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevice()
  }, [routeDeviceId])

  const handleSaveProfile = async () => {
    if (!device) return

    const trimmedName = editName.trim()
    const trimmedVehicleName = editVehicleName.trim()

    if (!trimmedName && !trimmedVehicleName) {
      setSaveError('Debes ingresar al menos un campo para guardar')
      return
    }

    try {
      setIsSaving(true)
      setSaveError('')

      const updated = await apiClient.updateDeviceProfile(resolvedDeviceId, {
        name: trimmedName || undefined,
        vehicleName: trimmedVehicleName || undefined,
      })

      setDevice((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name || prev.name,
              vehicleName: updated.vehicleName ?? prev.vehicleName,
            }
          : prev
      )
      setIsEditOpen(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo actualizar el dispositivo')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando detalle del dispositivo...</p>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/dashboard/devices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a dispositivos
          </Button>
        </Link>
        <p className="text-muted-foreground">Dispositivo no encontrado</p>
      </div>
    )
  }

  const isOnline = device.status === 'online'

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Link href="/dashboard/devices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a dispositivos
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">{device.name}</h1>
            <Badge variant={isOnline ? 'default' : 'secondary'} className="text-base px-3 py-1">
              {isOnline ? 'En linea' : 'Fuera de linea'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSaveError('')
                setEditName(device.name)
                setEditVehicleName(device.vehicleName ?? '')
                setIsEditOpen(true)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar nombre
            </Button>
          </div>
          {device.vehicleName && (
            <p className="text-sm text-muted-foreground">Vehiculo: {device.vehicleName}</p>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar dispositivo</DialogTitle>
            <DialogDescription>
              Actualiza el nombre visible del dispositivo y/o el nombre del vehiculo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Nombre del dispositivo</Label>
              <Input
                id="device-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ej: Tracker principal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-name">Nombre del vehiculo</Label>
              <Input
                id="vehicle-name"
                value={editVehicleName}
                onChange={(e) => setEditVehicleName(e.target.value)}
                placeholder="Ej: Mi Auto"
              />
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tracker ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-lg">{device.trackerID}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Propietario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{device.owner}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Velocidad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{device.speed} km/h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ultima actualizacion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatUpdatedAgo(device.timestamp)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Location Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicacion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {device.latitude !== undefined && device.longitude !== undefined ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Latitud</p>
                <p className="font-mono">{device.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longitud</p>
                <p className="font-mono">{device.longitude.toFixed(6)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin ubicacion disponible</p>
          )}
        </CardContent>
      </Card>

      {/* Battery Info */}
      {device.battery !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Battery className="h-5 w-5" />
              Bateria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-4">
                <div
                  className="bg-primary h-4 rounded-full transition-all"
                  style={{ width: `${device.battery}%` }}
                />
              </div>
              <p className="text-2xl font-bold">{device.battery}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="controls" className="w-full">
        <TabsList>
          <TabsTrigger value="controls">Control de motor</TabsTrigger>
          <TabsTrigger value="trips" asChild>
            <Link href={`/dashboard/device/${resolvedDeviceId}/history`}>Historial</Link>
          </TabsTrigger>
          <TabsTrigger value="events" asChild>
            <Link href={`/dashboard/device/${resolvedDeviceId}/events`}>Eventos</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <EngineControls deviceId={resolvedDeviceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
