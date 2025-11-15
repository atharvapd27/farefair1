# FareFare - Real-Time Cab Price Comparison

🚕 Compare prices across Ola, Uber, and Rapido to find the cheapest ride!

## Features

### ✨ Core Features
- **Real-time Fare Comparison**: Compare fares from Ola, Uber, and Rapido instantly
- **Interactive Map**: Visual route display with pickup and destination markers
- **Smart Price Calculation**: Mock fare calculation based on distance and surge pricing
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
- **Map Integration**: Leaflet + React-Leaflet + OpenStreetMap
- **Database**: In-memory storage (ready for Supabase integration)
- **Authentication**: Custom auth (ready for Supabase Auth)

## Installation

1. **Clone and install dependencies:**
```bash
cd /app
yarn install
```

2. **Start the development server:**
```bash
yarn dev
```

3. **Access the app:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## Project Structure

```
/app/
├── app/
│   ├── page.js                 # Main fare comparison page
│   ├── login/page.js           # Login/Signup page
│   ├── globals.css             # Global styles
│   └── api/[[...path]]/
│       └── route.js            # Backend API routes
├── components/
│   ├── ui/                     # shadcn UI components
│   └── MapComponent.js         # Interactive map component
├── lib/
│   └── supabase.js             # Supabase client configuration
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user

### Fare Comparison
- `POST /api/fares/compare` - Compare fares for given route
  ```json
  {
    "pickup": { "lat": 12.9716, "lng": 77.5946, "name": "Location Name" },
    "destination": { "lat": 12.9352, "lng": 77.6245, "name": "Destination Name" },
    "userId": "optional-user-id"
  }
  ```

### User Data
- `GET /api/user/{userId}` - Get user's search history and favourites
- `POST /api/favourites` - Save a route as favourite

## Fare Calculation Formula

The app uses a realistic fare calculation formula:

### Ola
- Base Fare: ₹30
- Per KM Rate: ₹12
- Surge Multiplier: 1.0x - 1.8x
- Vehicle Type: Micro/Mini

### Uber
- Base Fare: ₹40
- Per KM Rate: ₹11
- Surge Multiplier: 1.0x - 1.5x
- Vehicle Type: UberGo

### Rapido
- Base Fare: ₹20
- Per KM Rate: ₹8
- Surge Multiplier: 1.0x - 1.3x
- Vehicle Type: Bike

**Formula**: `Final Fare = (Base Fare + Distance × Per KM Rate) × Surge Multiplier`

## Mock Location Database

The app includes mock locations for testing:
- Bangalore (12.9716, 77.5946)
- Koramangala (12.9352, 77.6245)
- Whitefield (12.9698, 77.7500)
- Indiranagar (12.9716, 77.6412)
- MG Road (12.9716, 77.6147)
- Airport (13.1986, 77.7066)
- Electronic City (12.8456, 77.6603)

Any other location will generate random coordinates around Bangalore.

## Supabase Integration (Optional)

Currently, the app uses in-memory storage. To integrate with Supabase:

1. **Create a Supabase project** at https://supabase.com

2. **Add environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run the database schema:**

Go to Supabase SQL Editor and run:

```sql
-- Search History table
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  start_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  ola_price INTEGER NOT NULL,
  uber_price INTEGER NOT NULL,
  rapido_price INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Favourites table
CREATE TABLE favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  route_name TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_favourites_user ON favourites(user_id);
```

4. **Update API routes** in `/app/app/api/[[...path]]/route.js` to use Supabase client

## Usage

1. **Compare Fares:**
   - Enter pickup location (e.g., "Koramangala")
   - Enter destination (e.g., "Airport")
   - Click "Compare Fares"
   - View results with best price highlighted

2. **Create Account:**
   - Click "Login" button
   - Switch to "Sign Up" tab
   - Fill in details and create account

3. **Save Favourite Routes:**
   - Login to your account
   - Compare fares for a route
   - Click "Save as Favourite"
   - Access saved routes from your profile

4. **View History:**
   - Click on your name in the header
   - View "Search History" tab
   - See all past fare comparisons

## Features Ready for Enhancement

### Future Improvements
- [ ] Real API integration with Ola, Uber, Rapido
- [ ] Google Maps Autocomplete for location search
- [ ] Real-time traffic data integration
- [ ] Push notifications for price drops
- [ ] Price alerts for favourite routes
- [ ] Share route comparison with friends
- [ ] Dark mode support
- [ ] Multi-city support
- [ ] Ride booking integration
- [ ] Price history charts

## Testing

Test the API endpoints:

```bash
# Test fare comparison
curl -X POST http://localhost:3000/api/fares/compare \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {"lat": 12.9716, "lng": 77.5946, "name": "MG Road"},
    "destination": {"lat": 12.9352, "lng": 77.6245, "name": "Koramangala"}
  }'

# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Screenshots

### Main Page
- Clean Uber-like interface
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

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License

---

**Built with ❤️ using Next.js and React**
