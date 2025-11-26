'use client'
import { useState, useEffect, useRef } from 'react'
import { Radio } from 'lucide-react'

export default function DraggableLiveFab({ onClick }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  
  // Refs to store current values for event handlers without re-binding
  const posRef = useRef({ x: 0, y: 0 })
  const dragStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Initial position (bottom right)
    const initialX = window.innerWidth - 90
    const initialY = window.innerHeight - 150
    setPos({ x: initialX, y: initialY })
    posRef.current = { x: initialX, y: initialY }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      
      const newX = e.clientX - dragStartRef.current.x
      const newY = e.clientY - dragStartRef.current.y
      
      setPos({ x: newX, y: newY })
      posRef.current = { x: newX, y: newY }
      setHasMoved(true)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchMove = (e) => {
      if (!isDragging) return
      // Prevent scrolling while dragging
      e.preventDefault() 
      
      const touch = e.touches[0]
      const newX = touch.clientX - dragStartRef.current.x
      const newY = touch.clientY - dragStartRef.current.y
      
      setPos({ x: newX, y: newY })
      posRef.current = { x: newX, y: newY }
      setHasMoved(true)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging])

  const handleStart = (clientX, clientY) => {
    setIsDragging(true)
    setHasMoved(false)
    dragStartRef.current = {
      x: clientX - posRef.current.x,
      y: clientY - posRef.current.y
    }
  }

  const handleClick = (e) => {
    if (!hasMoved) {
      onClick()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 1200,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none' 
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onClick={handleClick}
      className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-full bg-red-600 text-white shadow-2xl shadow-red-900/50 animate-in fade-in zoom-in duration-300 hover:scale-105 transition-transform active:scale-95"
    >
      <Radio className="w-6 h-6 animate-pulse" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
    </div>
  )
}