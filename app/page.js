'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, TrendingDown, User, Star, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LocationAutocomplete from '@/components/LocationAutocomplete'

// Dynamic import for map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })

export default function FareFare() {
  const [pickupLocation, setPickupLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [pickupCoords, setPickupCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [route, setRoute] = useState(null)
  const [fareResults, setFareResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [favourites, setFavourites] = useState([])

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('farefare_user')
    if (userData) {
      setUser(JSON.parse(userData))
      loadUserData(JSON.parse(userData).id)
    }
  }, [])

  const loadUserData = async (userId) => {
    try {
      const response = await fetch(`/api/user/${userId}`)
      const data = await response.json()
      if (data.success) {
        setSearchHistory(data.history || [])
        setFavourites(data.favourites || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  // Handle pickup location selection from autocomplete
  const handlePickupSelect = (location) => {
    setPickupCoords(location)
    // If destination exists, fetch route
    if (destCoords) {
      fetchRoute(location, destCoords)
    }
  }

  // Handle destination selection from autocomplete
  const handleDestinationSelect = (location) => {
    setDestCoords(location)
    // If pickup exists, fetch route
    if (pickupCoords) {
      fetchRoute(pickupCoords, location)
    }
  }

  // Fetch real route from OSRM
  const fetchRoute = async (pickup, dest) => {
    try {
      // OSRM API - Free routing service
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        setRoute(data.routes[0])
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }

  // Compare fares using real distance and time from OSRM
  const handleCompareFares = async () => {
    if (!pickupCoords || !destCoords) {
      alert('Please select both pickup and destination locations')
      return
    }

    if (!route) {
      alert('Route not calculated yet. Please wait a moment.')
      return
    }

    setLoading(true)

    try {
      // Get real distance and time from OSRM route
      const distanceKm = route.distance / 1000 // Convert meters to km
      const durationMin = Math.round(route.duration / 60) // Convert seconds to minutes

      // Call backend with REAL distance and time
      const response = await fetch('/api/fares/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: pickupCoords,
          destination: destCoords,
          distance: distanceKm,
          duration: durationMin,
          userId: user?.id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setFareResults(data)
        if (user) {
          loadUserData(user.id)
        }
      }
    } catch (error) {
      console.error('Error comparing fares:', error)
      alert('Error comparing fares. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = '/login'
  }

  const handleLogout = () => {
    localStorage.removeItem('farefare_user')
    setUser(null)
    setSearchHistory([])
    setFavourites([])
  }

  const saveAsFavourite = async () => {
    if (!user || !pickupLocation || !destination) return

    try {
      const response = await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          routeName: `${pickupLocation} to ${destination}`,
          start: pickupLocation,
          end: destination
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Route saved to favourites!')
        loadUserData(user.id)
      }
    } catch (error) {
      console.error('Error saving favourite:', error)
    }
  }

  const loadFavourite = (fav) => {
    setPickupLocation(fav.start)
    setDestination(fav.end)
    setShowProfile(false)
  }

  if (showProfile && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setShowProfile(false)}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold">FareFare</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="history">Search History</TabsTrigger>
                  <TabsTrigger value="favourites">Favourites</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history" className="space-y-4 mt-4">
                  {searchHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No search history yet</p>
                  ) : (
                    searchHistory.map((search, idx) => (
                      <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="font-medium text-sm">
                                {search.start_location} → {search.destination}
                              </div>
                              <div className="flex gap-4 text-xs text-gray-600">
                                <span>Ola: ₹{search.ola_price}</span>
                                <span>Uber: ₹{search.uber_price}</span>
                                <span>Rapido: ₹{search.rapido_price}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(search.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="favourites" className="space-y-4 mt-4">
                  {favourites.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No favourite routes yet</p>
                  ) : (
                    favourites.map((fav, idx) => (
                      <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadFavourite(fav)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">{fav.route_name}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">Use Route</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">FareFare</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => setShowProfile(true)}>
                <User className="w-4 h-4 mr-2" />
                {user.name}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLogin}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map */}
        <div className="absolute inset-0">
          <MapComponent 
            pickup={pickupCoords} 
            destination={destCoords}
            route={route}
          />
        </div>

        {/* Search Card - Floating on top */}
        <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-4 space-y-3">
              <LocationAutocomplete
                value={pickupLocation}
                onChange={setPickupLocation}
                onSelect={handlePickupSelect}
                placeholder="Enter pickup location"
                icon="pickup"
              />
              
              <LocationAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={handleDestinationSelect}
                placeholder="Enter destination"
                icon="destination"
              />
              
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white"
                onClick={handleCompareFares}
                disabled={loading || !pickupCoords || !destCoords || !route}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  'Compare Fares'
                )}
              </Button>
              
              {pickupLocation && destination && fareResults && (
                <Button 
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={saveAsFavourite}
                  disabled={!user}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {user ? 'Save as Favourite' : 'Login to Save'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results - Bottom Sheet */}
        {fareResults && (
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl max-h-[50vh] overflow-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Fare Comparison</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{fareResults.distance.toFixed(1)} km • {fareResults.duration} min</span>
                </div>
              </div>

              <div className="space-y-3">
                {fareResults.fares.map((fare, idx) => (
                  <Card 
                    key={idx} 
                    className={`${
                      fare.cheapest 
                        ? 'border-2 border-green-500 bg-green-50' 
                        : 'border-gray-200'
                    } hover:shadow-md transition-all cursor-pointer`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            fare.service === 'Ola' ? 'bg-yellow-500' :
                            fare.service === 'Uber' ? 'bg-black' :
                            'bg-blue-500'
                          }`}>
                            {fare.service.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-lg">{fare.service}</p>
                            <p className="text-xs text-gray-600">{fare.vehicleType}</p>
                            <p className="text-xs text-gray-500 mt-1">ETA: {fare.eta} min</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">₹{fare.price}</p>
                          {fare.cheapest && (
                            <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-1">
                              <TrendingDown className="w-3 h-3" />
                              Best Price
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-xs text-gray-500 text-center">
                * Prices are estimated based on real distance and may vary
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
