'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Car } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MockPaymentDialog({ open, onOpenChange, fareData }) {
  const router = useRouter()

  const handleProceed = () => {
    if (!fareData) return

    const params = new URLSearchParams({
      mode: 'payment', // Initial mode is payment
      service: fareData.service,
      price: fareData.price,
      pickup: fareData.pickup.name,
      drop: fareData.destination.name,
      pickupLat: fareData.pickup.lat,
      pickupLng: fareData.pickup.lng,
      dropLat: fareData.destination.lat,
      dropLng: fareData.destination.lng,
      userId: fareData.userId,
      vehicle: fareData.vehicleType
    })

    onOpenChange(false)
    router.push(`/ride?${params.toString()}`)
  }

  if (!fareData) return null

  const Icon = Car

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2 ${
            fareData.service === 'Ola' ? 'bg-yellow-500' :
            fareData.service === 'Uber' ? 'bg-black' :
            'bg-blue-500'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl">{fareData.service}</DialogTitle>
          <DialogDescription className="text-center">
             {fareData.vehicleType} • {fareData.eta} mins away
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
            <div className="flex justify-between font-medium text-lg border-b pb-2">
                <span>Total Fare</span>
                <span className="font-bold text-green-600">₹{fareData.price}</span>
            </div>
            <div className="text-sm text-gray-500 text-center">
                Click proceed to choose payment method
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
            </Button>
            <Button onClick={handleProceed} className="bg-black hover:bg-gray-800 text-white">
                Proceed to Payment
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}