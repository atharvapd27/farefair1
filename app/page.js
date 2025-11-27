'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
// Added IndianRupee
import { Clock, TrendingDown, User, Star, Loader2, IndianRupee, MapPin, Check } from 'lucide-react' 
import LocationAutocomplete from '@/components/LocationAutocomplete'
import OverlayMenu from '@/components/OverlayMenu'
import MockPaymentDialog from '@/components/MockPaymentDialog'
import DraggableLiveFab from '@/components/DraggableLiveFab'

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })

export default function FareFair() {
  const [pickupLocation, setPickupLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [pickupCoords, setPickupCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [route, setRoute] = useState(null)
  const [fareResults, setFareResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [searchHistory, setSearchHistory] = useState([])
  const [favourites, setFavourites] = useState([])
  const [isSaved, setIsSaved] = useState(false)
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedFare, setSelectedFare] = useState(null)

  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('farefare_user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      loadUserData(parsedUser.id)
    }
  }, [])

  useEffect(() => {
    setIsSaved(false)
  }, [pickupLocation, destination])

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

  const activeRide = searchHistory.find(r => r.status === 'ongoing')

  const handlePickupSelect = (location) => {
    setPickupCoords(location)
    if (destCoords) fetchRoute(location, destCoords)
  }

  const handleDestinationSelect = (location) => {
    setDestCoords(location)
    if (pickupCoords) fetchRoute(pickupCoords, location)
  }

  const fetchRoute = async (pickup, dest) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        setRoute(data.routes[0])
      }
    } catch (error) {
      console.error('Error fetching route:', error)
      setRoute(null)
    }
  }

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
      const distanceKm = route.distance / 1000 
      const durationMin = Math.round(route.duration / 60) 

      const response = await fetch('/api/fares/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { ...pickupCoords, name: pickupLocation },
          destination: { ...destCoords, name: destination },
          distance: distanceKm,
          duration: durationMin,
          userId: user?.id
        })
      })
      const data = await response.json()
      if (data.success) {
        setFareResults(data)
        if (user) loadUserData(user.id)
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

  // UPDATED: Now saves coordinates too
  const saveAsFavourite = async () => {
    if (!user || !pickupLocation || !destination || !pickupCoords || !destCoords) return
    
    try {
      const response = await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          routeName: `${pickupLocation} to ${destination}`,
          start: pickupLocation,
          end: destination,
          // Sending coordinates
          pickupLat: pickupCoords.lat,
          pickupLng: pickupCoords.lng,
          dropLat: destCoords.lat,
          dropLng: destCoords.lng
        })
      })
      const data = await response.json()
      if (data.success) {
        setIsSaved(true) 
        loadUserData(user.id) 
      } else {
        alert("Failed to save favourite.")
      }
    } catch (error) {
      console.error('Error saving favourite:', error)
    }
  }

  // UPDATED: Loads coordinates and auto-fetches route
  const loadFavourite = (fav) => {
    setPickupLocation(fav.start)
    setDestination(fav.end)
    setFareResults(null) 
    setIsSaved(true)

    // If we have coordinates, load the map immediately
    if (fav.pickup_lat && fav.pickup_lng && fav.drop_lat && fav.drop_lng) {
        const pCoords = { lat: fav.pickup_lat, lng: fav.pickup_lng, name: fav.start }
        const dCoords = { lat: fav.drop_lat, lng: fav.drop_lng, name: fav.end }
        
        setPickupCoords(pCoords)
        setDestCoords(dCoords)
        
        // Auto fetch the route!
        fetchRoute(pCoords, dCoords)
    } else {
        // Fallback for old favorites without coordinates
        alert(`Loaded: ${fav.route_name}. Tap 'Search' to refresh map.`)
    }
  }

  const handleSelectFare = (fare) => {
      if (!user) {
          alert("Please login to book a ride.")
          handleLogin()
          return
      }
      setSelectedFare({
          ...fare,
          userId: user.id,
          pickup: { ...pickupCoords, name: pickupLocation },
          destination: { ...destCoords, name: destination },
      })
      setIsPaymentOpen(true)
  }

  const onBookingSuccess = () => {
      if (user) loadUserData(user.id)
  }

  const handleResumeRide = (ride) => {
    const params = new URLSearchParams({
        mode: 'live',
        rideId: ride.id,
        service: ride.booked_service || 'Cab',
        price: ride.final_price || '0',
        pickup: ride.start_location,
        drop: ride.destination,
        pickupLat: ride.pickup_lat,
        pickupLng: ride.pickup_lng,
        dropLat: ride.drop_lat,
        dropLng: ride.drop_lng,
        vehicle: 'Cab',
        startTime: ride.timestamp 
    })
    router.push(`/ride?${params.toString()}`)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">FairFare</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <OverlayMenu 
                  user={user}
                  searchHistory={searchHistory}
                  favourites={favourites}
                  loadFavourite={loadFavourite}
                  handleLogout={handleLogout}
              />
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
        <div className="absolute inset-0">
          <MapComponent 
            pickup={pickupCoords} 
            destination={destCoords}
            route={route}
          />
        </div>

        {activeRide && (
            <DraggableLiveFab onClick={() => handleResumeRide(activeRide)} />
        )}

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

              {route && (
                <div className="flex items-center justify-center gap-6 py-2 bg-secondary/50 rounded-md text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">{(route.distance / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="w-px h-4 bg-border"></div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">{Math.round(route.duration / 60)} min</span>
                    </div>
                </div>
              )}

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
                ) : 'Compare Fares'}
              </Button>
              
              {pickupLocation && destination && fareResults && (
                <Button 
                  variant={isSaved ? "secondary" : "outline"}
                  className={`w-full transition-all ${isSaved ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}`}
                  size="sm"
                  onClick={saveAsFavourite}
                  disabled={!user || isSaved}
                >
                  {isSaved ? (
                    <>
                        <Check className="w-4 h-4 mr-2" /> Saved
                    </>
                  ) : (
                    <>
                        <Star className="w-4 h-4 mr-2" /> {user ? 'Save as Favourite' : 'Login to Save'}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

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
                    } hover:shadow-lg transition-all cursor-pointer`}
                    onClick={() => handleSelectFare(fare)} 
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
                        <div className="text-right flex flex-col items-end">
                            <p className="text-2xl font-bold">₹{fare.price}</p>
                            {fare.cheapest && (
                                <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-1">
                                    <TrendingDown className="w-3 h-3" />
                                    Best Price
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-blue-600 text-xs font-medium mt-1">
                                <IndianRupee className="w-3 h-3" />
                                Book Now
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">
                * Tap any card to proceed to mock payment/booking. Prices are estimated based on real distance and may vary
              </p>
            </div>
          </div>
        )}
      </div>

      <MockPaymentDialog 
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        fareData={selectedFare}
        onBookingSuccess={onBookingSuccess}
      />
    </div>
  )
}