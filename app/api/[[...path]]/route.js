import { NextResponse } from 'next/server'
import { db, calculateFare } from '@/lib/db-supabase'

export async function POST(request) {
  const { pathname } = new URL(request.url)
  const body = await request.json().catch(() => ({}))

  if (pathname === '/api/auth/signup') {
    const { name, email, password, phone } = body
    const result = await db.signUp(name, email, password, phone)
    return NextResponse.json(result)
  }

  if (pathname === '/api/auth/login') {
    const { email, password } = body
    const result = await db.login(email, password)
    return NextResponse.json(result)
  }

  if (pathname === '/api/fares/compare') {
    const { pickup, destination, distance, duration, userId } = body
    if (!pickup || !destination || !distance || !duration) {
      return NextResponse.json({ success: false, message: 'Missing data' })
    }
    const distanceKm = parseFloat(distance)
    const durationMin = parseInt(duration)
    const olaFare = calculateFare(distanceKm, durationMin, 'Ola')
    const uberFare = calculateFare(distanceKm, durationMin, 'Uber')
    const rapidoFare = calculateFare(distanceKm, durationMin, 'Rapido')
    const fares = [olaFare, uberFare, rapidoFare]
    const minPrice = Math.min(...fares.map(f => f.price))
    fares.forEach(fare => fare.cheapest = fare.price === minPrice)

    if (userId) {
      await db.saveSearch({
        user_id: userId,
        start_location: pickup.name,
        destination: destination.name,
        ola_price: olaFare.price,
        uber_price: uberFare.price,
        rapido_price: rapidoFare.price,
        distance: distanceKm,
        duration: durationMin,
      })
    }
    return NextResponse.json({ success: true, distance: distanceKm, duration: durationMin, fares: fares.sort((a, b) => a.price - b.price) })
  }

  if (pathname === '/api/favourites') {
    const { userId, routeName, start, end } = body
    if (!userId) return NextResponse.json({ success: false, message: 'User not logged in' })
    const favourite = await db.saveFavourite({ user_id: userId, route_name: routeName, start, end })
    return NextResponse.json({ success: true, favourite })
  }

  // --- BOOKING ENDPOINT ---
  if (pathname === '/api/bookings/mock-book') {
    const { userId, pickup, destination, service, price } = body 

    if (!userId) {
        return NextResponse.json({ success: false, message: 'User not logged in' })
    }

    // Pass data to helper
    const { result, error } = await db.saveCompletedRide({
        user_id: userId,
        start_location: pickup.name,
        destination: destination.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: destination.lat,
        drop_lng: destination.lng,
        booked_service: service,
        final_price: price,
    })

    if (error) {
        // Send the specific DB error back to the frontend
        return NextResponse.json({ success: false, message: `DB Error: ${error.message || error.details}` })
    }

    if (result) {
        return NextResponse.json({ success: true, message: `Booked ${service}`, bookingId: result.id })
    } else {
        return NextResponse.json({ success: false, message: "Unknown booking error" })
    }
  }

  if (pathname === '/api/bookings/end-ride') {
    const { rideId } = body
    const result = await db.completeRide(rideId)
    return NextResponse.json(result)
  }

  return NextResponse.json({ success: false, message: 'Endpoint not found' })
}

export async function GET(request) {
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/api/user/')) {
    const userId = pathname.split('/').pop()
    const data = await db.getHistoryAndFavourites(userId)
    return NextResponse.json({ success: true, history: data.history, favourites: data.favourites })
  }
  return NextResponse.json({ success: false, message: 'Endpoint not found' })
}

export async function DELETE() { return NextResponse.json({ success: false }) }
export async function PUT() { return NextResponse.json({ success: false }) }