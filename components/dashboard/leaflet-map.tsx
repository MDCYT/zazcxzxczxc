'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Device } from '@/lib/api'

interface LeafletMapProps {
  devices: Device[]
  onDeviceClick?: (device: Device) => void
}

export function LeafletMap({ devices, onDeviceClick }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.LayerGroup>>(new Map())
  const devicesWithLocation = devices.filter(
    (device) => device.latitude !== undefined && device.longitude !== undefined
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map
    const map = L.map(containerRef.current).setView([20, 0], 2)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    // Redraw all markers to avoid stale layer issues in some browsers.
    markersRef.current.forEach((layer) => mapRef.current?.removeLayer(layer))
    markersRef.current.clear()

    devicesWithLocation.forEach((device) => {
      const markerColor = device.status === 'online' ? '#22c55e' : '#6b7280'

      const centerDot = L.circleMarker([device.latitude, device.longitude], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: markerColor,
        fillOpacity: 1,
      })

      const pulseRing = L.circleMarker([device.latitude, device.longitude], {
        radius: 14,
        color: markerColor,
        weight: 2,
        fillOpacity: 0,
        opacity: 0.6,
      })

      const pin = L.marker([device.latitude, device.longitude], {
        icon: L.divIcon({
          className: '',
          html: '<div style="font-size: 20px; line-height: 20px; transform: translate(-2px, -18px);">📍</div>',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        }),
        zIndexOffset: 1000,
      })

      const group = L.layerGroup([pulseRing, centerDot, pin]).addTo(mapRef.current!)

      const popupContent = `
          <div class="p-2">
            <p class="font-bold text-sm">${device.name}</p>
            <p class="text-xs text-gray-600">${device.trackerID}</p>
            <p class="text-xs mt-1">
              <span class="font-semibold">${device.speed}</span> km/h
            </p>
            <p class="text-xs text-gray-600">
              ${device.status === 'online' ? 'En linea' : 'Fuera de linea'}
            </p>
          </div>
        `

      centerDot.bindPopup(popupContent)
      pulseRing.bindPopup(popupContent)
      pin.bindPopup(popupContent)
      centerDot.on('click', () => onDeviceClick?.(device))
      pulseRing.on('click', () => onDeviceClick?.(device))
      pin.on('click', () => onDeviceClick?.(device))

      markersRef.current.set(device.trackerID, group)
    })

    // Fit bounds if devices exist
    if (devicesWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        devicesWithLocation.map((d) => [d.latitude!, d.longitude!])
      )
      mapRef.current?.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [devicesWithLocation, onDeviceClick])

  return <div ref={containerRef} className="w-full h-full rounded-lg" style={{ minHeight: '500px' }} />
}
