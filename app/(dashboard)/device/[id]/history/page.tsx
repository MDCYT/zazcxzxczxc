'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient, Trip } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Clock, Zap } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function TripHistoryPage() {
  const params = useParams()
  const routeDeviceId = params.id as string
  const [resolvedDeviceId, setResolvedDeviceId] = useState(routeDeviceId)
  const { token } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiClient.setToken(token)
    }
  }, [token])

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setIsLoading(true)
        const myDevices = await apiClient.getDevices()
        const fromList = myDevices.find(
          (item) => item.id === routeDeviceId || item.trackerID === routeDeviceId
        )
        const deviceId = fromList?.id ?? routeDeviceId
        setResolvedDeviceId(deviceId)
        const tripsData = await apiClient.getTrips(deviceId)
        setTrips(tripsData)
      } catch (error) {
        console.error('Failed to load trips', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrips()
  }, [routeDeviceId])

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <Link href={`/dashboard/device/${resolvedDeviceId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Device
          </Button>
        </Link>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Trip History</h1>
          <p className="text-muted-foreground">View all recorded trips for this device</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading trips...</p>
      ) : trips.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No trips recorded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Start Time
                    </p>
                    <p className="font-mono text-sm mt-1">
                      {format(new Date(trip.startTime), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      End Time
                    </p>
                    <p className="font-mono text-sm mt-1">
                      {format(new Date(trip.endTime), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Distance
                    </p>
                    <p className="font-semibold text-sm mt-1">{trip.distance.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold text-sm mt-1">
                      {Math.floor(trip.duration / 3600)}h {Math.floor((trip.duration % 3600) / 60)}m
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Avg Speed
                    </p>
                    <p className="font-semibold text-sm mt-1">{trip.averageSpeed.toFixed(1)} km/h</p>
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
