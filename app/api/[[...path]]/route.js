import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// In-memory storage (replace with Supabase later)
const users = new Map()
const searchHistory = []
const favourites = []

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

// Calculate fare for each service
function calculateFare(distance, service) {
  const fares = {
    Ola: {
      base: 30,
      perKm: 12,
      surgeMin: 1.0,
      surgeMax: 1.8,
      vehicleType: 'Micro/Mini',
    },
    Uber: {
      base: 40,
      perKm: 11,
      surgeMin: 1.0,
      surgeMax: 1.5,
      vehicleType: 'UberGo',
    },
    Rapido: {
      base: 20,
      perKm: 8,
      surgeMin: 1.0,
      surgeMax: 1.3,
      vehicleType: 'Bike',
    },
  }

  const fareConfig = fares[service]
  const surge = fareConfig.surgeMin + Math.random() * (fareConfig.surgeMax - fareConfig.surgeMin)
  const baseFare = fareConfig.base + (distance * fareConfig.perKm)
  const finalFare = Math.round(baseFare * surge)
  
  // Calculate ETA (5 km/h in traffic + 3-5 min pickup)
  const eta = Math.round((distance / 20) * 60) + Math.floor(Math.random() * 3) + 3

  return {
    service,
    price: finalFare,
    vehicleType: fareConfig.vehicleType,
    eta,
    surge: surge > 1.2 ? 'High demand' : 'Normal',
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url)
  const body = await request.json().catch(() => ({}))

  // Auth endpoints
  if (pathname === '/api/auth/signup') {
    const { name, email, password } = body
    
    // Check if user exists
    for (let [id, user] of users) {
      if (user.email === email) {
        return NextResponse.json({ success: false, message: 'User already exists' })
      }
    }

    const userId = uuidv4()
    const user = { id: userId, name, email, password, createdAt: new Date().toISOString() }
    users.set(userId, user)

    return NextResponse.json({ 
      success: true, 
      user: { id: userId, name, email }
    })
  }

  if (pathname === '/api/auth/login') {
    const { email, password } = body
    
    for (let [id, user] of users) {
      if (user.email === email && user.password === password) {
        return NextResponse.json({ 
          success: true, 
          user: { id: user.id, name: user.name, email: user.email }
        })
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' })
  }

  // Fare comparison endpoint
  if (pathname === '/api/fares/compare') {
    const { pickup, destination, userId } = body

    if (!pickup || !destination) {
      return NextResponse.json({ success: false, message: 'Missing location data' })
    }

    // Calculate distance
    const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
    const duration = Math.round((distance / 20) * 60) // Average 20 km/h in traffic

    // Calculate fares for all services
    const olaFare = calculateFare(distance, 'Ola')
    const uberFare = calculateFare(distance, 'Uber')
    const rapidoFare = calculateFare(distance, 'Rapido')

    const fares = [olaFare, uberFare, rapidoFare]
    
    // Find cheapest
    const minPrice = Math.min(...fares.map(f => f.price))
    fares.forEach(fare => {
      fare.cheapest = fare.price === minPrice
    })

    // Save to history if user is logged in
    if (userId) {
      searchHistory.push({
        id: uuidv4(),
        user_id: userId,
        start_location: pickup.name,
        destination: destination.name,
        ola_price: olaFare.price,
        uber_price: uberFare.price,
        rapido_price: rapidoFare.price,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      distance,
      duration,
      fares: fares.sort((a, b) => a.price - b.price),
    })
  }

  // Favourites endpoint
  if (pathname === '/api/favourites') {
    const { userId, routeName, start, end } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User not logged in' })
    }

    const favourite = {
      id: uuidv4(),
      user_id: userId,
      route_name: routeName,
      start,
      end,
      created_at: new Date().toISOString(),
    }

    favourites.push(favourite)

    return NextResponse.json({ success: true, favourite })
  }

  return NextResponse.json({ success: false, message: 'Endpoint not found' })
}

export async function GET(request) {
  const { pathname } = new URL(request.url)

  // Get user data (history + favourites)
  if (pathname.startsWith('/api/user/')) {
    const userId = pathname.split('/').pop()
    
    const userHistory = searchHistory
      .filter(h => h.user_id === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
    
    const userFavourites = favourites
      .filter(f => f.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return NextResponse.json({
      success: true,
      history: userHistory,
      favourites: userFavourites,
    })
  }

  return NextResponse.json({ success: false, message: 'Endpoint not found' })
}

export async function DELETE(request) {
  return NextResponse.json({ success: false, message: 'Method not implemented' })
}

export async function PUT(request) {
  return NextResponse.json({ success: false, message: 'Method not implemented' })
}
