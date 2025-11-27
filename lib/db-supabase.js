import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// --- Fare Calculator ---
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

// --- Real Database Operations ---
export const db = {
    async signUp(name, email, password, phone) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name, name: name, phone: phone }
            }
        })
        if (authError) return { success: false, message: authError.message }
        if (!authData.user) return { success: false, message: "Signup failed" }
        return { success: true, user: { id: authData.user.id, name, email } }
    },

    async login(email, password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) return { success: false, message: 'Invalid credentials' }
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', authData.user.id).single()
        return { success: true, user: { id: authData.user.id, name: profile?.name || email.split('@')[0], email: authData.user.email } }
    },

    async getHistoryAndFavourites(userId) {
        const { data: history } = await supabase
            .from('rides')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)

        const { data: favourites } = await supabase
            .from('favourites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        const mappedHistory = history?.map(h => ({ ...h, timestamp: h.created_at })) || []

        // Map DB columns to Frontend objects, including COORDINATES
        const mappedFavourites = favourites?.map(f => ({
            ...f,
            start: f.start_location,
            end: f.end_location,
            pickup_lat: f.pickup_lat,
            pickup_lng: f.pickup_lng,
            drop_lat: f.drop_lat,
            drop_lng: f.drop_lng
        })) || []

        return { history: mappedHistory, favourites: mappedFavourites }
    },

    async saveSearch(data) {
        const { data: result } = await supabase.from('rides').insert([{ ...data, status: 'searched' }]).select().single()
        return result
    },

    async saveFavourite(data) {
        // Save with coordinates
        const dbData = {
            user_id: data.user_id,
            route_name: data.route_name,
            start_location: data.start,
            end_location: data.end,
            pickup_lat: data.pickup_lat,
            pickup_lng: data.pickup_lng,
            drop_lat: data.drop_lat,
            drop_lng: data.drop_lng
        }
        const { data: result } = await supabase.from('favourites').insert([dbData]).select().single()

        if (result) {
            return { 
                ...result, 
                start: result.start_location, 
                end: result.end_location 
            }
        }
        return null
    },

    async saveCompletedRide(data) {
        const { data: result, error } = await supabase.from('rides').insert([{ ...data, status: 'ongoing' }]).select().single()
        if (error) { console.error("Supabase Insert Error:", error); return { error }; }
        return { result }
    },

    async completeRide(rideId) {
        const { error } = await supabase.from('rides').update({ status: 'completed' }).eq('id', rideId)
        return { success: !error }
    }
}