'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2, Car, Phone, Star, Banknote, Wallet, CreditCard, XCircle } from 'lucide-react'

// Dynamic import for map
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })

export default function RidePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <RideContent />
    </Suspense>
  )
}

function RideContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get data from URL
  const mode = searchParams.get('mode') 
  const service = searchParams.get('service')
  const price = searchParams.get('price')
  const pickupName = searchParams.get('pickup')
  const dropName = searchParams.get('drop')
  const userId = searchParams.get('userId')
  const vehicleType = searchParams.get('vehicle')
  
  const initialRideId = searchParams.get('rideId')
  const [rideId, setRideId] = useState(initialRideId)

  // Parse coordinates safely
  const pickupLat = parseFloat(searchParams.get('pickupLat')) || 0
  const pickupLng = parseFloat(searchParams.get('pickupLng')) || 0
  const dropLat = parseFloat(searchParams.get('dropLat')) || 0
  const dropLng = parseFloat(searchParams.get('dropLng')) || 0

  const [step, setStep] = useState(mode === 'live' ? 'live' : 'payment')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [route, setRoute] = useState(null)
  const [status, setStatus] = useState('Finding your driver...')
  const [progress, setProgress] = useState(0)

  // Map Locations
  const pickupCoords = (pickupLat && pickupLng) ? { lat: pickupLat, lng: pickupLng, name: pickupName } : null
  const dropCoords = (dropLat && dropLng) ? { lat: dropLat, lng: dropLng, name: dropName } : null

  // Initial Load Logic
  useEffect(() => {
    if (mode === 'live') {
        setStatus('Ride in progress')
        setProgress(50)
        startLiveUpdates()
    }
  }, [mode])

  // Fetch Route for Background Map
  useEffect(() => {
    if (pickupCoords && dropCoords) {
      const fetchRoute = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropCoords.lng},${dropCoords.lat}?overview=full&geometries=geojson`
          )
          const data = await response.json()
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            setRoute(data.routes[0])
          }
        } catch (error) {
          console.error('Error fetching route for background map:', error)
        }
      }
      fetchRoute()
    }
  }, [pickupLat, pickupLng, dropLat, dropLng]) // Dependency on primitives is safer

  const driver = {
    name: "Rajesh Kumar",
    rating: 4.8,
    car: "Swift Dzire",
    plate: "KA 01 AB 1234",
    phone: "+91 98765 43210"
  }

  const handleConfirmBooking = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings/mock-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          pickup: { name: pickupName, lat: pickupLat, lng: pickupLng },
          destination: { name: dropName, lat: dropLat, lng: dropLng },
          service,
          price
        })
      })
      const data = await res.json()
      
      if (data.success) {
          setRideId(data.bookingId)
          // Small delay for UX
          setTimeout(() => {
            setLoading(false)
            setStep('live')
            startLiveUpdates()
          }, 1000)
      } else {
          alert(data.message || "Booking failed. Please try again.")
          setLoading(false)
      }
    } catch (error) {
      console.error("Booking error:", error)
      alert("Network error. Please check your connection.")
      setLoading(false)
    }
  }

  const handleEndRide = async () => {
      if (rideId) {
          await fetch('/api/bookings/end-ride', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rideId })
          })
      }
      router.push('/')
  }

  const startLiveUpdates = () => {
    const statuses = [
      { msg: "Driver assigned!", prog: 20, delay: 1000 },
      { msg: `${driver.name} is on the way`, prog: 40, delay: 3000 },
      { msg: "Driver is 2 mins away", prog: 60, delay: 6000 },
      { msg: "Driver has arrived at pickup", prog: 80, delay: 10000 },
      { msg: "Ride in progress", prog: 90, delay: 15000 },
    ]

    statuses.forEach(({ msg, prog, delay }) => {
      setTimeout(() => {
        setStatus(msg)
        setProgress(prog)
      }, delay)
    })
  }

  // --- 1. Payment View ---
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Confirm Booking</h1>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-lg">{service} {vehicleType}</span>
                <span className="font-bold text-xl text-green-600">₹{price}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 border-t pt-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                  <p>{pickupName}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                  <p>{dropName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="w-5 h-5 text-green-600" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">Cash</Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="upi" id="upi" />
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="upi" className="flex-1 cursor-pointer">UPI (GPay/PhonePe)</Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">Credit/Debit Card</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-12 text-lg bg-black hover:bg-gray-800"
            onClick={handleConfirmBooking}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Processing...
              </>
            ) : "Confirm Ride"}
          </Button>

          <Button variant="ghost" className="w-full" onClick={() => router.back()}>Cancel</Button>
        </div>
      </div>
    )
  }

  // --- 2. Live Ride View ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      
      {/* Real Map Background */}
      <div className="absolute inset-0 z-0">
         {pickupCoords && dropCoords && (
             <MapComponent 
                pickup={pickupCoords} 
                destination={dropCoords}
                route={route}
             />
         )}
      </div>

      <div className="mt-auto p-4 z-10 w-full max-w-md mx-auto">
        <Card className="shadow-2xl border-t-4 border-green-500 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            
            {/* Status Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{status}</h2>
                <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                   LIVE
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000 ease-in-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>

            {/* Driver Info */}
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <Car className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{driver.name}</h3>
                <p className="text-gray-500">{driver.car} • {driver.plate}</p>
                <div className="flex items-center gap-1 mt-1">
                   <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                   <span className="text-sm font-medium">{driver.rating}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="icon" className="rounded-full bg-green-600 hover:bg-green-700">
                  <Phone className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* OTP */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <span className="text-gray-500 font-medium">Start OTP</span>
              <span className="text-2xl font-bold tracking-widest">4821</span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => router.push('/')}>
                    Home
                </Button>
                <Button variant="destructive" onClick={handleEndRide} className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> End Ride
                </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}