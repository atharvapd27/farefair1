import { v4 as uuidv4 } from 'uuid'

// --- In-memory Storage (Mock Database) ---
const users = new Map()
const searchHistory = []
const favourites = []

// Mock User
const testUserId = 'test-user-123'
users.set(testUserId, {
    id: testUserId,
    name: 'Test User',
    email: 'test@farefare.com',
    password: 'password',
    createdAt: new Date().toISOString()
})

searchHistory.push({
  id: uuidv4(),
  user_id: testUserId,
  start_location: 'Koramangala',
  destination: 'Airport',
  ola_price: 650,
  uber_price: 600,
  rapido_price: 450,
  distance: 30.6,
  duration: 55,
  timestamp: new Date(Date.now() - 86400000).toISOString(),
  status: 'completed'
})

favourites.push({
  id: uuidv4(),
  user_id: testUserId,
  route_name: 'Home to Work (Koramangala to Airport)',
  start: 'Koramangala',
  end: 'Airport',
  created_at: new Date().toISOString(),
})

export function calculateFare(distance, duration, service) {
  const fares = {
    Ola: { base: 30, perKm: 12, perMin: 1.5, surgeMin: 1.0, surgeMax: 1.8, vehicleType: 'Micro/Mini' },
    Uber: { base: 40, perKm: 11, perMin: 1.2, surgeMin: 1.0, surgeMax: 1.5, vehicleType: 'UberGo' },
    Rapido: { base: 20, perKm: 8, perMin: 0.8, surgeMin: 1.0, surgeMax: 1.3, vehicleType: 'Bike' },
  }
  const fareConfig = fares[service]
  const surge = fareConfig.surgeMin + Math.random() * (fareConfig.surgeMax - fareConfig.surgeMin)
  const baseFare = fareConfig.base + (distance * fareConfig.perKm) + (duration * fareConfig.perMin)
  return {
    service,
    price: Math.round(baseFare * surge),
    vehicleType: fareConfig.vehicleType,
    eta: duration + Math.floor(Math.random() * 3) + 3,
    surge: surge > 1.2 ? 'High demand' : 'Normal',
  }
}

export const db = {
    async signUp(name, email, password) {
        if (Array.from(users.values()).some(user => user.email === email)) {
            return { success: false, message: 'User already exists' }
        }
        const userId = uuidv4()
        const user = { id: userId, name, email, password, createdAt: new Date().toISOString() }
        users.set(userId, user)
        return { success: true, user: { id: userId, name, email } }
    },

    async login(email, password) {
        const user = Array.from(users.values()).find(u => u.email === email && u.password === password)
        if (user) {
            return { success: true, user: { id: user.id, name: user.name, email: user.email } }
        }
        return { success: false, message: 'Invalid credentials' }
    },

    async getHistoryAndFavourites(userId) {
        const userHistory = searchHistory
            .filter(h => h.user_id === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        
        const userFavourites = favourites
            .filter(f => f.user_id === userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        return { history: userHistory, favourites: userFavourites }
    },

    async saveSearch(data) {
        const newSearch = { id: uuidv4(), ...data, timestamp: new Date().toISOString() }
        searchHistory.push(newSearch)
        return newSearch
    },

    async saveFavourite(data) {
        const newFavourite = { id: uuidv4(), ...data, created_at: new Date().toISOString() }
        favourites.push(newFavourite)
        return newFavourite
    },

    async saveCompletedRide(data) {
        const newRide = {
            id: uuidv4(),
            ...data,
            status: 'ongoing', 
            timestamp: new Date().toISOString(),
        }
        searchHistory.push(newRide)
        return newRide
    },

    // NEW: Function to complete a ride
    async completeRide(rideId) {
        const rideIndex = searchHistory.findIndex(r => r.id === rideId)
        if (rideIndex !== -1) {
            searchHistory[rideIndex].status = 'completed'
            return { success: true }
        }
        return { success: false, message: 'Ride not found' }
    }
}