# FareFare - Real-Time Cab Price Comparison

🚕 Compare prices across Ola, Uber, and Rapido to find the cheapest ride!

## Features

### ✨ Core Features
- **Real-time Fare Comparison**: Compare fares from Ola, Uber, and Rapido instantly
- **Interactive Map**: Leaflet.js + OpenStreetMap with real route visualization
- **Real Location Search**: Nominatim API autocomplete with actual place suggestions
- **Real Routing**: OSRM routing engine for accurate routes, distance, and time
- **Smart Price Calculation**: Fare calculation based on REAL distance and time (not simulated)
- **Best Price Highlighting**: Automatically highlights the cheapest option
- **ETA Estimation**: Shows estimated time of arrival for each service

### 👤 User Features
- **User Authentication**: Login/Signup functionality
- **Search History**: View your past fare comparisons
- **Favourite Routes**: Save frequently used routes for quick access
- **User Profile**: Manage your account and preferences

### 🎨 UI/UX
- **Uber-inspired Design**: Clean, modern, and intuitive interface
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Interactive Map**: Powered by Leaflet and OpenStreetMap
- **Smooth Animations**: Beautiful transitions and loading states

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Map System**: 
  - **Leaflet.js** - Interactive maps (NO API KEY NEEDED)
  - **OpenStreetMap** - Free map tiles (NO API KEY NEEDED)
  - **Nominatim API** - Real geocoding and autocomplete (FREE FOREVER)
  - **OSRM** - Real routing with distance/time (FREE FOREVER)
- **Database**: In-memory storage (ready for Supabase integration)
- **Authentication**: Custom auth (ready for Supabase Auth)

2. **Access the app:**
- https://fairfare-iota.vercel.app/

The app now uses **100% REAL location data**:

### Location Search (Nominatim API)
- Type any real place name (e.g., "MG Road Bangalore", "Indiranagar", "Koramangala")
- Get autocomplete suggestions from actual OpenStreetMap database
- Select a place to get its exact latitude/longitude
- **No random coordinates, no mock data**

### Routing (OSRM API)
- Real road-based routing between any two points
- Actual driving distance in kilometers
- Accurate travel time in minutes
- Real route polyline displayed on map

- 

## Screenshots

### Main Page
- Clean interface
- Interactive map with route visualization
- Easy-to-use location inputs

### Fare Results
- Side-by-side comparison
- Best price highlighted in green
- Vehicle type and ETA information
- Surge pricing indicators

### User Profile
- Search history with timestamps
- Saved favourite routes
- Quick route access


**Built with ❤️ using Next.js and React**
