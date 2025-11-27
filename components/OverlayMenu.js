'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Clock, TrendingDown, User, Star, MapPin, LayoutDashboard, Radio, Wallet } from 'lucide-react'
import ChartPlaceholder from './ui/ChartPlaceholder'

export default function OverlayMenu({ user, searchHistory, favourites, loadFavourite, handleLogout }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const activeRides = searchHistory.filter(h => h.status === 'ongoing')
  const pastRides = searchHistory.filter(h => h.status !== 'ongoing')

  const totalSpent = searchHistory.reduce((acc, ride) => {
    return acc + (Number(ride.final_price) || 0)
  }, 0)

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
        // ADDED: Pass Start Time
        startTime: ride.timestamp 
    })
    setOpen(false)
    router.push(`/ride?${params.toString()}`)
  }

  const RideItem = ({ ride, isFavourite, onClick, isActive }) => {
      const bookedService = ride.booked_service;
      const serviceColor = bookedService === 'Ola' ? 'bg-yellow-500' :
                           bookedService === 'Uber' ? 'bg-black' :
                           bookedService === 'Rapido' ? 'bg-blue-500' : 'bg-gray-400';

      return (
        <Card className={`hover:shadow-md transition-shadow mb-3 ${isFavourite || isActive ? 'cursor-pointer' : ''} ${isActive ? 'border-green-500 border-l-4' : ''}`} onClick={isFavourite ? onClick : (isActive ? () => handleResumeRide(ride) : undefined)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                    {isFavourite ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ) : bookedService ? (
                        <div className={`w-3 h-3 rounded-full ${serviceColor}`}></div>
                    ) : (
                        <MapPin className="w-4 h-4 text-gray-500" />
                    )}
                  <span className='truncate line-clamp-1 max-w-[180px]'>
                    {isFavourite ? ride.route_name : `${ride.start_location || ride.start} → ${ride.destination || ride.end}`}
                  </span>
                </div>
                
                <div className="flex flex-col text-xs text-gray-600 mt-1">
                    {isActive && <span className="font-bold text-green-600 flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" /> Live Ride • Track Now</span>}
                    {bookedService && !isActive && <span className="font-semibold text-green-600">Booked: {bookedService} @ ₹{ride.final_price}</span>}
                    {!bookedService && !isActive && !isFavourite && <span className="text-gray-400">Search only</span>}
                </div>
                
              </div>
              <div className="text-xs text-gray-500 text-right flex flex-col justify-between h-full min-w-[70px]">
                {ride.timestamp && new Date(ride.timestamp).toLocaleDateString()}
                {isFavourite && <Button size="sm" variant="outline" className='mt-2 h-7 text-xs' onClick={(e) => { e.stopPropagation(); loadFavourite(ride); setOpen(false); }}>Use Route</Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative inline-block">
            <Button variant="ghost" size="sm" className="bg-white/50 hover:bg-white/80 backdrop-blur-sm border">
            <User className="w-4 h-4 mr-2" />
            {user ? user.name : 'Guest'}
            </Button>
            {activeRides.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-auto px-1.5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white animate-pulse">
                    LIVE
                </span>
            )}
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-xl w-[95vw] h-[550px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">User Menu</DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 shrink-0">
                <TabsList className="grid w-full grid-cols-3 h-10">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="rides">History</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                
                <TabsContent value="dashboard" className="mt-0 space-y-4 h-full">
                    <h3 className="text-lg font-semibold mb-4">Ride Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ChartPlaceholder title="Total Spent" icon={Wallet} description={`₹${totalSpent.toLocaleString()}`} subtext="(Lifetime spend)" />
                        <ChartPlaceholder title="Rides Completed" icon={Clock} description={pastRides.filter(h => h.booked_service).length} subtext="(All time)" />
                        <ChartPlaceholder title="Total Searches" icon={LayoutDashboard} description={searchHistory.length} subtext="(Includes searches)" />
                        <ChartPlaceholder title="Favourite Routes" icon={Star} description={favourites.length} subtext="(Saved items)" />
                    </div>
                </TabsContent>

                <TabsContent value="rides" className="mt-0 h-full">
                    <h3 className="text-lg font-semibold mb-4">Your Rides</h3>
                    
                    {activeRides.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Live Now</h4>
                            {activeRides.map((ride, idx) => (
                                <RideItem key={`active-${idx}`} ride={ride} isActive={true} />
                            ))}
                        </div>
                    )}

                    <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Past History</h4>
                    {pastRides.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">No past history</div>
                    ) : (
                        pastRides.map((search, idx) => (
                            <RideItem key={idx} ride={search} isFavourite={false} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="profile" className="mt-0 h-full">
                    <Card className="shadow-none border-0 p-0">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between gap-4 border-b pb-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                                        {user?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className='overflow-hidden'>
                                        <h3 className="text-xl font-bold truncate">{user?.name}</h3>
                                        <p className="text-gray-600 text-sm truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">My Favourite Routes</h3>
                                <span className="text-xs text-muted-foreground">{favourites.length} saved</span>
                            </div>
                            <div className='space-y-1'>
                                {favourites.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8 border rounded-lg border-dashed">No favourite routes yet</p>
                                ) : (
                                    favourites.map((fav, idx) => (
                                        <RideItem key={idx} ride={fav} isFavourite={true} onClick={() => loadFavourite(fav)} />
                                    ))
                                )}
                            </div>
                            <Button variant="destructive" className="w-full mt-8" onClick={handleLogout}>Logout</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}