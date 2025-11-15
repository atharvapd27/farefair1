import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// In-memory storage (replace with Supabase later)
const users = new Map()
const searchHistory = []
const favourites = []

// Calculate fare for each service using REAL distance and time from OSRM
function calculateFare(distance, duration, service) {
  const fares = {
    Ola: {
      base: 30,
      perKm: 12,
      perMin: 1.5,
      surgeMin: 1.0,
      surgeMax: 1.8,
      vehicleType: 'Micro/Mini',
    },
    Uber: {
      base: 40,
      perKm: 11,
      perMin: 1.2,
      surgeMin: 1.0,
      surgeMax: 1.5,
      vehicleType: 'UberGo',
    },
    Rapido: {
      base: 20,
      perKm: 8,
      perMin: 0.8,
      surgeMin: 1.0,
      surgeMax: 1.3,
      vehicleType: 'Bike',
    },
  }

  const fareConfig = fares[service]
  
  // Random surge multiplier
  const surge = fareConfig.surgeMin + Math.random() * (fareConfig.surgeMax - fareConfig.surgeMin)
  
  // Calculate fare using REAL distance and time
  const baseFare = fareConfig.base + (distance * fareConfig.perKm) + (duration * fareConfig.perMin)
  const finalFare = Math.round(baseFare * surge)
  
  // Calculate ETA (add pickup time)
  const eta = duration + Math.floor(Math.random() * 3) + 3

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

  // Fare comparison endpoint - Using REAL distance and time from OSRM
  if (pathname === '/api/fares/compare') {
    const { pickup, destination, distance, duration, userId } = body

    if (!pickup || !destination || !distance || !duration) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing location data or route information' 
      })
    }

    // Use REAL distance and duration from OSRM (passed from frontend)
    const distanceKm = parseFloat(distance)
    const durationMin = parseInt(duration)

    // Calculate fares for all services using REAL data
    const olaFare = calculateFare(distanceKm, durationMin, 'Ola')
    const uberFare = calculateFare(distanceKm, durationMin, 'Uber')
    const rapidoFare = calculateFare(distanceKm, durationMin, 'Rapido')

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
        distance: distanceKm,
        duration: durationMin,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      distance: distanceKm,
      duration: durationMin,
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
