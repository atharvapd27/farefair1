'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

export default function MapComponent({ pickup, destination }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize map
    const map = L.map('fare-map', {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    })

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Custom icons
    const pickupIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzEwYjk4MSIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjYiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const destIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iI2VmNDQ0NCIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjYiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    let pickupMarker = null
    let destMarker = null
    let routeLine = null

    // Add markers if locations exist
    if (pickup) {
      pickupMarker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .bindPopup(pickup.name || 'Pickup Location')
        .addTo(map)
    }

    if (destination) {
      destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon })
        .bindPopup(destination.name || 'Destination')
        .addTo(map)
    }

    // Draw route line
    if (pickup && destination) {
      routeLine = L.polyline(
        [[pickup.lat, pickup.lng], [destination.lat, destination.lng]],
        { color: '#1a73e8', weight: 4, opacity: 0.7 }
      ).addTo(map)

      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 13)
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 13)
    }

    // Cleanup
    return () => {
      if (pickupMarker) map.removeLayer(pickupMarker)
      if (destMarker) map.removeLayer(destMarker)
      if (routeLine) map.removeLayer(routeLine)
      map.remove()
    }
  }, [pickup, destination])

  return <div id="fare-map" style={{ height: '100%', width: '100%' }} />
}
