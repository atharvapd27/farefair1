'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder, icon }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef(null)
  const wrapperRef = useRef(null)

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search Nominatim API
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // Using Nominatim API - Free OpenStreetMap geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'FareFare Cab Comparison App'
          }
        }
      )
      const data = await response.json()
      
      setSuggestions(data)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  const handleInputChange = (e) => {
    const query = e.target.value
    onChange(query)

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      searchLocation(query)
    }, 500) // Wait 500ms after user stops typing
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    const location = {
      name: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    }
    
    onChange(suggestion.display_name)
    onSelect(location)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${icon === 'pickup' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          className="flex-1"
          autoComplete="off"
        />
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-start gap-2 border-b last:border-b-0"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {suggestion.address?.road || suggestion.address?.suburb || suggestion.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {suggestion.display_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
        </div>
      )}
    </div>
  )
}
