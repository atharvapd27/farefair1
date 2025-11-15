'use client'

import { useEffect, useRef } from 'react'
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

export default function MapComponent({ pickup, destination, route }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const routeLayerRef = useRef(null)

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return

    // Create map instance
    const map = L.map('fare-map', {
      center: [12.9716, 77.5946], // Bangalore default
      zoom: 12,
      zoomControl: true,
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map.setView([latitude, longitude], 13)
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Keep default location if geolocation fails
        }
      )
    }

    // Cleanup
    return () => {
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update pickup marker
  useEffect(() => {
    if (!mapInstanceRef.current || !pickup) return

    const map = mapInstanceRef.current

    // Remove existing pickup marker
    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current)
    }

    // Create custom green icon for pickup
    const pickupIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #10b981;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Add new pickup marker
    const marker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
      .bindPopup(`<b>Pickup</b><br/>${pickup.name}`)
      .addTo(map)

    pickupMarkerRef.current = marker

    // Center map on pickup if no destination
    if (!destination) {
      map.setView([pickup.lat, pickup.lng], 14)
    }
  }, [pickup, destination])

  // Update destination marker
  useEffect(() => {
    if (!mapInstanceRef.current || !destination) return

    const map = mapInstanceRef.current

    // Remove existing destination marker
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current)
    }

    // Create custom red icon for destination
    const destIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Add new destination marker
    const marker = L.marker([destination.lat, destination.lng], { icon: destIcon })
      .bindPopup(`<b>Destination</b><br/>${destination.name}`)
      .addTo(map)

    destMarkerRef.current = marker

    // Fit bounds to show both markers
    if (pickup) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    } else {
      map.setView([destination.lat, destination.lng], 14)
    }
  }, [destination, pickup])

  // Draw route polyline from OSRM
  useEffect(() => {
    if (!mapInstanceRef.current || !route || !route.geometry) return

    const map = mapInstanceRef.current

    // Remove existing route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
    }

    // OSRM returns GeoJSON coordinates in [lng, lat] format, need to flip to [lat, lng]
    const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]])

    // Draw route polyline
    const polyline = L.polyline(coordinates, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.7,
      smoothFactor: 1,
    }).addTo(map)

    routeLayerRef.current = polyline

    // Fit bounds to show entire route
    if (coordinates.length > 0) {
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] })
    }
  }, [route])

  return <div id="fare-map" style={{ height: '100%', width: '100%' }} />
}
