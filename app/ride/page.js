'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2, Car, Phone, Star, Banknote, Wallet, CreditCard, XCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  
  // Get data from URL
  const mode = searchParams.get('mode') 
  const service = searchParams.get('service')
  const price = searchParams.get('price')
  const pickupName = searchParams.get('pickup')
  const dropName = searchParams.get('drop')
  const userId = searchParams.get('userId')
  const vehicleType = searchParams.get('vehicle')
  const startTimeStr = searchParams.get('startTime')
  
  const initialRideId = searchParams.get('rideId')
  const [rideId, setRideId] = useState(initialRideId)

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

  const pickupCoords = (pickupLat && pickupLng) ? { lat: pickupLat, lng: pickupLng, name: pickupName } : null
  const dropCoords = (dropLat && dropLng) ? { lat: dropLat, lng: dropLng, name: dropName } : null

  // 1. Driver Data Pool (5 Drivers)
  const drivers = [
    { name: "Rajesh Kumar", rating: 4.8, car: "Swift Dzire", plate: "KA 01 AB 1234", otp: "4821" },
    { name: "Suresh Menon", rating: 4.9, car: "Toyota Etios", plate: "KA 05 MJ 7890", otp: "1920" },
    { name: "Abdul Rahman", rating: 4.7, car: "Honda Amaze", plate: "KA 53 EN 4567", otp: "5678" },
    { name: "Deepak Singh", rating: 4.6, car: "Hyundai Aura", plate: "KA 03 HA 3210", otp: "9012" },
    { name: "Venkatesh R", rating: 4.8, car: "Tata Tigor", plate: "KA 04 XY 6543", otp: "3456" }
  ]

  // 2. Select Driver deterministically based on Ride ID
  // UPDATED: Use the last 4 characters for better randomness
  const getDriverIndex = (id) => {
    if (!id) return 0
    // Use the last 4 chars of the UUID to generate the index
    const lastPart = id.slice(-4);
    let hash = 0;
    for (let i = 0; i < lastPart.length; i++) {
        hash = lastPart.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % drivers.length;
  }
  
  const driver = drivers[getDriverIndex(rideId)]

  // 3. Handle Resume/Persistence
  useEffect(() => {
    if (mode === 'live') {
        setStep('live')
        
        if (startTimeStr) {
            const startTime = new Date(startTimeStr).getTime()
            const now = Date.now()
            const elapsedSec = (now - startTime) / 1000
            
            if (elapsedSec > 15) {
                setStatus("Ride in progress")
                setProgress(90)
            } else if (elapsedSec > 10) {
                setStatus("Driver has arrived at pickup")
                setProgress(80)
            } else if (elapsedSec > 6) {
                setStatus("Driver is 2 mins away")
                setProgress(60)
            } else if (elapsedSec > 3) {
                setStatus("Driver is on the way") // Generic message
                setProgress(40)
            } else {
                setStatus("Driver assigned!")
                setProgress(20)
            }
        } else {
            setStatus('Finding your driver...')
            setProgress(0)
            startLiveUpdates()
        }
    }
  }, [mode, startTimeStr])

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
  }, [pickupLat, pickupLng, dropLat, dropLng])

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
          
          // Payment Confirmation Feedback
          if (paymentMethod === 'cash') {
             toast({
               title: "Booking Confirmed",
               description: "Please pay the driver after the ride.",
               duration: 4000,
             })
          } else {
             toast({
               title: "Payment Confirmed",
               description: `Successfully paid ₹${price} via ${paymentMethod.toUpperCase()}.`,
               duration: 4000,
               className: "bg-green-50 border-green-200"
             })
          }

          setTimeout(() => {
            setLoading(false)
            setStep('live')
            startLiveUpdates()
          }, 1500)
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
      { msg: "Driver is on the way", prog: 40, delay: 3000 }, // Generic message
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

            {/* Driver Info - Conditional Rendering (Appears after 20% progress) */}
            {progress >= 20 && (
              <div className="flex items-center gap-4 border-b pb-4 animate-in fade-in slide-in-from-bottom-2">
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
            )}

            {/* OTP - Only show when driver assigned */}
            {progress >= 20 && (
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg animate-in fade-in">
                <span className="text-gray-500 font-medium">Start OTP</span>
                <span className="text-2xl font-bold tracking-widest">{driver.otp}</span>
              </div>
            )}

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