'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Clock, TrendingDown, User, History, Star } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Dynamic import for map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })

export default function FareFare() {
  const [pickupLocation, setPickupLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [pickupCoords, setPickupCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
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

  const handleGeocode = async (address, type) => {
    // Mock geocoding - in real app would use Nominatim or Google Maps
    const mockLocations = {
      'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bangalore, India' },
      'koramangala': { lat: 12.9352, lng: 77.6245, name: 'Koramangala, Bangalore' },
      'whitefield': { lat: 12.9698, lng: 77.7500, name: 'Whitefield, Bangalore' },
      'indiranagar': { lat: 12.9716, lng: 77.6412, name: 'Indiranagar, Bangalore' },
      'mg road': { lat: 12.9716, lng: 77.6147, name: 'MG Road, Bangalore' },
      'airport': { lat: 13.1986, lng: 77.7066, name: 'Kempegowda International Airport' },
      'electronic city': { lat: 12.8456, lng: 77.6603, name: 'Electronic City, Bangalore' },
    }

    const searchKey = address.toLowerCase()
    let coords = null

    for (let key in mockLocations) {
      if (searchKey.includes(key)) {
        coords = mockLocations[key]
        break
      }
    }

    // If no match, generate random coords around Bangalore
    if (!coords) {
      coords = {
        lat: 12.9716 + (Math.random() - 0.5) * 0.2,
        lng: 77.5946 + (Math.random() - 0.5) * 0.2,
        name: address
      }
    }

    if (type === 'pickup') {
      setPickupCoords(coords)
    } else {
      setDestCoords(coords)
    }

    return coords
  }

  const handleCompareFares = async () => {
    if (!pickupLocation || !destination) {
      alert('Please enter both pickup and destination locations')
      return
    }

    setLoading(true)

    try {
      // Geocode locations
      const pickup = await handleGeocode(pickupLocation, 'pickup')
      const dest = await handleGeocode(destination, 'destination')

      // Calculate fares
      const response = await fetch('/api/fares/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: pickup,
          destination: dest,
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
    // Mock login - redirect to login page
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
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span className="font-medium">{search.start_location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="w-4 h-4 text-red-600" />
                                <span className="font-medium">{search.destination}</span>
                              </div>
                              <div className="flex gap-4 text-xs text-gray-600 mt-3">
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
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">{fav.route_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-3 h-3" />
                                <span>{fav.start}</span>
                                <span>→</span>
                                <Navigation className="w-3 h-3" />
                                <span>{fav.end}</span>
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
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowProfile(true)}>
                  <User className="w-4 h-4 mr-2" />
                  {user.name}
                </Button>
              </>
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
          />
        </div>

        {/* Search Card - Floating on top */}
        <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <Input
                    placeholder="Enter pickup location"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <Input
                    placeholder="Enter destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white"
                onClick={handleCompareFares}
                disabled={loading}
              >
                {loading ? 'Comparing...' : 'Compare Fares'}
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
                * Prices are estimated and may vary based on traffic and demand
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
